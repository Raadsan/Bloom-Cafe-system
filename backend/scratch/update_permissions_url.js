import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating Permissions URL ---');

  // Find the 'Configuration' menu
  const configMenu = await prisma.menu.findFirst({
    where: { title: 'Configuration' }
  });

  if (configMenu) {
    // Update 'Permissions' submenu under Configuration
    const permissionsSubmenu = await prisma.submenu.findFirst({
      where: { 
        menuId: configMenu.id,
        title: 'Permissions'
      }
    });

    if (permissionsSubmenu) {
      await prisma.submenu.update({
        where: { id: permissionsSubmenu.id },
        data: {
          url: '/configuration/permissions',
          isActive: true
        }
      });
      console.log('Updated Permissions submenu URL to /configuration/permissions.');
    } else {
      await prisma.submenu.create({
        data: {
          menuId: configMenu.id,
          title: 'Permissions',
          url: '/configuration/permissions',
          isActive: true,
          order: 2
        }
      });
      console.log('Created Permissions submenu.');
    }
  }

  console.log('--- URL Update Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
