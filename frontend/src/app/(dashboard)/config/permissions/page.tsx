"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Save, 
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleApi, Role } from "@/lib/api/roleApi";
import { menuApi, Menu, SubMenu } from "@/lib/api/menuApi";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

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
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [rolesData, menusData] = await Promise.all([
          roleApi.getAllRoles(),
          menuApi.getAllMenus()
        ]);
        setRoles(rolesData || []);
        setAllMenus(menusData || []);
        
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
      setLoading(true);
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
      setLoading(false);
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
      showToast("Permissions updated successfully", "success");
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
          "rounded border-2 flex items-center justify-center transition-all",
          size === "sm" ? "size-[14px]" : "size-[18px]",
          disabled
            ? "border-zinc-100 bg-zinc-50 cursor-not-allowed opacity-30"
            : checked
            ? "border-[#605DFF] bg-[#605DFF] cursor-pointer shadow-sm shadow-[#605DFF]/30"
            : "border-zinc-300 bg-white hover:border-[#605DFF]/60 cursor-pointer"
        )}
      >
        {checked && !disabled && (
          <svg className={cn("text-white", size === "sm" ? "size-2" : "size-2.5")} fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">System Permissions</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
            Manage system access levels and role-based permissions.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30">
          <div>
            <h3 className="text-sm font-bold text-foreground">Access Control Matrix</h3>
            <p className="text-[12px] font-medium text-muted-foreground mt-1">
              Define which roles can view, add, edit, or delete items in each module.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative group w-full md:w-auto">
              <select 
                value={selectedRoleId || ""} 
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="appearance-none h-[42px] pl-4 pr-10 bg-white border border-zinc-100 rounded-lg text-[13px] font-bold text-[#1E293B] outline-none focus:border-[#605DFF]/30 focus:ring-4 focus:ring-[#605DFF]/5 transition-all cursor-pointer min-w-[160px] shadow-sm"
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B] pointer-events-none" />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || loading}
              className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold text-[13px] uppercase tracking-widest border-none shadow-md transition-all flex items-center gap-2"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/70 border-b border-zinc-100">
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em]">Module</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[110px]">View</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[110px]">Add</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[110px]">Edit</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[110px]">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-[60px]">
                    <td className="px-6 py-4"><div className="h-4 bg-zinc-100 rounded w-40" /></td>
                    {[0,1,2,3].map(j => (
                      <td key={j} className="px-6 py-4 text-center">
                        <div className="h-4 w-4 bg-zinc-100 rounded mx-auto" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : allMenus.map((menu) => {
                const menuPerms = permissions[menu.id]?.menu || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                const submenus = menu.items || [];
                const hasSubmenus = submenus.length > 0;
                const isExpanded = menuPerms.canView;

                return (
                  <React.Fragment key={menu.id}>
                    <tr className={cn(
                      "transition-colors",
                      hasSubmenus ? "bg-zinc-50/40 hover:bg-zinc-50/80" : "hover:bg-zinc-50/30"
                    )}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[13px] font-black text-[#1E293B] uppercase tracking-tight">
                            {menu.title}
                          </span>
                          {hasSubmenus && (
                            <span className="text-[9px] font-black text-[#605DFF]/60 uppercase tracking-widest bg-[#605DFF]/5 px-1.5 py-0.5 rounded">
                              {submenus.length} sub
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <Checkbox
                          checked={menuPerms.canView}
                          onChange={() =>
                            hasSubmenus
                              ? handleMenuViewToggle(menu.id, hasSubmenus)
                              : handleLeafMenuToggle(menu.id, 'canView')
                          }
                        />
                      </td>

                      <td className="px-6 py-4 text-center">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canAdd}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canAdd')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canEdit}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canEdit')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canDelete}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canDelete')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>
                    </tr>

                    {hasSubmenus && isExpanded && submenus.map((sm) => {
                      const smPerms = permissions[menu.id]?.submenus[sm.id] || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                      return (
                        <tr key={sm.id} className="bg-white hover:bg-[#605DFF]/[0.02] transition-colors border-zinc-50">
                          <td className="px-6 py-3 pl-16">
                            <div className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-[#605DFF]/40" />
                              <span className="text-[12px] font-semibold text-[#64748B] tracking-tight">{sm.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canView}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canView')}
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canAdd}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canAdd')}
                              disabled={!smPerms.canView}
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canEdit}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canEdit')}
                              disabled={!smPerms.canView}
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canDelete}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canDelete')}
                              disabled={!smPerms.canView}
                            />
                          </td>
                        </tr>
                      );
                    })}

                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

