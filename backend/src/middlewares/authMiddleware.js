import jwt from 'jsonwebtoken'
import prisma from '../config/db.js'

// Production-grade in-memory cache for user sessions and permissions to eliminate remote DB latency
const userCache = new Map()
const permissionCache = new Map()
const CACHE_TTL = 300000 // 5 minutes (invalidated on create/update/delete)

export const clearAuthCaches = () => {
  userCache.clear()
  permissionCache.clear()
}

export const clearPermissionCache = () => {
  permissionCache.clear()
}

export const getCachedUser = async (userId) => {
  const now = Date.now()
  const cached = userCache.get(userId)
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.user
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })
  if (user) {
    userCache.set(userId, { user, timestamp: now })
  }
  return user
}

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

    // Load from cache to prevent remote database network roundtrips on every request
    const user = await getCachedUser(decoded.id)

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
      const cacheKey = `${roleId}-${menuUrl}-${permissionType}`
      
      const now = Date.now()
      const cached = permissionCache.get(cacheKey)
      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        if (cached.hasPermission) {
          return next()
        } else {
          return res.status(403).json({
            success: false,
            message: `Access denied: insufficient '${permissionType}' permission for ${menuUrl}`
          })
        }
      }

      // Query both menu and submenu access in parallel (saves one sequential DB network request)
      const [menuAccess, subMenuAccess] = await Promise.all([
        prisma.roleMenuAccess.findFirst({
          where: {
            roleId,
            menu: { url: menuUrl }
          }
        }),
        prisma.roleSubMenuAccess.findFirst({
          where: {
            roleMenuAccess: { roleId },
            submenu: { url: menuUrl }
          }
        })
      ])

      const hasPermission = !!(
        (menuAccess && menuAccess[permissionType]) ||
        (subMenuAccess && subMenuAccess[permissionType])
      )

      permissionCache.set(cacheKey, { hasPermission, timestamp: now })

      if (hasPermission) {
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