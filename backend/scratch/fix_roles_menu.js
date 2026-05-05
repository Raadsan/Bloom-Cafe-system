import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Fixing Sidebar Roles Menu ---');

  // 1. Remove the top-level 'Roles' menu I added (/roles)
  const topLevelRoles = await prisma.menu.findFirst({
    where: { url: '/roles' }
  });

  if (topLevelRoles) {
    // First remove roleMenuAccess
    await prisma.roleMenuAccess.deleteMany({
      where: { menuId: topLevelRoles.id }
    });
    // Then remove the menu
    await prisma.menu.delete({
      where: { id: topLevelRoles.id }
    });
    console.log('Removed top-level Roles menu item.');
  }

  // 2. Find the 'Configuration' menu (Settings2 icon)
  const configMenu = await prisma.menu.findFirst({
    where: { title: 'Configuration' }
  });

  if (configMenu) {
    // Ensure Configuration is active
    await prisma.menu.update({
      where: { id: configMenu.id },
      data: { isActive: true }
    });
    console.log('Activated Configuration menu.');

    // 3. Update 'Roles' submenu under Configuration
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
          url: '/roles', // Point to the new page I created
          isActive: true
        }
      });
      console.log('Updated and activated Roles submenu under Configuration.');
    } else {
      await prisma.submenu.create({
        data: {
          menuId: configMenu.id,
          title: 'Roles',
          url: '/roles',
          isActive: true,
          order: 1
        }
      });
      console.log('Created Roles submenu under Configuration.');
    }

    // 4. Grant access to 'admin' role for Configuration if not already
    const adminRole = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (adminRole) {
      const existingAccess = await prisma.roleMenuAccess.findFirst({
        where: { roleId: adminRole.id, menuId: configMenu.id }
      });

      if (!existingAccess) {
        await prisma.roleMenuAccess.create({
          data: {
            roleId: adminRole.id,
            menuId: configMenu.id,
            canView: true,
            canAdd: true,
            canEdit: true,
            canDelete: true
          }
        });
        console.log('Granted admin access to Configuration menu.');
      }
    }
  } else {
    console.warn('Configuration menu not found.');
  }

  console.log('--- Fix Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
