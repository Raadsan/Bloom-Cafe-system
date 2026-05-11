import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Attempting to fetch roles...')
    const roles = await prisma.role.findMany()
    console.log('Success! Found ' + roles.length + ' roles.')
    console.log(JSON.stringify(roles, null, 2))
  } catch (error) {
    console.error('FAILED to fetch roles:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
