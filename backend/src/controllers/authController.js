import prisma from '../config/db.js'
import { getCachedUser, invalidateUserCache } from '../middlewares/authMiddleware.js'

function formatAuthUser(user) {
  const { password, role, ...rest } = user
  return {
    ...rest,
    role: role.name,
    roleId: user.roleId,
    roleDescription: role.description
  }
}
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

    // Log Login Activity
    await prisma.auditlog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'AUTH',
        description: `Staff ${user.fullName} logged into the system.`
      }
    });

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

// REGISTER
export const register = async (req, res) => {
  try {
    let { fullName, email, password, phone } = req.body

    email = email?.trim().toLowerCase()

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    const userExists = await prisma.user.findUnique({ where: { email } })
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Find default 'client' role (case-insensitive check or fallback)
    let role = await prisma.role.findFirst({ 
      where: { 
        name: { equals: 'client' } 
      } 
    })
    
    if (!role) {
      role = await prisma.role.findFirst({ 
        where: { 
          name: { equals: 'Client' } 
        } 
      })
    }

    if (!role) {
      return res.status(500).json({ success: false, message: 'Default Client role not found in system' })
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone,
        roleId: role.id,
        updatedAt: new Date() // Manual set as fallback
      },
      include: { role: true }
    })

    const token = generateToken(user)

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role.name
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, currentPassword, newPassword, address, dateOfBirth, gender, avatarUrl } = req.body
    const userId = req.user.id

    const updateData = { fullName, email, phone }

    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl || null;

    if (currentPassword && newPassword) {
      // Find the user to verify current password
      const existingUser = await prisma.user.findUnique({ where: { id: userId } });
      const isMatch = await bcrypt.compare(currentPassword, existingUser.password);
      
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }
      
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { role: true }
    })

    invalidateUserCache(userId)

    res.status(200).json({
      success: true,
      message: 'Profile updated',
      user: formatAuthUser(user)
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET CURRENT LOGGED-IN USER (uses auth cache — no extra DB round-trip when warm)
export const getMe = async (req, res) => {
  try {
    const user = await getCachedUser(req.user.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      data: formatAuthUser(user)
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

// FORGOT PASSWORD (CHECK EMAIL)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' })
    }

    res.status(200).json({ success: true, message: 'Email verified' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { password: hashedPassword }
    })

    res.status(200).json({ success: true, message: 'Password reset successful' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// LOGOUT
export const logout = async (req, res) => {
  try {
    // Log Logout Activity
    if (req.user) {
      await prisma.auditlog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT',
          entity: 'AUTH',
          description: `Staff ${req.user.fullName} logged out of the system.`
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
}