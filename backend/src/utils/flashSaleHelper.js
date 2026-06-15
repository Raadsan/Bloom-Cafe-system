import prisma from '../config/db.js'

export function isCampaignActive(record, now = new Date()) {
  if (!record?.isActive) return false
  if (record.startAt && new Date(record.startAt) > now) return false
  if (record.endAt && new Date(record.endAt) < now) return false
  return true
}

export function computeDiscountedPrice(price, discountPercent) {
  const base = Math.max(0, Number(price) || 0)
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  const discounted = base * (1 - pct / 100)
  return Math.round(discounted * 100) / 100
}

export async function getActiveFlashSaleMap() {
  if (!prisma.discountAdvertisement?.findMany) {
    return new Map()
  }

  try {
    const now = new Date()
    const campaigns = await prisma.discountAdvertisement.findMany({
      where: {
        type: 'discount',
        isActive: true,
      },
      include: {
        products: {
          select: { menuItemId: true },
        },
      },
    })

    const map = new Map()

    for (const campaign of campaigns) {
      if (!isCampaignActive(campaign, now)) continue

      const pct = Math.min(100, Math.max(0, Number(campaign.discountPercent) || 0))
      if (!pct) continue

      for (const { menuItemId } of campaign.products) {
        const existing = map.get(menuItemId)
        if (!existing || pct > existing.discountPercent) {
          map.set(menuItemId, {
            discountPercent: pct,
            campaignId: campaign.id,
            startAt: campaign.startAt,
            endAt: campaign.endAt,
          })
        }
      }
    }

    return map
  } catch (error) {
    console.warn('Flash sale lookup skipped:', error.message)
    return new Map()
  }
}

export function enrichMenuItemWithFlashSale(item, flashSaleMap) {
  const flash = flashSaleMap.get(item.id)
  if (!flash) {
    return {
      ...item,
      flashSale: null,
      originalPrice: item.price,
      salePrice: item.price,
    }
  }

  const salePrice = computeDiscountedPrice(item.price, flash.discountPercent)

  return {
    ...item,
    flashSale: {
      discountPercent: flash.discountPercent,
      campaignId: flash.campaignId,
      startAt: flash.startAt,
      endAt: flash.endAt,
    },
    originalPrice: item.price,
    salePrice,
    discountPercent: flash.discountPercent,
  }
}

export async function enrichMenuItemsWithFlashSale(items) {
  const flashSaleMap = await getActiveFlashSaleMap()
  return items.map((item) => enrichMenuItemWithFlashSale(item, flashSaleMap))
}
