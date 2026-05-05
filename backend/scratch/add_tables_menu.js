import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if Tables menu already exists
  let tablesMenu = await prisma.menu.findFirst({
    where: { title: 'Tables' }
  });

  if (!tablesMenu) {
    console.log('Creating Tables menu...');
    tablesMenu = await prisma.menu.create({
      data: {
        title: 'Tables',
        url: '/tables',
        icon: 'LayoutGrid',
        order: 4,
        isActive: true
      }
    });
    console.log(`Created Tables menu with ID: ${tablesMenu.id}`);
  } else {
    console.log(`Tables menu already exists with ID: ${tablesMenu.id}. Updating...`);
    tablesMenu = await prisma.menu.update({
      where: { id: tablesMenu.id },
      data: {
        url: '/tables',
        icon: 'LayoutGrid',
        isActive: true,
        order: 4
      }
    });
  }

  // Add role access for admin (ID 1), manager (ID 2), and waiter (ID 5)
  const rolesWithAccess = [1, 2, 5];
  
  for (const roleId of rolesWithAccess) {
    const access = await prisma.roleMenuAccess.findUnique({
      where: {
        roleId_menuId: {
          roleId: roleId,
          menuId: tablesMenu.id
        }
      }
    });

    if (!access) {
      console.log(`Adding access for role ID: ${roleId}`);
      await prisma.roleMenuAccess.create({
        data: {
          roleId: roleId,
          menuId: tablesMenu.id,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true
        }
      });
    } else {
      console.log(`Access already exists for role ID: ${roleId}. Ensuring view permission...`);
      await prisma.roleMenuAccess.update({
        where: { id: access.id },
        data: { canView: true, canAdd: true, canEdit: true, canDelete: true }
      });
    }
  }

  console.log('Successfully added Tables menu and configured access.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
