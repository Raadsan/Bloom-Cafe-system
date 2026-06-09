import prisma from "../config/db.js";
import { trackingController } from "./trackingController.js";
import { clearPermissionCache } from "../middlewares/authMiddleware.js";

let roomsMenuEnsured = false;
let createOrderMenuEnsured = false;
let pickupOrdersMenuEnsured = false;
let pickupHistoryMenuEnsured = false;

const roleMenusCache = new Map();
const ROLE_MENUS_CACHE_TTL = 5 * 60 * 1000;

function getCachedRoleMenus(roleId) {
  const entry = roleMenusCache.get(roleId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ROLE_MENUS_CACHE_TTL) {
    roleMenusCache.delete(roleId);
    return null;
  }
  return entry.data;
}

export function clearRoleMenusCache(roleId) {
  if (roleId !== undefined && roleId !== null) {
    roleMenusCache.delete(Number(roleId));
  } else {
    roleMenusCache.clear();
  }
}

async function fetchMenusForRole(roleId) {
  const cached = getCachedRoleMenus(roleId);
  if (cached) return cached;

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
            orderBy: { order: "asc" },
          },
        },
      },
      roleSubMenuAccess: true,
    },
    orderBy: {
      menu: { order: "asc" },
    },
  });

  const formattedMenus = permissions
    .filter((p) => p.menu.isActive)
    .map((p) => {
      const allowedSubmenus = p.menu.submenu.filter((sm) => {
        const subAccess = p.roleSubMenuAccess.find((rsa) => rsa.subMenuId === sm.id);
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
        items: allowedSubmenus.map((sm) => {
          const subAccess = p.roleSubMenuAccess.find((rsa) => rsa.subMenuId === sm.id);
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
            },
          };
        }),
      };
    });

  roleMenusCache.set(roleId, { data: formattedMenus, timestamp: Date.now() });
  return formattedMenus;
}

export const getMenusByRole = async (req, res) => {
  try {
    const roleId = Number(req.params.roleId);

    if (isNaN(roleId)) {
      return res.status(400).json({ success: false, message: "Invalid role ID" });
    }

    const formattedMenus = await fetchMenusForRole(roleId);
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
        title: "Create Order", url: "/orders/create", icon: "CirclePlus", order: 2,
        submenus: []
      },
      {
        title: "Ready Pickup", url: "/orders/pickup", icon: "BellRing", order: 3,
        submenus: []
      },
      {
        title: "Pickup History", url: "/orders/pickup/history", icon: "History", order: 4,
        submenus: []
      },
      { 
        title: "Order Management", url: "/orders", icon: "ListOrdered", order: 5,
        submenus: [
          { title: "POS System", url: "/pos", order: 1 },
          { title: "Live Orders", url: "/orders", order: 2 },
          { title: "Order History", url: "/orders/history", order: 3 }
        ] 
      },
      { 
        title: "Kitchen & Menu", url: "/menu", icon: "UtensilsCrossed", order: 4,
        submenus: [
          { title: "Categories", url: "/menu/categories", order: 1 },
          { title: "Menu Items", url: "/menu/items", order: 2 },
          { title: "Table Setup", url: "/tables", order: 3 }
        ] 
      },
      { 
        title: "Inventory & Stock", url: "/inventory", icon: "PackageOpen", order: 5,
        submenus: [
          { title: "Current Stock", url: "/inventory", order: 1 },
          { title: "Stock Movements", url: "/inventory/movements", order: 2 }
        ] 
      },
      { 
        title: "Clients", url: "/clients", icon: "Users", order: 6,
        submenus: [] 
      },
      {
        title: "Rooms", url: "/rooms", icon: "DoorOpen", order: 7,
        submenus: []
      },
      { 
        title: "User Management", url: "/users", icon: "Shield", order: 8,
        submenus: [
          { title: "All Staff", url: "/users", order: 1 }
        ] 
      },
      { 
        title: "Configuration", url: "/config", icon: "Settings2", order: 9,
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

/** Ensures Create Order is a top-level sidebar item (not under Order Management) */
export async function ensureCreateOrderMenuItem() {
  if (createOrderMenuEnsured) return;
  try {
    const orderMenu = await prisma.menu.findFirst({
      where: {
        OR: [{ url: "/orders" }, { title: "Order Management" }]
      }
    });

    if (orderMenu) {
      await prisma.submenu.updateMany({
        where: { url: "/orders/create", menuId: orderMenu.id },
        data: { isActive: false }
      });
    }

    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: "waiter" } },
          { name: { contains: "Waiter" } },
          { name: { contains: "admin" } },
          { name: { contains: "Admin" } },
          { name: { contains: "manager" } },
          { name: { contains: "Manager" } }
        ]
      }
    });

    let createMenu = await prisma.menu.findFirst({
      where: {
        OR: [{ url: "/orders/create" }, { title: "Create Order" }]
      }
    });

    if (createMenu) {
      createMenu = await prisma.menu.update({
        where: { id: createMenu.id },
        data: {
          title: "Create Order",
          url: "/orders/create",
          icon: "CirclePlus",
          isActive: true,
          order: 2
        }
      });
    } else {
      createMenu = await prisma.menu.create({
        data: {
          title: "Create Order",
          url: "/orders/create",
          icon: "CirclePlus",
          order: 2,
          isActive: true
        }
      });
    }

    for (const role of roles) {
      const roleLower = role.name.toLowerCase();
      const isWaiter = roleLower.includes("waiter");
      const isPrivileged =
        roleLower.includes("admin") || roleLower.includes("manager");

      if (!isWaiter && !isPrivileged) continue;

      await prisma.roleMenuAccess.upsert({
        where: {
          roleId_menuId: { roleId: role.id, menuId: createMenu.id }
        },
        update: {
          canView: true,
          canAdd: true,
          canEdit: isPrivileged,
          canDelete: false
        },
        create: {
          roleId: role.id,
          menuId: createMenu.id,
          canView: true,
          canAdd: true,
          canEdit: isPrivileged,
          canDelete: false
        }
      });
    }

    createOrderMenuEnsured = true;
  } catch (error) {
    console.error("ensureCreateOrderMenuItem error:", error);
  }
}

/** Ensures Ready Pickup is a top-level sidebar item for waiters */
export async function ensurePickupOrdersMenuItem() {
  if (pickupOrdersMenuEnsured) return;
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: "waiter" } },
          { name: { contains: "Waiter" } },
          { name: { contains: "admin" } },
          { name: { contains: "Admin" } },
          { name: { contains: "manager" } },
          { name: { contains: "Manager" } },
        ],
      },
    });

    let pickupMenu = await prisma.menu.findFirst({
      where: {
        OR: [{ url: "/orders/pickup" }, { title: "Ready Pickup" }],
      },
    });

    if (pickupMenu) {
      pickupMenu = await prisma.menu.update({
        where: { id: pickupMenu.id },
        data: {
          title: "Ready Pickup",
          url: "/orders/pickup",
          icon: "BellRing",
          isActive: true,
          order: 3,
        },
      });
    } else {
      pickupMenu = await prisma.menu.create({
        data: {
          title: "Ready Pickup",
          url: "/orders/pickup",
          icon: "BellRing",
          order: 3,
          isActive: true,
        },
      });
    }

    for (const role of roles) {
      const roleLower = role.name.toLowerCase();
      const isWaiter = roleLower.includes("waiter");
      const isPrivileged =
        roleLower.includes("admin") || roleLower.includes("manager");

      if (!isWaiter && !isPrivileged) continue;

      await prisma.roleMenuAccess.upsert({
        where: {
          roleId_menuId: { roleId: role.id, menuId: pickupMenu.id },
        },
        update: {
          canView: true,
          canAdd: false,
          canEdit: isWaiter || isPrivileged,
          canDelete: false,
        },
        create: {
          roleId: role.id,
          menuId: pickupMenu.id,
          canView: true,
          canAdd: false,
          canEdit: isWaiter || isPrivileged,
          canDelete: false,
        },
      });
    }

    pickupOrdersMenuEnsured = true;
    clearAuthCaches();
  } catch (error) {
    console.error("ensurePickupOrdersMenuItem error:", error);
  }
}

/** Pickup history — waiter's own served orders */
export async function ensurePickupHistoryMenuItem() {
  if (pickupHistoryMenuEnsured) return;
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: "waiter" } },
          { name: { contains: "Waiter" } },
          { name: { contains: "admin" } },
          { name: { contains: "Admin" } },
          { name: { contains: "manager" } },
          { name: { contains: "Manager" } },
        ],
      },
    });

    let historyMenu = await prisma.menu.findFirst({
      where: {
        OR: [
          { url: "/orders/pickup/history" },
          { title: "Pickup History" },
        ],
      },
    });

    if (historyMenu) {
      historyMenu = await prisma.menu.update({
        where: { id: historyMenu.id },
        data: {
          title: "Pickup History",
          url: "/orders/pickup/history",
          icon: "History",
          isActive: true,
          order: 4,
        },
      });
    } else {
      historyMenu = await prisma.menu.create({
        data: {
          title: "Pickup History",
          url: "/orders/pickup/history",
          icon: "History",
          order: 4,
          isActive: true,
        },
      });
    }

    for (const role of roles) {
      const roleLower = role.name.toLowerCase();
      const isWaiter = roleLower.includes("waiter");
      const isPrivileged =
        roleLower.includes("admin") || roleLower.includes("manager");

      if (!isWaiter && !isPrivileged) continue;

      await prisma.roleMenuAccess.upsert({
        where: {
          roleId_menuId: { roleId: role.id, menuId: historyMenu.id },
        },
        update: {
          canView: true,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
        create: {
          roleId: role.id,
          menuId: historyMenu.id,
          canView: true,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        },
      });
    }

    pickupHistoryMenuEnsured = true;
    clearAuthCaches();
  } catch (error) {
    console.error("ensurePickupHistoryMenuItem error:", error);
  }
}

/** Ensures Rooms is a top-level sidebar item (like Clients) with admin/manager permissions */
export async function ensureRoomsMenuItem() {
  if (roomsMenuEnsured) return;
  try {
    const roles = await prisma.role.findMany({
      where: {
        OR: [
          { name: { contains: "admin" } },
          { name: { contains: "Admin" } },
          { name: { contains: "manager" } },
          { name: { contains: "Manager" } }
        ]
      }
    });

    if (roles.length === 0) return;

    // Remove old Rooms sub-menu under Kitchen & Menu (if any)
    const kitchenMenu = await prisma.menu.findFirst({
      where: { title: "Kitchen & Menu" }
    });
    if (kitchenMenu) {
      await prisma.submenu.updateMany({
        where: { title: "Rooms", menuId: kitchenMenu.id },
        data: { isActive: false }
      });
      await prisma.submenu.updateMany({
        where: { title: "Table Setup", menuId: kitchenMenu.id },
        data: { order: 3, isActive: true }
      });
    }

    let roomsMenu = await prisma.menu.findFirst({
      where: {
        OR: [{ url: "/rooms" }, { title: "Rooms" }]
      }
    });

    if (roomsMenu) {
      roomsMenu = await prisma.menu.update({
        where: { id: roomsMenu.id },
        data: {
          title: "Rooms",
          url: "/rooms",
          icon: "DoorOpen",
          isActive: true,
          order: roomsMenu.order > 0 ? roomsMenu.order : 6
        }
      });
    } else {
      roomsMenu = await prisma.menu.create({
        data: {
          title: "Rooms",
          url: "/rooms",
          icon: "DoorOpen",
          order: 6,
          isActive: true
        }
      });
    }

    for (const role of roles) {
      await prisma.roleMenuAccess.upsert({
        where: {
          roleId_menuId: {
            roleId: role.id,
            menuId: roomsMenu.id
          }
        },
        update: {
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true
        },
        create: {
          roleId: role.id,
          menuId: roomsMenu.id,
          canView: true,
          canAdd: true,
          canEdit: true,
          canDelete: true
        }
      });
    }
    roomsMenuEnsured = true;
  } catch (error) {
    console.error("ensureRoomsMenuItem error:", error);
  }
}

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

    clearRoleMenusCache();
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
    clearRoleMenusCache();
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
    clearRoleMenusCache();
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

    clearRoleMenusCache();
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
    clearRoleMenusCache();
    res.json({ success: true, data: submenu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.submenu.delete({ where: { id: Number(id) } });
    clearRoleMenusCache();
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

    const activeMenuPerms = (permissions || []).filter(
      (p) => p.canView || p.canAdd || p.canEdit || p.canDelete
    );

    await prisma.$transaction(async (tx) => {
      const existingMenuAccess = await tx.roleMenuAccess.findMany({
        where: { roleId },
        select: { id: true },
      });
      const existingIds = existingMenuAccess.map((m) => m.id);

      if (existingIds.length > 0) {
        await tx.roleSubMenuAccess.deleteMany({
          where: { roleMenuAccessId: { in: existingIds } },
        });
      }

      await tx.roleMenuAccess.deleteMany({ where: { roleId } });

      if (activeMenuPerms.length === 0) return;

      const createdAccess = await Promise.all(
        activeMenuPerms.map((menuPerm) =>
          tx.roleMenuAccess.create({
            data: {
              roleId,
              menuId: Number(menuPerm.menuId),
              canView: !!menuPerm.canView,
              canAdd: !!menuPerm.canAdd,
              canEdit: !!menuPerm.canEdit,
              canDelete: !!menuPerm.canDelete,
            },
          })
        )
      );

      const allSubRows = [];
      activeMenuPerms.forEach((menuPerm, index) => {
        const roleMenuAccessId = createdAccess[index].id;
        if (!Array.isArray(menuPerm.submenus)) return;

        for (const sp of menuPerm.submenus) {
          if (!sp.canView && !sp.canAdd && !sp.canEdit && !sp.canDelete) continue;
          allSubRows.push({
            roleMenuAccessId,
            subMenuId: Number(sp.submenuId),
            canView: !!sp.canView,
            canAdd: !!sp.canAdd,
            canEdit: !!sp.canEdit,
            canDelete: !!sp.canDelete,
          });
        }
      });

      if (allSubRows.length > 0) {
        await tx.roleSubMenuAccess.createMany({ data: allSubRows });
      }
    }, { timeout: 20000 });

    clearPermissionCache();
    clearRoleMenusCache(roleId);

    if (req.user) {
      trackingController
        .logAction(
          req.user.id,
          'UPDATE',
          'PERMISSIONS',
          roleId,
          `Updated system permissions for role ID: ${roleId}`
        )
        .catch(() => {});
    }

    res.json({ success: true, message: "Permissions updated successfully" });
  } catch (error) {
    console.error("CRITICAL: Error updating permissions:", error);
    res.status(500).json({
      success: false,
      message: "Server error during permission update",
      error: error.message,
    });
  }
};
