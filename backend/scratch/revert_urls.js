import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Reverting URLs to /config/... ---');

  const configMenu = await prisma.menu.findFirst({
    where: { title: 'Configuration' }
  });

  if (configMenu) {
    // Roles
    const rolesSubmenu = await prisma.submenu.findFirst({
      where: { menuId: configMenu.id, title: 'Roles' }
    });
    if (rolesSubmenu) {
      await prisma.submenu.update({
        where: { id: rolesSubmenu.id },
        data: { url: '/config/roles' }
      });
    }

    // Permissions
    const permissionsSubmenu = await prisma.submenu.findFirst({
      where: { menuId: configMenu.id, title: 'Permissions' }
    });
    if (permissionsSubmenu) {
      await prisma.submenu.update({
        where: { id: permissionsSubmenu.id },
        data: { url: '/config/permissions' }
      });
    }
  }

  console.log('--- Revert Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
