import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'

export const getSystemSettings = async (req, res) => {
  try {
    let settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 1,
          systemName: 'Restaurant',
          systemTagline: 'Management System',
        },
      })
    }

    res.status(200).json({ success: true, data: settings })
  } catch (error) {
    console.error('Get System Settings Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings',
      error: error.message,
    })
  }
}

export const updateSystemSettings = async (req, res) => {
  try {
    const { systemName, systemTagline, systemLogoUrl } = req.body

    const settings = await prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {
        systemName,
        systemTagline,
        systemLogoUrl,
      },
      create: {
        id: 1,
        systemName: systemName || 'Restaurant',
        systemTagline: systemTagline || 'Management System',
        systemLogoUrl,
      },
    })

    logAudit({
      userId: req.user?.id,
      action: 'Updated',
      entity: 'SystemSettings',
      entityId: settings.id,
      description: 'Updated system branding (sidebar logo)',
    })

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      data: settings,
    })
  } catch (error) {
    console.error('Update System Settings Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings',
      error: error.message,
    })
  }
}
