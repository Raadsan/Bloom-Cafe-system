import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up and grouping sidebar URLs...');

  const updates = [
    { from: '/menu-categories', to: '/menu/categories' },
    { from: '/order-history', to: '/orders/history' },
    { from: '/pos', to: '/orders/pos' }
  ];

  for (const update of updates) {
    const submenus = await prisma.submenu.findMany({
      where: { url: update.from }
    });

    for (const sm of submenus) {
      await prisma.submenu.update({
        where: { id: sm.id },
        data: { url: update.to }
      });
      console.log(`Updated ${sm.title}: ${update.from} -> ${update.to}`);
    }
  }

  console.log('Database URL grouping complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
