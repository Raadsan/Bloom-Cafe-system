import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate Payments menu...');

  // The one I created had ID 100
  const myMenu = await prisma.menu.findUnique({
    where: { id: 100 }
  });

  if (myMenu) {
    // Delete submenus first (though they should cascade if configured)
    await prisma.submenu.deleteMany({
      where: { menuId: 100 }
    });
    
    // Delete role access
    await prisma.roleMenuAccess.deleteMany({
      where: { menuId: 100 }
    });

    // Delete the menu
    await prisma.menu.delete({
      where: { id: 100 }
    });
    console.log('Deleted duplicate Payments menu (ID 100).');
  }

  // Ensure the existing "Payments" menu (title: 'Payments') has the correct permissions
  const existingMenu = await prisma.menu.findFirst({
    where: { title: 'Payments', NOT: { id: 100 } }
  });

  if (existingMenu) {
      console.log('Found existing Payments menu (ID:', existingMenu.id, '). Syncing permissions...');
      
      const adminRole = await prisma.role.findFirst({
        where: { name: { contains: 'admin' } }
      });

      if (adminRole) {
        const roleMenuAccess = await prisma.roleMenuAccess.upsert({
          where: {
            roleId_menuId: {
              roleId: adminRole.id,
              menuId: existingMenu.id
            }
          },
          update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
          create: {
            roleId: adminRole.id,
            menuId: existingMenu.id,
            canView: true, canAdd: true, canEdit: true, canDelete: true
          }
        });

        const submenus = await prisma.submenu.findMany({
          where: { menuId: existingMenu.id }
        });

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
        }
      }
  }

  console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
