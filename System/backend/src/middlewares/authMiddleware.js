import jwt from 'jsonwebtoken'
import prisma from '../config/db.js'

// CHECK JWT TOKEN
export const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization

    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided'
      })
    }

    token = token.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account is inactive'
      })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      fullName: user.fullName
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token'
    })
  }
}

// CHECK GRANULAR PERMISSIONS
export const checkPermission = (menuUrl, permissionType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' })
      }

      // Admin has full access
      if (req.user.role === 'admin' || req.user.role === 'Admin') {
        return next()
      }

      const roleId = req.user.roleId

      // Check menu access
      const menuAccess = await prisma.roleMenuAccess.findFirst({
        where: {
          roleId,
          menu: { url: menuUrl }
        }
      })

      if (menuAccess && menuAccess[permissionType]) {
        return next()
      }

      // Check submenu access
      const subMenuAccess = await prisma.roleSubMenuAccess.findFirst({
        where: {
          roleMenuAccess: { roleId },
          submenu: { url: menuUrl }
        }
      })

      if (subMenuAccess && subMenuAccess[permissionType]) {
        return next()
      }

      return res.status(403).json({
        success: false,
        message: `Access denied: insufficient '${permissionType}' permission for ${menuUrl}`
      })
    } catch (error) {
      console.error('Permission check error:', error)
      return res.status(500).json({ success: false, message: 'Server error during permission check' })
    }
  }
}

// CHECK ROLE ACCESS
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions'
      })
    }

    next()
  }
}