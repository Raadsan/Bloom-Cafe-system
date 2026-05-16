import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'

// GET RECEIPT SETTINGS
export const getReceiptSettings = async (req, res) => {
  try {
    let settings = await prisma.receiptSettings.findFirst()
    
    if (!settings) {
      // Create default if not exists
      settings = await prisma.receiptSettings.create({
        data: {
          id: 1,
          name: 'My Restaurant',
          address: '123 Restaurant St',
          phone: '+123 456 789'
        }
      })
    }

    res.status(200).json({
      success: true,
      data: settings
    })
  } catch (error) {
    console.error('Get Receipt Settings Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    })
  }
}

// UPDATE RECEIPT SETTINGS
export const updateReceiptSettings = async (req, res) => {
  try {
    const { name, address, phone, email, logoUrl, vatNumber, footerText } = req.body

    const settings = await prisma.receiptSettings.upsert({
      where: { id: 1 },
      update: {
        name,
        address,
        phone,
        email,
        logoUrl,
        vatNumber,
        footerText
      },
      create: {
        id: 1,
        name: name || 'My Restaurant',
        address,
        phone,
        email,
        logoUrl,
        vatNumber,
        footerText
      }
    })

    logAudit({ 
      userId: req.user?.id, 
      action: 'Updated', 
      entity: 'ReceiptSettings', 
      entityId: settings.id, 
      description: 'Updated restaurant receipt settings' 
    })

    res.status(200).json({
      success: true,
      message: 'Receipt settings updated successfully',
      data: settings
    })
  } catch (error) {
    console.error('Update Receipt Settings Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    })
  }
}
