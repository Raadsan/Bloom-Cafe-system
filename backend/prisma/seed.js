import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {

  await prisma.role.createMany({
    data: [
      { name: 'admin' },
      { name: 'manager' },
      { name: 'kitchen' },
      { name: 'waiter' }
    ],
    skipDuplicates: true
  })

  console.log('Roles created successfully')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })