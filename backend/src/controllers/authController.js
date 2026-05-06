import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'

// LOGIN
export const login = async (req, res) => {
  try {
    let { email, password } = req.body

    email = email?.trim().toLowerCase()

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true }
    })

    if (!user) {
      return res.status(404).json({
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

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const token = generateToken(user)

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        role: user.role.name,
        roleId: user.roleId,
        roleDescription: user.role.description,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Login Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    })
  }
}

// GET CURRENT LOGGED-IN USER
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const { password, ...userWithoutPassword } = user

    res.status(200).json({
      success: true,
      data: {
        ...userWithoutPassword,
        role: user.role.name,
        roleId: user.roleId,
        roleDescription: user.role.description
      }
    })
  } catch (error) {
    console.error('Get Me Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current user',
      error: error.message
    })
  }
}