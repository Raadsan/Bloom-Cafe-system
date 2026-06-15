import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'
import { ensureDiscountAdvertisementMenuItem } from './menuController.js'
import {
  isCampaignActive,
  enrichMenuItemsWithFlashSale,
  computeDiscountedPrice,
  getActiveFlashSaleMap,
  enrichMenuItemWithFlashSale,
} from '../utils/flashSaleHelper.js'

const VALID_TYPES = ['discount', 'advertisement']

const includeProducts = {
  products: {
    include: {
      menuitem: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          isAvailable: true,
          categoryId: true,
        },
      },
    },
  },
}

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`)
  }
  return date
}

function validatePngImage(imageUrl) {
  if (!imageUrl) return false
  const value = String(imageUrl).trim()
  if (value.startsWith('data:image/png')) return true
  if (/\.png(\?.*)?$/i.test(value)) return true
  return false
}

function normalizeType(type) {
  const value = String(type || '').trim().toLowerCase()
  if (!VALID_TYPES.includes(value)) return null
  return value
}

function validatePayload(body, { isUpdate = false } = {}) {
  const type = body.type !== undefined ? normalizeType(body.type) : undefined
  const title = body.title !== undefined ? String(body.title || '').trim() : undefined
  const description =
    body.description !== undefined
      ? body.description
        ? String(body.description).trim()
        : null
      : undefined
  const imageUrl = body.imageUrl !== undefined ? body.imageUrl || null : undefined
  const url = body.url !== undefined ? (body.url ? String(body.url).trim() : null) : undefined
  const discountPercent =
    body.discountPercent !== undefined ? Number(body.discountPercent) : undefined
  const isActive = body.isActive !== undefined ? !!body.isActive : undefined
  const menuItemIds = body.menuItemIds

  let startAt
  let endAt

  if (body.startAt !== undefined) {
    startAt = parseDate(body.startAt, 'startAt')
  }
  if (body.endAt !== undefined) {
    endAt = parseDate(body.endAt, 'endAt')
  }

  if (startAt && endAt && startAt > endAt) {
    throw new Error('startAt must be before endAt')
  }

  return {
    type,
    title,
    description,
    imageUrl,
    url,
    discountPercent,
    startAt,
    endAt,
    isActive,
    menuItemIds,
    isUpdate,
  }
}

function assertCreateRules(payload) {
  if (!payload.type) {
    throw new Error('type is required (discount or advertisement)')
  }

  if (payload.type === 'advertisement') {
    if (!payload.title) throw new Error('title is required for advertisement')
    if (!payload.imageUrl) throw new Error('image is required for advertisement')
    if (!validatePngImage(payload.imageUrl)) {
      throw new Error('Advertisement image must be PNG format')
    }
  }

  if (payload.type === 'discount') {
    if (payload.discountPercent === undefined || Number.isNaN(payload.discountPercent)) {
      throw new Error('discountPercent is required for discount')
    }
    if (payload.discountPercent <= 0 || payload.discountPercent > 100) {
      throw new Error('discountPercent must be between 1 and 100')
    }
    if (!payload.startAt || !payload.endAt) {
      throw new Error('startAt and endAt are required for discount')
    }
    if (!Array.isArray(payload.menuItemIds) || payload.menuItemIds.length === 0) {
      throw new Error('Select at least one product for discount')
    }
  }
}

async function syncProducts(campaignId, menuItemIds) {
  const ids = [...new Set(menuItemIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)))]

  if (!ids.length) {
    throw new Error('Select at least one product for discount')
  }

  const existingItems = await prisma.menuitem.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })

  if (existingItems.length !== ids.length) {
    throw new Error('One or more selected products were not found')
  }

  await prisma.discountAdvertisementProduct.deleteMany({
    where: { discountAdvertisementId: campaignId },
  })

  await prisma.discountAdvertisementProduct.createMany({
    data: ids.map((menuItemId) => ({
      discountAdvertisementId: campaignId,
      menuItemId,
    })),
  })
}

export const createDiscountAdvertisement = async (req, res) => {
  try {
    await ensureDiscountAdvertisementMenuItem()

    const payload = validatePayload(req.body)
    assertCreateRules(payload)

    const created = await prisma.discountAdvertisement.create({
      data: {
        type: payload.type,
        title: payload.title || null,
        description: payload.description ?? null,
        imageUrl: payload.type === 'advertisement' ? payload.imageUrl : null,
        url: payload.type === 'advertisement' ? payload.url ?? null : null,
        discountPercent: payload.type === 'discount' ? payload.discountPercent : null,
        startAt: payload.type === 'discount' ? payload.startAt : payload.startAt ?? null,
        endAt: payload.type === 'discount' ? payload.endAt : payload.endAt ?? null,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
      },
    })

    if (payload.type === 'discount') {
      await syncProducts(created.id, payload.menuItemIds)
    }

    const data = await prisma.discountAdvertisement.findUnique({
      where: { id: created.id },
      include: includeProducts,
    })

    logAudit({
      userId: req.user?.id,
      action: 'Created',
      entity: 'DiscountAdvertisement',
      entityId: data.id,
      description: `Created ${data.type} campaign "${data.title || data.id}"`,
    })

    return res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data,
    })
  } catch (error) {
    console.error('Create DiscountAdvertisement Error:', error)

    if (error.code === 'P2000' && error.meta?.column_name === 'imageUrl') {
      return res.status(400).json({
        success: false,
        message: 'Image is too large. Use a smaller PNG image.',
      })
    }

    const message = error.message?.includes('required') || error.message?.includes('Invalid') || error.message?.includes('must')
      ? error.message
      : 'Failed to create campaign'

    return res.status(400).json({ success: false, message })
  }
}

export const getAllDiscountAdvertisements = async (req, res) => {
  try {
    const items = await prisma.discountAdvertisement.findMany({
      include: includeProducts,
      orderBy: [{ createdAt: 'desc' }],
    })

    const now = new Date()
    const data = items.map((item) => ({
      ...item,
      isCurrentlyActive: isCampaignActive(item, now),
    }))

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    })
  } catch (error) {
    console.error('Get DiscountAdvertisements Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message,
    })
  }
}

export const getDiscountAdvertisementById = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }

    const item = await prisma.discountAdvertisement.findUnique({
      where: { id },
      include: includeProducts,
    })

    if (!item) {
      return res.status(404).json({ success: false, message: 'Campaign not found' })
    }

    return res.status(200).json({
      success: true,
      data: {
        ...item,
        isCurrentlyActive: isCampaignActive(item),
      },
    })
  } catch (error) {
    console.error('Get DiscountAdvertisement Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign',
      error: error.message,
    })
  }
}

export const getHomepagePromotions = async (req, res) => {
  try {
    const now = new Date()

    const campaigns = await prisma.discountAdvertisement.findMany({
      where: { isActive: true },
      include: includeProducts,
      orderBy: [{ createdAt: 'desc' }],
    })

    const advertisements = campaigns
      .filter((item) => item.type === 'advertisement' && isCampaignActive(item, now))
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        url: item.url,
      }))

    const activeDiscounts = campaigns.filter(
      (item) => item.type === 'discount' && isCampaignActive(item, now)
    )

    const flashSaleMap = await getActiveFlashSaleMap()
    const productMap = new Map()

    for (const campaign of activeDiscounts) {
      for (const link of campaign.products) {
        const menuItem = link.menuitem
        if (!menuItem || !menuItem.isAvailable) continue

        const enriched = enrichMenuItemWithFlashSale(menuItem, flashSaleMap)
        if (!enriched.flashSale) continue

        productMap.set(menuItem.id, {
          ...enriched,
          discountPercent: enriched.flashSale.discountPercent,
          originalPrice: menuItem.price,
          salePrice: enriched.salePrice,
        })
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        advertisements,
        flashSaleProducts: Array.from(productMap.values()),
      },
    })
  } catch (error) {
    console.error('Get Homepage Promotions Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch homepage promotions',
      error: error.message,
    })
  }
}

export const updateDiscountAdvertisement = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }

    const existing = await prisma.discountAdvertisement.findUnique({
      where: { id },
      include: { products: true },
    })

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Campaign not found' })
    }

    const payload = validatePayload(req.body, { isUpdate: true })
    const nextType = payload.type ?? existing.type

    if (nextType === 'advertisement') {
      const nextImage = payload.imageUrl ?? existing.imageUrl
      if (!nextImage) {
        return res.status(400).json({ success: false, message: 'image is required for advertisement' })
      }
      if (payload.imageUrl !== undefined && !validatePngImage(payload.imageUrl)) {
        return res.status(400).json({ success: false, message: 'Advertisement image must be PNG format' })
      }
    }

    if (nextType === 'discount') {
      const nextPercent = payload.discountPercent ?? existing.discountPercent
      if (nextPercent === null || nextPercent <= 0 || nextPercent > 100) {
        return res.status(400).json({
          success: false,
          message: 'discountPercent must be between 1 and 100',
        })
      }

      const nextStart = payload.startAt !== undefined ? payload.startAt : existing.startAt
      const nextEnd = payload.endAt !== undefined ? payload.endAt : existing.endAt
      if (!nextStart || !nextEnd) {
        return res.status(400).json({
          success: false,
          message: 'startAt and endAt are required for discount',
        })
      }
      if (new Date(nextStart) > new Date(nextEnd)) {
        return res.status(400).json({ success: false, message: 'startAt must be before endAt' })
      }
    }

    const updated = await prisma.discountAdvertisement.update({
      where: { id },
      data: {
        type: nextType,
        title: payload.title !== undefined ? payload.title || null : existing.title,
        description: payload.description !== undefined ? payload.description : existing.description,
        imageUrl:
          nextType === 'advertisement'
            ? payload.imageUrl !== undefined
              ? payload.imageUrl
              : existing.imageUrl
            : null,
        url:
          nextType === 'advertisement'
            ? payload.url !== undefined
              ? payload.url
              : existing.url
            : null,
        discountPercent:
          nextType === 'discount'
            ? payload.discountPercent !== undefined
              ? payload.discountPercent
              : existing.discountPercent
            : null,
        startAt:
          nextType === 'discount'
            ? payload.startAt !== undefined
              ? payload.startAt
              : existing.startAt
            : payload.startAt !== undefined
              ? payload.startAt
              : existing.startAt,
        endAt:
          nextType === 'discount'
            ? payload.endAt !== undefined
              ? payload.endAt
              : existing.endAt
            : payload.endAt !== undefined
              ? payload.endAt
              : existing.endAt,
        isActive: payload.isActive !== undefined ? payload.isActive : existing.isActive,
      },
    })

    if (nextType === 'discount') {
      if (Array.isArray(payload.menuItemIds)) {
        await syncProducts(updated.id, payload.menuItemIds)
      } else if (existing.type !== 'discount') {
        return res.status(400).json({
          success: false,
          message: 'Select at least one product for discount',
        })
      }
    } else {
      await prisma.discountAdvertisementProduct.deleteMany({
        where: { discountAdvertisementId: updated.id },
      })
    }

    const data = await prisma.discountAdvertisement.findUnique({
      where: { id: updated.id },
      include: includeProducts,
    })

    logAudit({
      userId: req.user?.id,
      action: 'Updated',
      entity: 'DiscountAdvertisement',
      entityId: data.id,
      description: `Updated ${data.type} campaign "${data.title || data.id}"`,
    })

    return res.status(200).json({
      success: true,
      message: 'Campaign updated successfully',
      data,
    })
  } catch (error) {
    console.error('Update DiscountAdvertisement Error:', error)

    if (error.code === 'P2000' && error.meta?.column_name === 'imageUrl') {
      return res.status(400).json({
        success: false,
        message: 'Image is too large. Use a smaller PNG image.',
      })
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to update campaign',
    })
  }
}

export const deleteDiscountAdvertisement = async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' })
    }

    const existing = await prisma.discountAdvertisement.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Campaign not found' })
    }

    await prisma.discountAdvertisement.delete({ where: { id } })

    logAudit({
      userId: req.user?.id,
      action: 'Deleted',
      entity: 'DiscountAdvertisement',
      entityId: id,
      description: `Deleted ${existing.type} campaign "${existing.title || id}"`,
    })

    return res.status(200).json({
      success: true,
      message: 'Campaign deleted successfully',
    })
  } catch (error) {
    console.error('Delete DiscountAdvertisement Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message,
    })
  }
}

export { enrichMenuItemsWithFlashSale, computeDiscountedPrice }
