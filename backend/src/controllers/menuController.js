import { PrismaClient } from "@prisma/client";
import { trackingController } from "./trackingController.js";

const prisma = new PrismaClient();

export const getMenusByRole = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);

    if (isNaN(roleId)) {
      return res.status(400).json({ success: false, message: "Invalid role ID" });
    }

    const permissions = await prisma.roleMenuAccess.findMany({
      where: {
        roleId,
        canView: true,
      },
      include: {
        menu: {
          include: {
            submenu: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        roleSubMenuAccess: true
      },
      orderBy: {
        menu: {
          order: 'asc'
        }
      }
    });

    const formattedMenus = permissions
      .filter((p) => p.menu.isActive)
      .map((p) => {
        // Filter submenus based on roleSubMenuAccess
        const allowedSubmenus = p.menu.submenu.filter(sm => {
          const subAccess = p.roleSubMenuAccess.find(rsa => rsa.subMenuId === sm.id);
          return subAccess && subAccess.canView;
        });

        return {
          id: p.menu.id,
          title: p.menu.title,
          url: p.menu.url,
          icon: p.menu.icon,
          order: p.menu.order,
          permissions: {
            canView: p.canView,
            canAdd: p.canAdd,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
          },
          items: allowedSubmenus.map(sm => {
            const subAccess = p.roleSubMenuAccess.find(rsa => rsa.subMenuId === sm.id);
            return {
              id: sm.id,
              title: sm.title,
              url: sm.url,
              order: sm.order,
              permissions: {
                canView: subAccess?.canView || false,
                canAdd: subAccess?.canAdd || false,
                canEdit: subAccess?.canEdit || false,
                canDelete: subAccess?.canDelete || false,
              }
            };
          })
        };
      });

    res.json({ success: true, data: formattedMenus });
  } catch (error) {
    console.error("Error fetching menus by role:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const seedDefaultMenus = async (req, res) => {
  try {
    const defaultMenus = [
      { 
        title: "Dashboard", url: "/dashboard", icon: "LayoutDashboard", order: 1,
        submenus: [] 
      },
      { 
        title: "Order Management", url: "/orders", icon: "ListOrdered", order: 2,
        submenus: [
          { title: "POS System", url: "/pos", order: 1 },
          { title: "Live Orders", url: "/orders", order: 2 },
          { title: "Order History", url: "/orders/history", order: 3 }
        ] 
      },
      { 
        title: "Kitchen & Menu", url: "/menu", icon: "UtensilsCrossed", order: 3,
        submenus: [
          { title: "Categories", url: "/menu/categories", order: 1 },
          { title: "Menu Items", url: "/menu/items", order: 2 },
          { title: "Table Setup", url: "/tables", order: 3 }
        ] 
      },
      { 
        title: "Inventory & Stock", url: "/inventory", icon: "PackageOpen", order: 4,
        submenus: [
          { title: "Current Stock", url: "/inventory", order: 1 },
          { title: "Stock Movements", url: "/inventory/movements", order: 2 }
        ] 
      },
      { 
        title: "Clients", url: "/clients", icon: "Users", order: 5,
        submenus: [] 
      },
      { 
        title: "User Management", url: "/users", icon: "Shield", order: 6,
        submenus: [
          { title: "All Staff", url: "/users", order: 1 }
        ] 
      },
      { 
        title: "Configuration", url: "/config", icon: "Settings2", order: 7,
        submenus: [
          { title: "Roles", url: "/config/roles", order: 1 },
          { title: "Permissions", url: "/config/permissions", order: 2 },
          { title: "Sidebar Menus", url: "/config/menus", order: 3 },
          { title: "Tracking", url: "/config/tracking", order: 4 }
        ]
      },
    ];

    // Optional: Deactivate all existing menus before seeding to ensure a clean state
    await prisma.submenu.updateMany({ data: { isActive: false } });
    await prisma.menu.updateMany({ data: { isActive: false } });

    let adminRole = await prisma.role.findFirst({
      where: { 
        name: { 
          contains: "Admin"
        } 
      }
    });

    // If not found, try uppercase
    if (!adminRole) {
      adminRole = await prisma.role.findFirst({
        where: { name: { contains: "ADMIN" } }
      });
    }
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { name: "Admin", description: "Administrator with full access", updatedAt: new Date() }
      });
    }

    for (const menuData of defaultMenus) {
      const { submenus, ...menuFields } = menuData;
      menuFields.isActive = true;
      
      let menu = await prisma.menu.findFirst({
        where: { title: menuFields.title }
      });

      if (menu) {
        menu = await prisma.menu.update({
          where: { id: menu.id },
          data: menuFields
        });
      } else {
        menu = await prisma.menu.create({
          data: menuFields
        });
      }

      const roleMenuAccess = await prisma.roleMenuAccess.upsert({
        where: {
          roleId_menuId: {
            roleId: adminRole.id,
            menuId: menu.id
          }
        },
        update: {
          canView: true, canAdd: true, canEdit: true, canDelete: true
        },
        create: {
          roleId: adminRole.id,
          menuId: menu.id,
          canView: true, canAdd: true, canEdit: true, canDelete: true
        }
      });

      // Handle submenus
      for (const smData of submenus) {
        let submenu = await prisma.submenu.findFirst({
          where: { title: smData.title, menuId: menu.id }
        });

        if (submenu) {
          submenu = await prisma.submenu.update({
            where: { id: submenu.id },
            data: { ...smData, menuId: menu.id, isActive: true }
          });
        } else {
          submenu = await prisma.submenu.create({
            data: { ...smData, menuId: menu.id, isActive: true }
          });
        }

        await prisma.roleSubMenuAccess.upsert({
          where: {
            roleMenuAccessId_subMenuId: {
              roleMenuAccessId: roleMenuAccess.id,
              subMenuId: submenu.id
            }
          },
          update: {
            canView: true, canAdd: true, canEdit: true, canDelete: true
          },
          create: {
            roleMenuAccessId: roleMenuAccess.id,
            subMenuId: submenu.id,
            canView: true, canAdd: true, canEdit: true, canDelete: true
          }
        });
      }
    }

    res.json({ success: true, message: "Menus and submenus seeded successfully and permissions granted to Admin" });
  } catch (error) {
    console.error("Error seeding menus:", error);
    res.status(500).json({ success: false, message: "Server error during seeding" });
  }
};

export const getAllMenus = async (req, res) => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        submenu: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    const formattedMenus = menus.map(m => ({
      ...m,
      items: m.submenu || []
    }));

    res.json({ success: true, data: formattedMenus });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const createMenu = async (req, res) => {
  try {
    const { title, url, icon, order } = req.body;
    const menu = await prisma.menu.create({
      data: { title, url, icon, order: Number(order) || 0 }
    });
    
    const adminRole = await prisma.role.findFirst({ where: { name: { contains: "Admin" } } });
    if (adminRole) {
      await prisma.roleMenuAccess.create({
        data: {
          roleId: adminRole.id,
          menuId: menu.id,
          canView: true, canAdd: true, canEdit: true, canDelete: true
        }
      });
    }

    if (req.user) {
      await trackingController.logAction(
        req.user.id,
        'CREATE',
        'MENU',
        menu.id,
        `Created new main menu: ${menu.title}`
      );
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, icon, order, isActive } = req.body;
    const menu = await prisma.menu.update({
      where: { id: Number(id) },
      data: { title, url, icon, order: Number(order), isActive }
    });

    if (req.user) {
      await trackingController.logAction(
        req.user.id,
        'UPDATE',
        'MENU',
        menu.id,
        `Updated menu configuration: ${menu.title}`
      );
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await prisma.menu.findUnique({ where: { id: Number(id) } });
    await prisma.menu.delete({ where: { id: Number(id) } });

    if (req.user) {
      await trackingController.logAction(
        req.user.id,
        'DELETE',
        'MENU',
        Number(id),
        `Deleted menu module: ${menu?.title || id}`
      );
    }
    res.json({ success: true, message: "Menu deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubMenu = async (req, res) => {
  try {
    const { menuId, title, url, order } = req.body;
    const submenu = await prisma.submenu.create({
      data: { menuId: Number(menuId), title, url, order: Number(order) || 0 }
    });

    const adminRole = await prisma.role.findFirst({ where: { name: { contains: "Admin" } } });
    if (adminRole) {
      const menuAccess = await prisma.roleMenuAccess.findUnique({
        where: { roleId_menuId: { roleId: adminRole.id, menuId: Number(menuId) } }
      });
      if (menuAccess) {
        await prisma.roleSubMenuAccess.create({
          data: {
            roleMenuAccessId: menuAccess.id,
            subMenuId: submenu.id,
            canView: true, canAdd: true, canEdit: true, canDelete: true
          }
        });
      }
    }

    res.json({ success: true, data: submenu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, order, isActive } = req.body;
    const submenu = await prisma.submenu.update({
      where: { id: Number(id) },
      data: { title, url, order: Number(order), isActive }
    });
    res.json({ success: true, data: submenu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.submenu.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: "Submenu deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePermissions = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);
    const { permissions } = req.body; 

    if (isNaN(roleId)) {
      return res.status(400).json({ success: false, message: "Invalid role ID" });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Clear existing permissions for this role
      const existingMenuAccess = await tx.roleMenuAccess.findMany({
        where: { roleId }
      });
      const existingIds = existingMenuAccess.map(m => m.id);

      if (existingIds.length > 0) {
        await tx.roleSubMenuAccess.deleteMany({
          where: { roleMenuAccessId: { in: existingIds } }
        });
      }

      await tx.roleMenuAccess.deleteMany({
        where: { roleId }
      });

      // 2. Create new permissions
      for (const menuPerm of permissions) {
        if (!menuPerm.canView && !menuPerm.canAdd && !menuPerm.canEdit && !menuPerm.canDelete) continue;

        const roleMenuAccess = await tx.roleMenuAccess.create({
          data: {
            roleId,
            menuId: Number(menuPerm.menuId),
            canView: !!menuPerm.canView,
            canAdd: !!menuPerm.canAdd,
            canEdit: !!menuPerm.canEdit,
            canDelete: !!menuPerm.canDelete
          }
        });

        if (menuPerm.submenus && Array.isArray(menuPerm.submenus)) {
          const subData = menuPerm.submenus
            .filter(sp => sp.canView || sp.canAdd || sp.canEdit || sp.canDelete)
            .map(sp => ({
              roleMenuAccessId: roleMenuAccess.id,
              subMenuId: Number(sp.submenuId),
              canView: !!sp.canView,
              canAdd: !!sp.canAdd,
              canEdit: !!sp.canEdit,
              canDelete: !!sp.canDelete
            }));

          if (subData.length > 0) {
            await tx.roleSubMenuAccess.createMany({
              data: subData
            });
          }
        }
      }
    }, {
      maxWait: 5000,
      timeout: 15000
    });

    // Log the action
    if (req.user) {
      try {
        await trackingController.logAction(
          req.user.id,
          'UPDATE',
          'PERMISSIONS',
          roleId,
          `Updated system permissions for role ID: ${roleId}`
        );
      } catch (logError) {
        console.error("Failed to log permission update:", logError);
      }
    }

    res.json({ success: true, message: "Permissions updated successfully" });
  } catch (error) {
    console.error("CRITICAL: Error updating permissions:", error);
    import('fs').then(fs => fs.writeFileSync('error.log', error.stack || error.message));
    res.status(500).json({ 
      success: false, 
      message: "Server error during permission update",
      error: error.message 
    });
  }
};
