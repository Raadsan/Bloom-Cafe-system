import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'

// CREATE CUSTOMER
export const createCustomer = async (req, res) => {
  try {
    let { fullName, phone } = req.body

    fullName = fullName?.trim()
    phone = phone?.trim()

    if (!fullName || !phone) {
      return res.status(400).json({
        success: false,
        message: 'fullName and phone are required'
      })
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { phone }
    })

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Customer with this phone number already exists'
      })
    }

    const customer = await prisma.customer.create({
      data: { fullName, phone }
    })

    await logAudit({ userId: req.user?.id, action: 'Created', entity: 'Customer', entityId: customer.id, description: `Created customer "${customer.fullName}"` })

    clearPosCustomersCache()

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    })
  } catch (error) {
    console.error('Create Customer Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    })
  }
}

let posCustomersCache = { data: null, at: 0 }
const POS_CUSTOMERS_TTL_MS = 5 * 60 * 1000

export const clearPosCustomersCache = () => {
  posCustomersCache = { data: null, at: 0 }
}

// GET POS CUSTOMERS — lightweight list (no order counts)
export const getPosCustomers = async (req, res) => {
  try {
    const now = Date.now()
    if (posCustomersCache.data && now - posCustomersCache.at < POS_CUSTOMERS_TTL_MS) {
      return res.status(200).json({
        success: true,
        count: posCustomersCache.data.length,
        data: posCustomersCache.data,
      })
    }

    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { fullName: 'asc' },
      take: 1000,
    })

    posCustomersCache = { data: customers, at: now }

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    })
  } catch (error) {
    console.error('Get POS Customers Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    })
  }
}

// GET ALL CUSTOMERS
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: { order: true }
        },
        order: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers.map(c => ({
        ...c,
        totalOrders: c._count.order,
        lastOrderDate: c.order[0]?.createdAt || null
      }))
    })
  } catch (error) {
    console.error('Get Customers Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message
    })
  }
}

// GET CUSTOMER BY PHONE (POS lookup)
export const getCustomerByPhone = async (req, res) => {
  try {
    const phone = String(req.params.phone || '').trim()

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      })
    }

    const customer = await prisma.customer.findUnique({
      where: { phone }
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Get Customer By Phone Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    })
  }
}

// GET CUSTOMER BY ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params
    const customerId = Number(id)

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer id'
      })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        order: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    return res.status(200).json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Get Customer By Id Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    })
  }
}

// UPDATE CUSTOMER
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params
    let { fullName, phone } = req.body
    const customerId = Number(id)

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer id'
      })
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    if (phone && phone !== existingCustomer.phone) {
      const duplicate = await prisma.customer.findUnique({
        where: { phone }
      })
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Another customer with this phone number already exists'
        })
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        fullName: fullName?.trim() ?? existingCustomer.fullName,
        phone: phone?.trim() ?? existingCustomer.phone,
        updatedAt: new Date()
      }
    })

    await logAudit({ userId: req.user?.id, action: 'Updated', entity: 'Customer', entityId: updatedCustomer.id, description: `Updated customer "${updatedCustomer.fullName}"` })

    clearPosCustomersCache()

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    })
  } catch (error) {
    console.error('Update Customer Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    })
  }
}

// DELETE CUSTOMER
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params
    const customerId = Number(id)

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer id'
      })
    }

    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { order: true }
    })

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      })
    }

    if (existingCustomer.order.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing orders. Please delete orders first or deactivate the account.'
      })
    }

    await prisma.customer.delete({
      where: { id: customerId }
    })

    await logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'Customer', entityId: customerId, description: `Deleted customer "${existingCustomer.fullName}"` })

    clearPosCustomersCache()

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    })
  } catch (error) {
    console.error('Delete Customer Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    })
  }
}
