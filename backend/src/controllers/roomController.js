import prisma from '../config/db.js'
import { logAudit } from '../utils/auditHelper.js'
import { ensureRoomsMenuItem } from './menuController.js'

const DEFAULT_ROOMS = [
  { name: 'Main Hall', description: 'Main dining area' },
  { name: 'VIP Room', description: 'Private VIP seating' },
  { name: 'Outdoor', description: 'Outdoor terrace seating' },
  { name: 'Private Room', description: 'Private dining room' },
  { name: 'Terrace', description: 'Rooftop terrace' }
]

let roomsEnsured = false;

export async function ensureDefaultRooms() {
  if (roomsEnsured) return;
  try {
    await ensureRoomsMenuItem()
  } catch (err) {
    console.warn('ensureRoomsMenuItem skipped:', err.message)
  }

  if (!prisma.room) {
    console.warn('Prisma room model unavailable — restart the backend after running: npx prisma generate')
    return
  }

  const count = await prisma.room.count()
  if (count === 0) {
    for (const room of DEFAULT_ROOMS) {
      await prisma.room.create({ data: room })
    }
  }

  const mainHall = await prisma.room.findFirst({ where: { name: 'Main Hall' } })
  if (mainHall) {
    await prisma.table.updateMany({
      where: { roomId: null },
      data: { roomId: mainHall.id }
    })
  }
  roomsEnsured = true;
}

export const createRoom = async (req, res) => {
  try {
    const { name, description, isActive } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Room name is required' })
    }

    const existing = await prisma.room.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Room already exists' })
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== undefined ? !!isActive : true
      }
    })

    logAudit({
      userId: req.user?.id,
      action: 'Created',
      entity: 'Room',
      entityId: room.id,
      description: `Created room "${room.name}"`
    })

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room
    })
  } catch (error) {
    console.error('Create Room Error:', error)
    res.status(500).json({ success: false, message: 'Failed to create room', error: error.message })
  }
}

export const getAllRooms = async (req, res) => {
  try {
    await ensureDefaultRooms()

    const rooms = await prisma.room.findMany({
      include: {
        _count: { select: { table: true } }
      },
      orderBy: { name: 'asc' }
    })

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    })
  } catch (error) {
    console.error('Get Rooms Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch rooms', error: error.message })
  }
}

export const getRoomById = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id)
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room id' })
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        table: { orderBy: { number: 'asc' } }
      }
    })

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    res.status(200).json({ success: true, data: room })
  } catch (error) {
    console.error('Get Room Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch room', error: error.message })
  }
}

export const updateRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id)
    const { name, description, isActive } = req.body

    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room id' })
    }

    const existing = await prisma.room.findUnique({ where: { id: roomId } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.room.findUnique({ where: { name: name.trim() } })
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Room name already exists' })
      }
    }

    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
        updatedAt: new Date()
      }
    })

    logAudit({
      userId: req.user?.id,
      action: 'Updated',
      entity: 'Room',
      entityId: room.id,
      description: `Updated room "${room.name}"`
    })

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: room
    })
  } catch (error) {
    console.error('Update Room Error:', error)
    res.status(500).json({ success: false, message: 'Failed to update room', error: error.message })
  }
}

export const deleteRoom = async (req, res) => {
  try {
    const roomId = parseInt(req.params.id)
    if (isNaN(roomId)) {
      return res.status(400).json({ success: false, message: 'Invalid room id' })
    }

    const existing = await prisma.room.findUnique({
      where: { id: roomId },
      include: { table: true }
    })

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Room not found' })
    }

    if (existing.table.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room because it has tables assigned. Move or delete tables first.'
      })
    }

    await prisma.room.delete({ where: { id: roomId } })

    logAudit({
      userId: req.user?.id,
      action: 'Deleted',
      entity: 'Room',
      entityId: roomId,
      description: `Deleted room "${existing.name}"`
    })

    return res.status(200).json({ success: true, message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Delete Room Error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete room', error: error.message })
  }
}
