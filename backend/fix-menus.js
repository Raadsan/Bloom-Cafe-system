import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Report menu URLs...');

  // 1. Fix Submenus
  await prisma.submenu.updateMany({
    where: { url: '/report/orders report' },
    data: { url: '/report/orders' }
  });

  await prisma.submenu.updateMany({
    where: { url: '/report/finance report' },
    data: { url: '/report/finance' }
  });

  // 2. Add Clients Report submenu if it doesn't exist
  const reportMenu = await prisma.menu.findFirst({ where: { title: 'Report' } });
  if (reportMenu) {
    const clientsExists = await prisma.submenu.findFirst({
      where: { menuId: reportMenu.id, title: 'Clients report' }
    });

    if (!clientsExists) {
      await prisma.submenu.create({
        data: {
          menuId: reportMenu.id,
          title: 'Clients report',
          url: '/report/clients',
          order: 3,
          isActive: true
        }
      });
      console.log('Added Clients report submenu.');
    }
  }

  console.log('URLs fixed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
