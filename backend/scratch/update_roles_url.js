import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating Roles URL ---');

  // Find the 'Configuration' menu
  const configMenu = await prisma.menu.findFirst({
    where: { title: 'Configuration' }
  });

  if (configMenu) {
    // Update 'Roles' submenu under Configuration
    const rolesSubmenu = await prisma.submenu.findFirst({
      where: { 
        menuId: configMenu.id,
        title: 'Roles'
      }
    });

    if (rolesSubmenu) {
      await prisma.submenu.update({
        where: { id: rolesSubmenu.id },
        data: {
          url: '/configuration/roles'
        }
      });
      console.log('Updated Roles submenu URL to /configuration/roles.');
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
