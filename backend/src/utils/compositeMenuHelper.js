/** Effective unit price after item-level discount (no flash sale). */
export function getItemUnitPrice(item) {
  const price = Math.max(0, Number(item.price) || 0)
  const value = Math.max(0, Number(item.discountValue) || 0)
  const type = item.discountType

  if (!type || value <= 0) return price

  if (type === 'percentage') {
    return Math.max(0, price - price * (Math.min(100, value) / 100))
  }
  if (type === 'fixed') {
    return Math.max(0, price - Math.min(price, value))
  }
  return price
}

export function sumComponentPrices(components) {
  return components.reduce((sum, row) => {
    const unit = getItemUnitPrice(row.componentItem || row)
    const qty = Math.max(1, Number(row.quantity) || 1)
    return sum + unit * qty
  }, 0)
}

export function formatComponentRow(row) {
  const item = row.componentItem
  const unitPrice = getItemUnitPrice(item)
  const qty = Math.max(1, Number(row.quantity) || 1)
  return {
    id: row.id,
    menuItemId: item.id,
    name: item.name,
    quantity: qty,
    unitPrice,
    lineTotal: Math.round(unitPrice * qty * 100) / 100,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable !== false,
  }
}

export function enrichCompositeMenuItem(item, componentRows = []) {
  const components = componentRows.map(formatComponentRow)
  const componentsTotal = Math.round(sumComponentPrices(componentRows) * 100) / 100
  const bundlePrice = Math.max(0, Number(item.price) || 0)
  const effectivePrice = getItemUnitPrice(item)
  const savings =
    item.compositePricing === 'fixed' && componentsTotal > bundlePrice
      ? Math.round((componentsTotal - effectivePrice) * 100) / 100
      : 0

  return {
    ...item,
    isComposite: true,
    components,
    componentsTotal,
    effectivePrice,
    savings,
  }
}

export async function loadCompositeComponents(compositeIds, prisma) {
  if (!compositeIds.length) return new Map()

  const rows = await prisma.menuitemcomponent.findMany({
    where: { compositeItemId: { in: compositeIds } },
    include: {
      componentItem: {
        select: {
          id: true,
          name: true,
          price: true,
          tax: true,
          discountType: true,
          discountValue: true,
          imageUrl: true,
          isAvailable: true,
          isComposite: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  })

  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.compositeItemId)) map.set(row.compositeItemId, [])
    map.get(row.compositeItemId).push(row)
  }
  return map
}

export function attachCompositesToMenuItems(items, componentMap) {
  return items.map((item) => {
    if (!item.isComposite) return item
    const rows = componentMap.get(item.id) || []
    return enrichCompositeMenuItem(item, rows)
  })
}

export function assertMenuItemSellable(menuItem, componentMap) {
  if (!menuItem?.isAvailable) {
    return menuItem?.isComposite
      ? `Combo "${menuItem.name}" is not available`
      : 'Menu item not available'
  }
  if (!menuItem.isComposite) return null

  const rows = componentMap.get(menuItem.id) || []
  if (rows.length === 0) {
    return `Combo "${menuItem.name}" has no components configured`
  }
  for (const row of rows) {
    if (!row.componentItem?.isAvailable) {
      return `Combo "${menuItem.name}" unavailable — ${row.componentItem?.name || 'item'} is out of stock`
    }
  }
  return null
}

export function buildOrderLineFromMenuItem(menuItem, quantity) {
  const qty = Math.max(1, Number(quantity) || 1)
  const unitPrice = getItemUnitPrice(menuItem)
  const itemTaxRate = Number(menuItem.tax) || 0
  const itemSubtotal = unitPrice * qty
  const itemTaxAmount = itemSubtotal * (itemTaxRate / 100)

  return {
    orderItem: {
      menuItemId: menuItem.id,
      quantity: qty,
      unitPrice,
      tax: itemTaxRate,
    },
    subtotal: itemSubtotal,
    taxAmount: itemTaxAmount,
  }
}

export async function loadMenuItemsForOrderSale(menuItemIds, prisma) {
  const uniqueIds = [...new Set(menuItemIds.map(Number).filter((id) => id > 0))]
  const items = await prisma.menuitem.findMany({
    where: { id: { in: uniqueIds } },
  })
  const compositeIds = items.filter((item) => item.isComposite).map((item) => item.id)
  const componentMap = await loadCompositeComponents(compositeIds, prisma)
  const itemMap = new Map(items.map((item) => [item.id, item]))
  return { itemMap, componentMap }
}

export async function buildOrderItemsPayload(items, prisma) {
  const menuItemIds = items.map((item) => Number(item.menuItemId))
  const { itemMap, componentMap } = await loadMenuItemsForOrderSale(menuItemIds, prisma)

  let subTotal = 0
  let taxAmount = 0
  const orderItemsData = []

  for (const item of items) {
    const menuItem = itemMap.get(Number(item.menuItemId))
    const sellError = assertMenuItemSellable(menuItem, componentMap)
    if (sellError) {
      return { error: sellError }
    }

    const line = buildOrderLineFromMenuItem(menuItem, item.quantity)
    subTotal += line.subtotal
    taxAmount += line.taxAmount
    orderItemsData.push(line.orderItem)
  }

  return { subTotal, taxAmount, orderItemsData }
}
