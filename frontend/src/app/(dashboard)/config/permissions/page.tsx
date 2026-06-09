"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleApi, Role } from "@/lib/api/roleApi";
import { menuApi, Menu } from "@/lib/api/menuApi";
import { authApi } from "@/lib/api/authApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
} from "@/lib/dashboard-ui";

interface PermissionState {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [permissions, setPermissions] = useState<Record<number, { 
    menu: PermissionState, 
    submenus: Record<number, PermissionState> 
  }>>({});
  const [loading, setLoading] = useState(true);
  const [permsLoading, setPermsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const { showToast } = useToast();

  const filteredMenus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allMenus;
    return allMenus.filter((menu) => {
      const menuMatch =
        menu.title.toLowerCase().includes(q) ||
        menu.url?.toLowerCase().includes(q);
      const subMatch = (menu.items || []).some(
        (sm) =>
          sm.title.toLowerCase().includes(q) ||
          sm.url?.toLowerCase().includes(q)
      );
      return menuMatch || subMatch;
    });
  }, [allMenus, searchQuery]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [rolesData, menusData] = await Promise.all([
          roleApi.getAllRoles(),
          menuApi.getAllMenus()
        ]);
        
        // Filter out inactive menus and submenus
        const activeMenus = (menusData || [])
          .filter((m: any) => m.isActive !== false)
          .map((m: any) => ({
            ...m,
            items: (m.items || []).filter((sm: any) => sm.isActive !== false)
          }));

        setRoles(rolesData || []);
        setAllMenus(activeMenus);
        
        if (rolesData && rolesData.length > 0) {
          setSelectedRoleId(rolesData[0].id);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        showToast("Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId, allMenus]);

  const fetchRolePermissions = async (roleId: number) => {
    if (!allMenus.length) return;
    try {
      setPermsLoading(true);
      const roleMenus = await menuApi.getMenusByRole(roleId);
      const newPerms: typeof permissions = {};
      
      allMenus.forEach(m => {
        const roleMenu = roleMenus?.find(rm => rm.id === m.id);
        const subMap: Record<number, PermissionState> = {};
        
        (m.items || []).forEach(sm => {
          const roleSub = roleMenu?.items?.find(rsm => rsm.id === sm.id);
          subMap[sm.id] = {
            canView: roleSub?.permissions?.canView || false,
            canAdd: roleSub?.permissions?.canAdd || false, 
            canEdit: roleSub?.permissions?.canEdit || false,
            canDelete: roleSub?.permissions?.canDelete || false
          };
        });

        newPerms[m.id] = {
          menu: {
            canView: roleMenu?.permissions?.canView || false,
            canAdd: roleMenu?.permissions?.canAdd || false,
            canEdit: roleMenu?.permissions?.canEdit || false,
            canDelete: roleMenu?.permissions?.canDelete || false
          },
          submenus: subMap
        };
      });

      setPermissions(newPerms);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      showToast("Error loading role permissions", "error");
    } finally {
      setPermsLoading(false);
    }
  };

  const handleMenuViewToggle = (menuId: number, hasSubmenus: boolean) => {
    setPermissions(prev => {
      const next = { ...prev };
      const current = next[menuId] || { menu: { canView: false, canAdd: false, canEdit: false, canDelete: false }, submenus: {} };
      const newCanView = !current.menu.canView;

      next[menuId] = {
        ...current,
        menu: {
          ...current.menu,
          canView: newCanView,
        },
        submenus: newCanView
          ? current.submenus
          : Object.fromEntries(
              Object.entries(current.submenus).map(([sid, sp]) => [
                sid,
                { canView: false, canAdd: false, canEdit: false, canDelete: false }
              ])
            )
      };
      return { ...next };
    });
  };

  const handleLeafMenuToggle = (menuId: number, type: keyof PermissionState) => {
    setPermissions(prev => {
      const next = { ...prev };
      const current = next[menuId] || { menu: { canView: false, canAdd: false, canEdit: false, canDelete: false }, submenus: {} };
      const newVal = !current.menu[type];

      const newMenu = { ...current.menu, [type]: newVal };
      if (newVal && type !== 'canView') {
        newMenu.canView = true;
      }
      if (type === 'canView' && !newVal) {
        newMenu.canAdd = false;
        newMenu.canEdit = false;
        newMenu.canDelete = false;
      }

      next[menuId] = { ...current, menu: newMenu };
      return { ...next };
    });
  };

  const handleSubMenuToggle = (menuId: number, submenuId: number, type: keyof PermissionState) => {
    setPermissions(prev => {
      const next = { ...prev };
      const current = next[menuId] || { menu: { canView: false, canAdd: false, canEdit: false, canDelete: false }, submenus: {} };
      const sm = current.submenus[submenuId] || { canView: false, canAdd: false, canEdit: false, canDelete: false };
      const newVal = !sm[type];

      const newSm = { ...sm, [type]: newVal };
      if (newVal && type !== 'canView') {
        newSm.canView = true;
      }
      if (type === 'canView' && !newVal) {
        newSm.canAdd = false;
        newSm.canEdit = false;
        newSm.canDelete = false;
      }

      const newSubmenus = { ...current.submenus, [submenuId]: newSm };
      const parentNeedsView = Object.values(newSubmenus).some(s => s.canView);

      next[menuId] = {
        ...current,
        menu: { ...current.menu, canView: parentNeedsView ? true : current.menu.canView },
        submenus: newSubmenus
      };
      return { ...next };
    });
  };

  const handleSave = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      const payload = Object.entries(permissions).map(([mId, data]) => ({
        menuId: Number(mId),
        ...data.menu,
        submenus: Object.entries(data.submenus).map(([smId, sData]) => ({
          submenuId: Number(smId),
          ...sData
        }))
      }));

      await menuApi.updatePermissions(selectedRoleId, payload);
      menuApi.clearMenuCache(selectedRoleId);
      showToast("Permissions updated successfully", "success");

      const currentUser = await authApi.getMe();
      if (currentUser.roleId === selectedRoleId) {
        window.dispatchEvent(
          new CustomEvent("sidebar-menu-updated", { detail: { roleId: selectedRoleId } })
        );
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("Failed to save permissions", "error");
    } finally {
      setSaving(false);
    }
  };

  const Checkbox = ({ 
    checked, 
    onChange, 
    disabled = false,
    size = "md"
  }: { 
    checked: boolean; 
    onChange: () => void; 
    disabled?: boolean;
    size?: "sm" | "md";
  }) => (
    <div className="flex items-center justify-center">
      <button
        type="button"
        onClick={disabled ? undefined : onChange}
        disabled={disabled}
        className={cn(
          "rounded flex items-center justify-center transition-all",
          size === "sm" ? "size-4" : "size-5",
          disabled
            ? "bg-zinc-100 border border-zinc-200 cursor-not-allowed opacity-40"
            : checked
            ? "bg-primary border border-primary cursor-pointer"
            : "bg-white border border-zinc-300 hover:border-primary/60 cursor-pointer"
        )}
      >
        {checked && !disabled && (
          <svg className={cn("text-white", size === "sm" ? "size-2.5" : "size-3")} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      <div className="mb-6 px-4">
        <h1 className={pageHeaderTitleClass}>Role Permissions</h1>
        <p className={pageHeaderSubtitleClass}>Configure view, add, edit and delete access for each module by role.</p>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-16 h-[42px] px-2 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-[13px] text-zinc-400 font-normal shrink-0">
              <span>Filter Role</span>
              <select
                value={selectedRoleId || ""}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-40 h-[42px] px-3 border border-zinc-200 rounded-md outline-none focus:border-primary transition-colors bg-white cursor-pointer text-sm font-normal text-zinc-600 capitalize"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <div className="relative w-64 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="h-[42px] px-6 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm border-none"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className={cn("border-t border-zinc-100 overflow-hidden bg-white", permsLoading && "opacity-60 pointer-events-none")}>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className={dashboardTableHeaderClass}>
                <TableRow className={dashboardTableHeadRowClass}>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left w-16")}>No</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Module / Sub-Module</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-center w-28")}>View</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-center w-28")}>Add</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-center w-28")}>Edit</TableHead>
                  <TableHead className={cn(dashboardTableHeadClass, "text-center w-28")}>Delete</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="h-14 animate-pulse">
                    <TableCell colSpan={6} className="px-6 py-3">
                      <div className="h-4 bg-zinc-100 rounded w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (() => {
                let rowNum = 0;
                const visibleMenus = filteredMenus.slice(0, pageSize);
                return visibleMenus.map((menu) => {
                const menuPerms = permissions[menu.id]?.menu || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                const submenus = menu.items || [];
                const hasSubmenus = submenus.length > 0;

                rowNum += 1;
                const currentRow = rowNum;
                return (
                  <React.Fragment key={menu.id}>
                    <TableRow className={cn(
                      dashboardTableBodyRowClass,
                      hasSubmenus ? "bg-zinc-50/60" : ""
                    )}>
                      <TableCell className={dashboardTableCellClass}>
                        <span className="text-[13px] font-bold text-primary">{currentRow}</span>
                      </TableCell>
                      <TableCell className={dashboardTableCellClass}>
                        <span className="text-[13px] font-medium text-zinc-800 uppercase tracking-tight">
                          {menu.title}
                        </span>
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                        <Checkbox
                          checked={menuPerms.canView}
                          onChange={() =>
                            hasSubmenus
                              ? handleMenuViewToggle(menu.id, hasSubmenus)
                              : handleLeafMenuToggle(menu.id, 'canView')
                          }
                        />
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canAdd}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canAdd')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canEdit}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canEdit')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </TableCell>
                      <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canDelete}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canDelete')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </TableCell>
                    </TableRow>

                    {hasSubmenus && menuPerms.canView && submenus.map((sm) => {
                      const smPerms = permissions[menu.id]?.submenus[sm.id] || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                      rowNum += 1;
                      const subRow = rowNum;
                      return (
                        <TableRow key={sm.id} className={dashboardTableBodyRowClass}>
                          <TableCell className={dashboardTableCellClass}>
                            <span className="text-[13px] font-bold text-primary">{subRow}</span>
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "pl-10")}>
                            <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-tight">{sm.title}</span>
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                            <Checkbox
                              size="sm"
                              checked={smPerms.canView}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canView')}
                            />
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                            <Checkbox
                              size="sm"
                              checked={smPerms.canAdd}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canAdd')}
                              disabled={!smPerms.canView}
                            />
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                            <Checkbox
                              size="sm"
                              checked={smPerms.canEdit}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canEdit')}
                              disabled={!smPerms.canView}
                            />
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-center")}>
                            <Checkbox
                              size="sm"
                              checked={smPerms.canDelete}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canDelete')}
                              disabled={!smPerms.canView}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                );
              });
              })()}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
