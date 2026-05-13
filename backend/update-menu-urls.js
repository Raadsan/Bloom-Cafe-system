import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Updating sidebar URLs for separated Menus and Categories...');

  const updates = [
    { title: 'Categories', newUrl: '/categories' },
    { title: 'Menu Items', newUrl: '/menus' }
  ];

  for (const update of updates) {
    const submenus = await prisma.submenu.findMany({
      where: { title: { contains: update.title } }
    });

    for (const sm of submenus) {
      await prisma.submenu.update({
        where: { id: sm.id },
        data: { url: update.newUrl }
      });
      console.log(`Updated ${sm.title}: ${sm.url} -> ${update.newUrl}`);
    }
  }

  console.log('Database URL updates complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
