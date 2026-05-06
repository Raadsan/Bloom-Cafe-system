import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Sidebar Roles Menu Setup ---');

  // 1. Create/Update top-level Roles menu
  let rolesMenu = await prisma.menu.findFirst({
    where: { url: '/roles' }
  });

  if (rolesMenu) {
    rolesMenu = await prisma.menu.update({
      where: { id: rolesMenu.id },
      data: {
        title: 'Roles',
        icon: 'ShieldCheck',
        order: 12,
        isActive: true,
      }
    });
    console.log(`Updated Roles Menu ID: ${rolesMenu.id}`);
  } else {
    rolesMenu = await prisma.menu.create({
      data: {
        title: 'Roles',
        url: '/roles',
        icon: 'ShieldCheck',
        order: 12,
        isActive: true,
      }
    });
    console.log(`Created Roles Menu ID: ${rolesMenu.id}`);
  }

  // 2. Grant access to 'admin' role (ID 1)
  const adminRole = await prisma.role.findFirst({
    where: { name: 'admin' }
  });

  if (adminRole) {
    const existingAccess = await prisma.roleMenuAccess.findFirst({
      where: {
        roleId: adminRole.id,
        menuId: rolesMenu.id,
      }
    });

    if (existingAccess) {
      await prisma.roleMenuAccess.update({
        where: { id: existingAccess.id },
        data: {
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        }
      });
    } else {
      await prisma.roleMenuAccess.create({
        data: {
          roleId: adminRole.id,
          menuId: rolesMenu.id,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true,
        }
      });
    }
    console.log(`Granted full access to admin role (ID: ${adminRole.id})`);
  } else {
    console.warn('Admin role not found. Skipping permission setup.');
  }

  // 3. Deactivate old config roles if they exist
  const oldConfigRoleSubmenu = await prisma.submenu.findFirst({
    where: { url: '/dashboard/config/roles' }
  });
  if (oldConfigRoleSubmenu) {
    await prisma.submenu.update({
      where: { id: oldConfigRoleSubmenu.id },
      data: { isActive: false }
    });
    console.log('Deactivated old config/roles submenu.');
  }

  console.log('--- Setup Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
