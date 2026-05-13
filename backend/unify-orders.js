import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Unifying Order Menu in database...');

  const orderMenu = await prisma.menu.findFirst({
    where: { title: { contains: 'Order' } }
  });

  if (orderMenu) {
    await prisma.submenu.deleteMany({
      where: { menuId: orderMenu.id }
    });

    await prisma.menu.update({
      where: { id: orderMenu.id },
      data: { url: '/orders' }
    });

    console.log('Successfully unified Order menu to direct link: /orders');
  } else {
    console.log('Order menu not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
