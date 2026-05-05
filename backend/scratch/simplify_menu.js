import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const menus = await prisma.menu.findMany({ include: { submenu: true } });
  // Find menu with title "User Management" or containing "User"
  const userMenu = menus.find(m => m.title === 'User Management' || m.title === 'Users');
  
  if (userMenu) {
    console.log(`Found menu: ${userMenu.title} (ID: ${userMenu.id})`);
    
    // Delete submenus
    const deleteResult = await prisma.submenu.deleteMany({
      where: { menuId: userMenu.id }
    });
    console.log(`Deleted ${deleteResult.count} submenus`);
    
    // Update parent menu to be a direct link
    await prisma.menu.update({
      where: { id: userMenu.id },
      data: { 
        title: 'Users',
        url: '/users',
        icon: 'User' 
      }
    });
    
    console.log('Successfully simplified User Management menu to "Users"');
  } else {
    console.log('User Management menu not found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
