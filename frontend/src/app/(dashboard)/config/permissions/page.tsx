"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Save, 
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Shield,
  LayoutGrid,
  CheckCircle2,
  Lock
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
      window.dispatchEvent(new CustomEvent("sidebar-menu-updated"));
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
            ? "bg-[#605DFF] border border-[#605DFF] cursor-pointer"
            : "bg-white border border-zinc-300 hover:border-[#605DFF]/60 cursor-pointer"
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
    <div className="animate-in fade-in duration-500 font-sans mx-1">
      {/* Page Header */}
      <div className="mb-8 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2">
           
            Control Matrix
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Configure detailed access rights for each module and user group.</p>
        </div>
      </div>

      {/* Main Container Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-zinc-50/10">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Lock className="size-4 text-[#605DFF]" />
            </div>
            <div>
                <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-tight">Access Rights</h3>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Role:</span>
                <select 
                    value={selectedRoleId || ""} 
                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                    className="bg-transparent text-[13px] font-bold uppercase text-[#605DFF] outline-none cursor-pointer py-1 min-w-[120px]"
                >
                    {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
             </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || loading}
              className="h-[42px] px-8 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#605DFF]/20 border-none"
            >
              <Save className="size-4" />
              {saving ? "Processing..." : "Commit Changes"}
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#605DFF]">
              <tr className="border-none">
                <th className="px-8 py-4 text-[12px] font-black text-white uppercase tracking-widest border-none">Module / Sub-Module</th>
                <th className="px-6 py-4 text-[12px] font-black text-white uppercase tracking-widest border-none text-center w-32">View</th>
                <th className="px-6 py-4 text-[12px] font-black text-white uppercase tracking-widest border-none text-center w-32">Add</th>
                <th className="px-6 py-4 text-[12px] font-black text-white uppercase tracking-widest border-none text-center w-32">Edit</th>
                <th className="px-6 py-4 text-[12px] font-black text-white uppercase tracking-widest border-none text-center w-32">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse h-[60px]">
                    <td className="px-8 py-4"><div className="h-4 bg-zinc-100 rounded w-40" /></td>
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

                return (
                  <React.Fragment key={menu.id}>
                    <tr className={cn(
                      "transition-all duration-300",
                      hasSubmenus ? "bg-zinc-50/60" : "hover:bg-zinc-50/40"
                    )}>
                      <td className="px-8 py-5">
                        <span className="text-[13px] font-normal text-zinc-800 uppercase tracking-tight">
                          {menu.title}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <Checkbox
                          checked={menuPerms.canView}
                          onChange={() =>
                            hasSubmenus
                              ? handleMenuViewToggle(menu.id, hasSubmenus)
                              : handleLeafMenuToggle(menu.id, 'canView')
                          }
                        />
                      </td>

                      <td className="px-6 py-5">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canAdd}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canAdd')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canEdit}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canEdit')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {hasSubmenus ? null : (
                          <Checkbox
                            checked={menuPerms.canDelete}
                            onChange={() => handleLeafMenuToggle(menu.id, 'canDelete')}
                            disabled={!menuPerms.canView}
                          />
                        )}
                      </td>
                    </tr>

                    {hasSubmenus && menuPerms.canView && submenus.map((sm) => {
                      const smPerms = permissions[menu.id]?.submenus[sm.id] || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                      return (
                        <tr key={sm.id} className="bg-white hover:bg-[#605DFF]/[0.02] transition-colors border-zinc-50">
                          <td className="px-8 py-4 pl-20">
                            <div className="flex items-center gap-3">
                               <div className="size-1.5 rounded-full bg-[#605DFF]/30" />
                               <span className="text-[12px] font-normal text-zinc-500 uppercase tracking-tight">{sm.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canView}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canView')}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canAdd}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canAdd')}
                              disabled={!smPerms.canView}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Checkbox
                              size="sm"
                              checked={smPerms.canEdit}
                              onChange={() => handleSubMenuToggle(menu.id, sm.id, 'canEdit')}
                              disabled={!smPerms.canView}
                            />
                          </td>
                          <td className="px-6 py-4">
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
