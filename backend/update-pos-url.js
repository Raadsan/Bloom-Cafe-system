import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Updating POS URL in database...');

  const posSub = await prisma.submenu.findFirst({
    where: { title: { contains: 'POS' } }
  });

  if (posSub) {
    await prisma.submenu.update({
      where: { id: posSub.id },
      data: { url: '/pos' }
    });
    console.log('POS Submenu URL updated to /pos');
  } else {
    const posMenu = await prisma.menu.findFirst({
      where: { title: { contains: 'POS' } }
    });
    if (posMenu) {
      await prisma.menu.update({
        where: { id: posMenu.id },
        data: { url: '/pos' }
      });
      console.log('POS Menu URL updated to /pos');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
