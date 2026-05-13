import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing Permissions for new Reports...');

  // 1. Find Admin Role
  const adminRole = await prisma.role.findFirst({
    where: { name: { contains: 'Admin' } }
  });

  if (!adminRole) {
    console.error('Admin role not found.');
    return;
  }

  // 2. Find Report Menu
  const reportMenu = await prisma.menu.findFirst({
    where: { title: 'Report' }
  });

  if (!reportMenu) {
    console.error('Report menu not found.');
    return;
  }

  // 3. Ensure Admin has Access to the Main "Report" Menu
  const roleMenuAccess = await prisma.roleMenuAccess.upsert({
    where: {
      roleId_menuId: {
        roleId: adminRole.id,
        menuId: reportMenu.id
      }
    },
    update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
    create: {
      roleId: adminRole.id,
      menuId: reportMenu.id,
      canView: true, canAdd: true, canEdit: true, canDelete: true
    }
  });

  // 4. Find all submenus for "Report"
  const submenus = await prisma.submenu.findMany({
    where: { menuId: reportMenu.id }
  });

  // 5. Grant Permission for each Submenu to Admin
  for (const sm of submenus) {
    await prisma.roleSubMenuAccess.upsert({
      where: {
        roleMenuAccessId_subMenuId: {
          roleMenuAccessId: roleMenuAccess.id,
          subMenuId: sm.id
        }
      },
      update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      create: {
        roleMenuAccessId: roleMenuAccess.id,
        subMenuId: sm.id,
        canView: true, canAdd: true, canEdit: true, canDelete: true
      }
    });
    console.log(`Granted Admin permission to: ${sm.title}`);
  }

  console.log('Permissions synchronized successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
