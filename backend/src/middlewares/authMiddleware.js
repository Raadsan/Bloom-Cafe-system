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