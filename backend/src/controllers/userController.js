import prisma from '../config/db.js';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/auditHelper.js';
import { clearAuthCaches } from '../middlewares/authMiddleware.js';

// Backend in-memory cache to bypass remote DB latency for the users list
let cachedUsersList = null;
let cachedUsersAt = 0;
let usersFetchInflight = null;
const USERS_LIST_TTL = 2 * 60 * 1000;

export const clearUsersCache = () => {
  cachedUsersList = null;
  cachedUsersAt = 0;
  usersFetchInflight = null;
};

// CREATE USER
export const createUser = async (req, res) => {
  try {
    let { fullName, email, phone, password, roleId, isActive } = req.body

    fullName = fullName?.trim()
    email = email?.trim().toLowerCase()
    phone = phone?.trim()

    if (!fullName || !email || !password || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email, password and roleId are required'
      })
    }

    roleId = parseInt(roleId)

    if (isNaN(roleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roleId'
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      })
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      })
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      })
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone }
      }).catch(() => null)

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'Phone already exists'
        })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        password: hashedPassword,
        roleId,
        isActive: typeof isActive === 'boolean' ? isActive : true
      },
      include: {
        role: true
      }
    })

    const { password: _, ...userWithoutPassword } = user

    logAudit({ userId: req.user?.id, action: 'Created', entity: 'User', entityId: user.id, description: `Created user "${user.fullName}"` })
    clearAuthCaches()
    clearUsersCache()

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('Create User Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    })
  }
}

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    let { fullName, email, phone, password, roleId, isActive } = req.body

    const userId = parseInt(id)

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (email) {
      email = email.trim().toLowerCase()
    }

    if (phone) {
      phone = phone.trim()
    }

    if (roleId !== undefined) {
      roleId = parseInt(roleId)

      if (isNaN(roleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid roleId'
        })
      }

      const existingRole = await prisma.role.findUnique({
        where: { id: roleId }
      })

      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        })
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        })
      }
    }

    if (phone && phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findUnique({
        where: { phone }
      }).catch(() => null)

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: 'Phone already exists'
        })
      }
    }

    let hashedPassword = existingUser.password

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters'
        })
      }

      hashedPassword = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName ?? existingUser.fullName,
        email: email ?? existingUser.email,
        phone: phone !== undefined ? phone : existingUser.phone,
        password: hashedPassword,
        roleId: roleId ?? existingUser.roleId,
        isActive: typeof isActive === 'boolean' ? isActive : existingUser.isActive
      },
      include: {
        role: true
      }
    })

    const { password: _, ...userWithoutPassword } = updatedUser

    logAudit({ userId: req.user?.id, action: 'Updated', entity: 'User', entityId: updatedUser.id, description: `Updated user "${updatedUser.fullName}"` })
    clearAuthCaches()
    clearUsersCache()

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    })
  } catch (error) {
    console.error('Update User Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    })
  }
}

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedUsersList && now - cachedUsersAt < USERS_LIST_TTL) {
      return res.status(200).json({
        success: true,
        count: cachedUsersList.length,
        data: cachedUsersList,
      });
    }

    if (usersFetchInflight) {
      const data = await usersFetchInflight;
      return res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    }

    usersFetchInflight = prisma.user
      .findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          roleId: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
        },
        orderBy: { id: 'asc' },
      })
      .then((users) => {
        cachedUsersList = users;
        cachedUsersAt = Date.now();
        usersFetchInflight = null;
        return users;
      })
      .catch((err) => {
        usersFetchInflight = null;
        throw err;
      });

    const usersWithoutPasswords = await usersFetchInflight;

    res.status(200).json({
      success: true,
      count: usersWithoutPasswords.length,
      data: usersWithoutPasswords,
    });
  } catch (error) {
    console.error('[GetAllUsers] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      })
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    logAudit({ userId: req.user?.id, action: 'Deleted', entity: 'User', entityId: userId, description: `Deleted user "${existingUser.fullName}"` })
    clearAuthCaches()
    clearUsersCache()

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete User Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    })
  }
}

// GET USERS BY ROLE ID
export const getUsersByRole = async (req, res) => {
  try {
    const { roleId } = req.params
    const parsedRoleId = parseInt(roleId)

    if (isNaN(parsedRoleId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role id'
      })
    }

    const existingRole = await prisma.role.findUnique({
      where: { id: parsedRoleId }
    })

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      })
    }

    const users = await prisma.user.findMany({
      where: {
        roleId: parsedRoleId
      },
      include: {
        role: true
      },
      orderBy: {
        id: 'asc'
      }
    })

    const usersWithoutPasswords = users.map(({ password, ...user }) => user)

    res.status(200).json({
      success: true,
      role: existingRole.name,
      count: usersWithoutPasswords.length,
      data: usersWithoutPasswords
    })
  } catch (error) {
    console.error('Get Users By Role Error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users by role',
      error: error.message
    })
  }
}

