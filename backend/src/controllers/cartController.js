import prisma from '../config/db.js'

// CREATE OR GET CART
export const getOrCreateCart = async (req, res) => { 
  try {
    const { tableId } = req.body

    let cart = await prisma.cart.findFirst({
      where: {
        tableId: Number(tableId),
        status: 'active'
      },
      include: {
        items: {
          include: { menuItem: true }
        }
      }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          tableId: Number(tableId)
        },
        include: {
          items: true
        }
      })
    }

    res.status(200).json({
      success: true,
      data: cart
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ADD ITEM TO CART
export const addToCart = async (req, res) => {
  try {
    const { cartId, menuItemId, quantity } = req.body

    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: Number(cartId),
        menuItemId: Number(menuItemId)
      }
    })

    let item

    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (quantity || 1)
        }
      })
    } else {
      item = await prisma.cartItem.create({
        data: {
          cartId: Number(cartId),
          menuItemId: Number(menuItemId),
          quantity: quantity || 1
        }
      })
    }

    res.status(200).json({
      success: true,
      data: item
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET CART
export const getCart = async (req, res) => {
  try {
    const { id } = req.params

    const cart = await prisma.cart.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          include: { menuItem: true }
        }
      }
    })

    res.status(200).json({
      success: true,
      data: cart
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// REMOVE ITEM
export const removeCartItem = async (req, res) => {
  try {
    const { id } = req.params

    await prisma.cartItem.delete({
      where: { id: Number(id) }
    })

    res.status(200).json({
      success: true,
      message: 'Item removed'
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// CLEAR CART
export const clearCart = async (req, res) => {
  try {
    const { cartId } = req.params

    await prisma.cartItem.deleteMany({
      where: { cartId: Number(cartId) }
    })

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// CHECKOUT → CREATE ORDER
export const checkoutCart = async (req, res) => {
  try {
    const { cartId } = req.body

    const cart = await prisma.cart.findUnique({
      where: { id: Number(cartId) },
      include: {
        items: {
          include: { menuItem: true }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      })
    }

    let total = 0

    const orderItems = cart.items.map(item => {
      total += item.quantity * item.menuItem.price

      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.menuItem.price
      }
    })

    const order = await prisma.order.create({
      data: {
        tableId: cart.tableId,
        total,
        status: 'pending',
        items: {
          create: orderItems
        }
      }
    })

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id }
    })

    await prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'completed' }
    })

    res.status(200).json({
      success: true,
      message: 'Order created',
      data: order
    })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}