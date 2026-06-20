import 'dotenv/config'
import prisma from '../src/config/db.js'
import { ensureCompositesMenuItem } from '../src/controllers/menuController.js'

await ensureCompositesMenuItem()
await prisma.$disconnect()
console.log('Menu Combos sidebar entry ensured.')
