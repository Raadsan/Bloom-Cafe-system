"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Save, 
  Lock, 
  LayoutGrid,
  Shield,
  ChevronDown,
  ChevronRight
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
  }, [selectedRoleId]);

  const fetchRolePermissions = async (roleId: number) => {
    try {
      setLoading(true);
      const roleMenus = await menuApi.getMenusByRole(roleId);
      const newPerms: typeof permissions = {};
      
      allMenus.forEach(m => {
        const roleMenu = roleMenus.find(rm => rm.id === m.id);
        const subMap: Record<number, PermissionState> = {};
        
        m.items?.forEach(sm => {
          const roleSub = roleMenu?.items?.find(rsm => rsm.id === sm.id);
          subMap[sm.id] = {
            canView: !!roleSub,
            canAdd: false, 
            canEdit: false,
            canDelete: false
          };
        });

        newPerms[m.id] = {
          menu: {
            canView: !!roleMenu,
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

  const handleToggle = (menuId: number, type: keyof PermissionState, submenuId?: number) => {
    setPermissions(prev => {
      const next = { ...prev };
      if (submenuId) {
        next[menuId].submenus[submenuId][type] = !next[menuId].submenus[submenuId][type];
        if (type === 'canView' && next[menuId].submenus[submenuId].canView) {
          next[menuId].menu.canView = true;
        }
      } else {
        next[menuId].menu[type] = !next[menuId].menu[type];
        if (type === 'canView' && !next[menuId].menu[type]) {
          Object.keys(next[menuId].submenus).forEach(sid => {
            next[menuId].submenus[Number(sid)].canView = false;
          });
        }
      }
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

  return (
    <div className="space-y-6">
      {/* Header with Title and underlined accent */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <h1 className="text-[20px] font-black text-[#1E293B] uppercase tracking-tight relative inline-block">
            System Permissions
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-[#605DFF] rounded-full" />
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Role Selector placed to the left of the button */}
          <div className="relative">
            <select 
              value={selectedRoleId || ""} 
              onChange={(e) => setSelectedRoleId(Number(e.target.value))}
              className="appearance-none h-[42px] pl-4 pr-10 bg-white border border-zinc-200 rounded-lg text-[13px] font-bold text-[#1E293B] uppercase tracking-wider outline-none focus:border-[#605DFF] transition-all cursor-pointer min-w-[180px]"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[#64748B] pointer-events-none" />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-black text-[12px] uppercase tracking-widest border-none shadow-md transition-all flex items-center gap-2"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Access Control Matrix Card */}
      <div className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-50">
          <h3 className="text-[14px] font-black text-[#1E293B] uppercase tracking-tight">Access Control Matrix</h3>
          <p className="text-[12px] font-medium text-[#64748B] mt-1">
            Define which roles can view, add, edit, or delete items in each module.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em]">Module</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[120px]">View</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[120px]">Add</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[120px]">Edit</th>
                <th className="px-6 py-4 text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em] text-center w-[120px]">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-muted/5 h-[60px]"><td colSpan={5} /></tr>
                ))
              ) : allMenus.map((menu) => {
                const menuPerms = permissions[menu.id]?.menu || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                const submenus = menu.items || [];

                return (
                  <React.Fragment key={menu.id}>
                    <tr className="hover:bg-zinc-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[13px] font-black text-[#1E293B] uppercase tracking-tight">{menu.title}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={menuPerms.canView} 
                          onChange={() => handleToggle(menu.id, 'canView')}
                          className="size-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={menuPerms.canAdd} 
                          onChange={() => handleToggle(menu.id, 'canAdd')}
                          className="size-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={menuPerms.canEdit} 
                          onChange={() => handleToggle(menu.id, 'canEdit')}
                          className="size-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={menuPerms.canDelete} 
                          onChange={() => handleToggle(menu.id, 'canDelete')}
                          className="size-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                        />
                      </td>
                    </tr>
                    
                    {submenus.map((sm) => {
                      const smPerms = permissions[menu.id]?.submenus[sm.id] || { canView: false, canAdd: false, canEdit: false, canDelete: false };
                      return (
                        <tr key={sm.id} className="bg-zinc-50/10 hover:bg-zinc-50/40 transition-colors">
                          <td className="px-6 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
                              <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-tight">{sm.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={smPerms.canView} 
                              onChange={() => handleToggle(menu.id, 'canView', sm.id)}
                              className="size-3.5 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={smPerms.canAdd} 
                              onChange={() => handleToggle(menu.id, 'canAdd', sm.id)}
                              className="size-3.5 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={smPerms.canEdit} 
                              onChange={() => handleToggle(menu.id, 'canEdit', sm.id)}
                              className="size-3.5 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={smPerms.canDelete} 
                              onChange={() => handleToggle(menu.id, 'canDelete', sm.id)}
                              className="size-3.5 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF] transition-all cursor-pointer"
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
