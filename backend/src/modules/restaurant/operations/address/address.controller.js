import prisma from '../../../../config/db.js'

// GET ALL ADDRESSES FOR A CUSTOMER
export const getCustomerAddresses = async (req, res) => {
  try {
    const { customerId } = req.params
    const addresses = await prisma.address.findMany({
      where: { customerId: Number(customerId) },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, data: addresses })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// CREATE NEW ADDRESS
export const createAddress = async (req, res) => {
  try {
    const { customerId, name, district, street, phone, isDefault } = req.body

    // If isDefault is true, unset other defaults for this customer
    if (isDefault) {
      await prisma.address.updateMany({
        where: { customerId: Number(customerId), isDefault: true },
        data: { isDefault: false }
      })
    }

    const address = await prisma.address.create({
      data: {
        customerId: Number(customerId),
        name,
        district,
        street,
        phone,
        isDefault: isDefault || false
      }
    })

    res.status(201).json({ success: true, data: address })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// SET DEFAULT ADDRESS
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params
    const address = await prisma.address.findUnique({ where: { id: Number(id) } })

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' })
    }

    await prisma.address.updateMany({
      where: { customerId: address.customerId, isDefault: true },
      data: { isDefault: false }
    })

    const updatedAddress = await prisma.address.update({
      where: { id: Number(id) },
      data: { isDefault: true }
    })

    res.status(200).json({ success: true, data: updatedAddress })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// DELETE ADDRESS
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.address.delete({ where: { id: Number(id) } })
    res.status(200).json({ success: true, message: 'Address deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
