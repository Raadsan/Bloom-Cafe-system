import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Adding Payments Menu and Submenus...');

  // 1. Create the Main "Payments" Menu
  const paymentsMenu = await prisma.menu.upsert({
    where: { id: 100 }, // Using a fixed ID to avoid duplicates if run multiple times
    update: {
        title: 'Payments',
        url: '#',
        icon: 'CreditCard',
        order: 10
    },
    create: {
      id: 100,
      title: 'Payments',
      url: '#',
      icon: 'CreditCard',
      order: 10
    }
  });

  // 2. Create Submenus
  const submenus = [
    { title: 'Revenue', url: '/payments/revenue', order: 1 },
    { title: 'Expenses', url: '/payments/expenses', order: 2 }
  ];

  for (const smData of submenus) {
    const existing = await prisma.submenu.findFirst({
        where: { menuId: paymentsMenu.id, title: smData.title }
    });

    if (existing) {
        await prisma.submenu.update({
            where: { id: existing.id },
            data: { url: smData.url, order: smData.order }
        });
    } else {
        await prisma.submenu.create({
            data: {
                menuId: paymentsMenu.id,
                title: smData.title,
                url: smData.url,
                order: smData.order
            }
        });
    }
  }

  // 3. Grant Permissions to Admin
  const adminRole = await prisma.role.findFirst({
    where: { name: { contains: 'admin' } }
  });

  if (adminRole) {
    const roleMenuAccess = await prisma.roleMenuAccess.upsert({
      where: {
        roleId_menuId: {
          roleId: adminRole.id,
          menuId: paymentsMenu.id
        }
      },
      update: { canView: true, canAdd: true, canEdit: true, canDelete: true },
      create: {
        roleId: adminRole.id,
        menuId: paymentsMenu.id,
        canView: true, canAdd: true, canEdit: true, canDelete: true
      }
    });

    const createdSubmenus = await prisma.submenu.findMany({
      where: { menuId: paymentsMenu.id }
    });

    for (const sm of createdSubmenus) {
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

  console.log('Payments menu and permissions added successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
