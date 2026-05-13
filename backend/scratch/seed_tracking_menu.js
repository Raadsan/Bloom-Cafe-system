import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Tracking Menu...');

  // 1. Find Admin Role
  const adminRole = await prisma.role.findFirst({
    where: { name: { contains: 'Admin' } }
  });

  if (!adminRole) {
    console.error('Admin role not found!');
    return;
  }

  // 2. Find or Create Configuration Menu
  let configMenu = await prisma.menu.findFirst({
    where: { title: 'Configuration' }
  });

  if (!configMenu) {
    configMenu = await prisma.menu.create({
      data: {
        title: 'Configuration',
        url: '/config',
        icon: 'Settings2',
        order: 7,
        isActive: true
      }
    });
  }

  // 3. Create Tracking Submenu
  const trackingSub = await prisma.submenu.upsert({
    where: { 
      // We don't have a unique constraint on title/menuId in schema.prisma usually 
      // so we use find first or create
      id: (await prisma.submenu.findFirst({ where: { title: 'Tracking', menuId: configMenu.id } }))?.id || 0
    },
    update: {
      url: '/config/tracking',
      order: 4,
      isActive: true
    },
    create: {
      menuId: configMenu.id,
      title: 'Tracking',
      url: '/config/tracking',
      order: 4,
      isActive: true
    }
  });

  // 4. Ensure Permissions
  const menuAccess = await prisma.roleMenuAccess.upsert({
    where: {
      roleId_menuId: {
        roleId: adminRole.id,
        menuId: configMenu.id
      }
    },
    update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: configMenu.id,
      canView: true, canAdd: true, canEdit: true, canDelete: true
    }
  });

  await prisma.roleSubMenuAccess.upsert({
    where: {
      roleMenuAccessId_subMenuId: {
        roleMenuAccessId: menuAccess.id,
        subMenuId: trackingSub.id
      }
    },
    update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    create: {
      roleMenuAccessId: menuAccess.id,
      subMenuId: trackingSub.id,
      canView: true, canAdd: true, canEdit: true, canDelete: true
    }
  });

  console.log('Tracking Menu Seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
