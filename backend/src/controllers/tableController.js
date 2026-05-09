import prisma from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// CREATE TABLE
export const createTable = async (req, res) => {
  try {
    const { number, name, status } = req.body;

    if (!number) {
      return res.status(400).json({
        success: false,
        message: 'Table number is required',
      });
    }

    const existingTable = await prisma.table.findUnique({
      where: { number: Number(number) },
    });

    if (existingTable) {
      return res.status(409).json({
        success: false,
        message: 'Table number already exists',
      });
    }

    const qrCode = `table-${number}-${uuidv4().slice(0, 8)}`;

    const table = await prisma.table.create({
      data: {
        number: Number(number),
        name: name || `Table ${number}`,
        qrCode,
        status: status || 'available',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table,
    });
  } catch (error) {
    console.error('Create Table Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create table',
      error: error.message,
    });
  }
};

// UPDATE TABLE
export const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, name, status } = req.body;

    const tableId = parseInt(id);

    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table id',
      });
    }

    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (number && Number(number) !== existingTable.number) {
      const numberExists = await prisma.table.findUnique({
        where: { number: Number(number) },
      });

      if (numberExists) {
        return res.status(409).json({
          success: false,
          message: 'Table number already exists',
        });
      }
    }

    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        number: number ? Number(number) : existingTable.number,
        name: name !== undefined ? name : existingTable.name,
        status: status || existingTable.status,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: updatedTable,
    });
  } catch (error) {
    console.error('Update Table Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update table',
      error: error.message,
    });
  }
};

// DELETE TABLE
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const tableId = parseInt(id);

    if (isNaN(tableId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid table id',
      });
    }

    const existingTable = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        orders: true,
      },
    });

    if (!existingTable) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (existingTable.orders.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table because it has related orders',
      });
    }

    await prisma.table.delete({
      where: { id: tableId },
    });

    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    console.error('Delete Table Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete table',
      error: error.message,
    });
  }
};

// GET ALL TABLES
export const getAllTables = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: {
        number: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables
    });

  } catch (error) {
    console.error('Get Tables Error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch tables',
      error: error.message
    });
  }
};

// GET TABLE BY QR CODE
export const getTableByQrCode = async (req, res) => {
  try {
    const { qrCode } = req.params;

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required',
      });
    }

    const table = await prisma.table.findFirst({
      where: { qrCode: qrCode },
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    console.error('Get Table By QR Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch table details',
      error: error.message,
    });
  }
};