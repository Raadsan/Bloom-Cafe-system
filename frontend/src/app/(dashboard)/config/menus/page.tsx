"use client";

import React, { useEffect, useState, useMemo } from "react";
import { menuApi, Menu, SubMenu } from "@/lib/api/menuApi";
import {
  Plus,
  Edit,
  Trash2,
  PlusCircle,
  LayoutGrid,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  UtensilsCrossed,
  ListOrdered,
  Users,
  PackageOpen,
  Settings2,
  Shield,
  Key,
  Activity,
  Bell,
  FileText,
  History,
  ClipboardList,
  Tag,
  BarChart3,
  CreditCard,
  ChevronRight,
  Monitor,
  Eye,
  GripVertical,
  Layers,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Icon mapping (same as sidebar) ──────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  UtensilsCrossed,
  ListOrdered,
  Users,
  Settings,
  PackageOpen,
  Settings2,
  Shield,
  Key,
  Activity,
  Bell,
  FileText,
  LayoutGrid,
  History,
  ClipboardList,
  Tag,
  BarChart3,
  CreditCard,
};

const ALL_ICONS = Object.keys(ICON_MAP);

function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] || LayoutDashboard;
}

// ─── Live Sidebar Preview ─────────────────────────────────────────────────────
function SidebarPreview({ menus }: { menus: Menu[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Preview toolbar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Live Preview
        </span>
        <button
          onClick={() => { setCollapsed(!collapsed); setOpenMenuId(null); }}
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all",
            collapsed
              ? "bg-[#605DFF] text-white shadow-sm"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          )}
        >
          <Monitor className="size-3" />
          {collapsed ? "Expanded" : "Collapsed"}
        </button>
      </div>

      {/* The mini sidebar */}
      <div
        className={cn(
          "flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden transition-all duration-300 flex-1",
          collapsed ? "w-[64px]" : "w-full"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center gap-2.5 border-b border-zinc-100 shrink-0",
          collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
        )}>
          <div className="w-7 h-7 shrink-0 rounded-md bg-[#605DFF] flex items-center justify-center">
            <UtensilsCrossed className="size-3.5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight overflow-hidden">
              <span className="text-[11px] font-black text-[#1E293B] uppercase tracking-tighter truncate">Restaurant</span>
              <span className="text-[8px] text-zinc-400 uppercase tracking-widest truncate">Management</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className={cn("flex flex-col gap-1 py-3 flex-1 overflow-y-auto", collapsed ? "px-2 items-center" : "px-3")}>
          {menus.filter(m => m.isActive !== false).map((menu) => {
            const Icon = getIcon(menu.icon);
            const hasChildren = (menu.items?.length ?? 0) > 0;
            const isOpen = openMenuId === menu.id;

            return (
              <div key={menu.id} className="w-full">
                <div
                  onClick={() => hasChildren && !collapsed && setOpenMenuId(isOpen ? null : menu.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg transition-all cursor-pointer group",
                    collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 h-9 w-full",
                    "hover:bg-[#F3F4FF] hover:text-[#605DFF] text-zinc-500"
                  )}
                  title={collapsed ? menu.title : undefined}
                >
                  <Icon className="size-3.5 shrink-0 group-hover:text-[#605DFF]" strokeWidth={2} />
                  {!collapsed && (
                    <>
                      <span className="text-[11px] font-semibold flex-1 truncate">{menu.title}</span>
                      {hasChildren && (
                        <ChevronRight className={cn("size-3 shrink-0 opacity-40 transition-transform", isOpen && "rotate-90")} />
                      )}
                    </>
                  )}
                </div>

                {/* Sub items */}
                {!collapsed && isOpen && hasChildren && (
                  <div className="ml-5 mt-0.5 border-l border-zinc-100 pl-3 flex flex-col gap-0.5 pb-1">
                    {menu.items?.filter(s => s.isActive !== false).map((sub) => (
                      <div
                        key={sub.id}
                        className="text-[10px] font-medium text-zinc-400 hover:text-[#605DFF] px-2 py-1.5 rounded-md hover:bg-[#F3F4FF]/60 cursor-pointer transition-colors truncate"
                      >
                        {sub.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {menus.filter(m => m.isActive !== false).length === 0 && (
            <div className={cn("flex flex-col items-center gap-1 py-6 opacity-30", collapsed ? "px-0" : "px-2")}>
              <Layers className="size-5 text-zinc-400" />
              {!collapsed && <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-center">No menus yet</span>}
            </div>
          )}
        </div>

        {/* Footer user area */}
        <div className={cn(
          "border-t border-zinc-100 shrink-0",
          collapsed ? "p-2 flex justify-center" : "p-3"
        )}>
          <div className={cn(
            "flex items-center gap-2 rounded-lg bg-zinc-50 border border-zinc-100",
            collapsed ? "w-10 h-10 justify-center" : "px-3 py-2 w-full"
          )}>
            <div className="w-6 h-6 shrink-0 rounded bg-[#605DFF] text-white text-[10px] font-bold flex items-center justify-center">A</div>
            {!collapsed && (
              <div className="flex flex-col leading-tight overflow-hidden flex-1">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-tight truncate">Admin User</span>
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest truncate">admin</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-white border border-zinc-100 rounded-lg p-2.5 text-center">
          <div className="text-lg font-black text-[#605DFF]">{menus.filter(m => m.isActive !== false).length}</div>
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Active</div>
        </div>
        <div className="bg-white border border-zinc-100 rounded-lg p-2.5 text-center">
          <div className="text-lg font-black text-zinc-400">{menus.reduce((a, m) => a + (m.items?.length ?? 0), 0)}</div>
          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Submenus</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState<Partial<Menu> | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [hasSubmenus, setHasSubmenus] = useState(false);
  const [menuSubmenus, setMenuSubmenus] = useState<
    { id?: number; title: string; url: string; order: number; isActive?: boolean }[]
  >([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    type: "menu" | "submenu";
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [iconSearch, setIconSearch] = useState("");
  const { showToast } = useToast();

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await menuApi.getAllMenus();
      setMenus(data);
    } catch (error) {
      console.error("Failed to fetch menus:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleSaveMenu = async () => {
    if (!editingMenu?.title || !editingMenu?.url) {
      showToast("Title and URL are required", "error");
      return;
    }
    setIsSaving(true);
    try {
      let menuId = editingMenu.id;
      if (menuId) {
        await menuApi.updateMenu(menuId, editingMenu);
      } else {
        const res = await menuApi.createMenu(editingMenu);
        menuId = res.data.id;
      }

      if (hasSubmenus) {
        for (const sm of menuSubmenus) {
          if (sm.title && sm.url) {
            if (sm.id) {
              await menuApi.updateSubMenu(sm.id, sm);
            } else {
              await menuApi.createSubMenu({
                menuId: menuId!,
                title: sm.title,
                url: sm.url,
                order: sm.order,
              });
            }
          }
        }
      }

      showToast(
        `Menu ${editingMenu.id ? "updated" : "created"} successfully`,
        "success"
      );
      setIsMenuDialogOpen(false);
      setEditingMenu(null);
      fetchMenus();
      window.dispatchEvent(new CustomEvent("sidebar-menu-updated"));
    } catch (error) {
      console.error("Failed to save menu:", error);
      showToast("Failed to save menu", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (itemToDelete.type === "menu") {
        await menuApi.deleteMenu(itemToDelete.id);
        showToast("Menu deleted successfully", "success");
      } else {
        await menuApi.deleteSubMenu(itemToDelete.id);
        showToast("Submenu deleted successfully", "success");
      }
      fetchMenus();
      window.dispatchEvent(new CustomEvent("sidebar-menu-updated"));
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      showToast("Failed to delete item", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMenus = useMemo(
    () =>
      menus.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.url.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [menus, searchQuery]
  );

  const filteredIcons = useMemo(
    () =>
      ALL_ICONS.filter((name) =>
        name.toLowerCase().includes(iconSearch.toLowerCase())
      ),
    [iconSearch]
  );

  const openNew = () => {
    setEditingMenu({
      title: "",
      url: "",
      icon: "LayoutDashboard",
      order: menus.length + 1,
      isActive: true,
    });
    setHasSubmenus(false);
    setMenuSubmenus([{ title: "", url: "", order: 1, isActive: true }]);
    setIconSearch("");
    setIsMenuDialogOpen(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingMenu(menu);
    const subms = menu.items || [];
    setHasSubmenus(subms.length > 0);
    setMenuSubmenus(
      subms.length > 0
        ? subms.map((s) => ({ ...s }))
        : [{ title: "", url: "", order: 1, isActive: true }]
    );
    setIconSearch("");
    setIsMenuDialogOpen(true);
  };

  const selectedIcon = editingMenu?.icon || "LayoutDashboard";
  const SelectedIconComp = getIcon(selectedIcon);

  return (
    <div className="animate-in fade-in duration-500 font-sans">
      {/* Page Header */}
      <div className="mb-6 px-1 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight">
            Sidebar Configuration
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">
            Configure main navigation, sub-modules and display order.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-5 items-start">
        {/* LEFT — management table */}
        <div className="flex-1 min-w-0 bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
          {/* Controls Row */}
          <div className="px-6 py-4 flex flex-wrap items-center gap-4 border-b border-zinc-100 bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Settings className="size-4 text-[#605DFF]" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-tight">
                  Navigation Structure
                </h3>
                <p className="text-[10px] text-zinc-400 font-medium">
                  {menus.length} menus · {menus.reduce((a, m) => a + (m.items?.length ?? 0), 0)} submenus
                </p>
              </div>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="relative w-60 group">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menus..."
                  className="w-full h-10 pl-9 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-[13px] text-zinc-600"
                />
              </div>

              <Button
                onClick={openNew}
                className="h-10 px-5 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-lg flex items-center gap-2 transition-colors font-bold text-[11px] uppercase tracking-widest shadow-sm border-none"
              >
                <Plus className="size-3.5" />
                Add Menu
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#605DFF]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none w-16">
                    #
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none w-14 text-center">
                    Icon
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none">
                    Menu
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none">
                    URL
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none">
                    Sub-Modules
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none text-center w-24">
                    Status
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-[11px] font-black uppercase text-white border-none text-right w-24">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="h-14 animate-pulse bg-zinc-50/40">
                      <TableCell colSpan={7} />
                    </TableRow>
                  ))
                ) : filteredMenus.length > 0 ? (
                  filteredMenus.map((menu) => {
                    const Icon = getIcon(menu.icon);
                    return (
                      <TableRow
                        key={menu.id}
                        className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group"
                      >
                        <TableCell className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="size-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="text-[12px] font-bold text-zinc-400">
                              {menu.order}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-lg bg-[#605DFF]/8 flex items-center justify-center">
                              <Icon className="size-4 text-[#605DFF]" strokeWidth={1.8} />
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          <span className="text-[13px] font-semibold text-zinc-800">
                            {menu.title}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          <span className="text-[11px] font-mono font-bold text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                            {menu.url}
                          </span>
                        </TableCell>

                        <TableCell className="px-5 py-4">
                          {menu.items && menu.items.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {menu.items.map((sub, idx) => (
                                <span
                                  key={idx}
                                  className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                >
                                  {sub.title}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-300 text-[10px] font-bold uppercase italic tracking-widest">
                              — direct link
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-center">
                          {menu.isActive !== false ? (
                            <div className="flex items-center justify-center gap-1 text-emerald-600">
                              <CheckCircle2 className="size-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Live
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-zinc-300">
                              <XCircle className="size-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Hidden
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(menu)}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-[#605DFF] hover:bg-[#605DFF]/5 rounded-lg transition-colors"
                            >
                              <Edit className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setItemToDelete({
                                  id: menu.id,
                                  type: "menu",
                                  name: menu.title,
                                });
                                setIsDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <LayoutGrid className="size-10 text-zinc-100" />
                        <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">
                          No menu configurations found
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* RIGHT — live sidebar preview */}
        <div className="w-[220px] shrink-0 sticky top-6">
          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="size-3.5 text-[#605DFF]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-zinc-600">
                Sidebar Preview
              </span>
            </div>
            <SidebarPreview menus={menus} />
          </div>
        </div>
      </div>

      {/* ─── ADD / EDIT MODAL ─── */}
      <Dialog
        open={isMenuDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsMenuDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[780px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-2xl">
          <div className="p-7 border-b border-zinc-100 bg-gradient-to-r from-[#605DFF]/5 to-transparent">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-[#1e293b] uppercase tracking-tight">
                {editingMenu?.id ? "Edit Menu Module" : "New Menu Module"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-sm mt-1">
                Configure navigation link, icon, order and sub-modules.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex gap-0 max-h-[75vh] overflow-hidden">
            {/* Form */}
            <div className="flex-1 px-7 py-6 space-y-5 overflow-y-auto">
              {/* Row 1: Title + URL */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Menu Title *
                  </label>
                  <input
                    type="text"
                    value={editingMenu?.title || ""}
                    onChange={(e) =>
                      setEditingMenu((prev) => ({
                        ...prev!,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Finance"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[14px] font-medium placeholder:text-zinc-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    URL Path *
                  </label>
                  <input
                    type="text"
                    value={editingMenu?.url || ""}
                    onChange={(e) =>
                      setEditingMenu((prev) => ({
                        ...prev!,
                        url: e.target.value,
                      }))
                    }
                    placeholder="e.g. /finance"
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[14px] font-mono font-medium placeholder:text-zinc-300"
                  />
                </div>
              </div>

              {/* Row 2: Order + Status */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={editingMenu?.order || 0}
                    onChange={(e) =>
                      setEditingMenu((prev) => ({
                        ...prev!,
                        order: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] transition-all text-[14px] font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Status
                  </label>
                  <select
                    value={editingMenu?.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setEditingMenu((prev) => ({
                        ...prev!,
                        isActive: e.target.value === "active",
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] transition-all text-[14px] font-medium appearance-none cursor-pointer"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Icon picker */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Icon
                </label>
                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                  {/* Current selection banner */}
                  <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#605DFF] flex items-center justify-center shadow-sm shadow-[#605DFF]/20">
                      <SelectedIconComp className="size-4 text-white" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-zinc-700">
                        {selectedIcon}
                      </div>
                      <div className="text-[10px] text-zinc-400">Selected icon</div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="px-3 pt-3">
                    <div className="relative">
                      <Search className="size-3 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="Search icons..."
                        className="w-full h-8 pl-8 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-[12px] outline-none focus:border-[#605DFF] transition-all"
                      />
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-8 gap-1 p-3 max-h-28 overflow-y-auto">
                    {filteredIcons.map((iconName) => {
                      const IconComp = getIcon(iconName);
                      const isSelected = selectedIcon === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          title={iconName}
                          onClick={() =>
                            setEditingMenu((prev) => ({
                              ...prev!,
                              icon: iconName,
                            }))
                          }
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-[#605DFF] shadow-sm shadow-[#605DFF]/20"
                              : "hover:bg-zinc-100"
                          )}
                        >
                          <IconComp
                            className={cn(
                              "size-4",
                              isSelected ? "text-white" : "text-zinc-500"
                            )}
                            strokeWidth={1.8}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-modules section */}
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => setHasSubmenus(!hasSubmenus)}
                  >
                    <div
                      className={cn(
                        "size-5 rounded border-2 flex items-center justify-center transition-all",
                        hasSubmenus
                          ? "bg-[#605DFF] border-[#605DFF]"
                          : "border-zinc-300"
                      )}
                    >
                      {hasSubmenus && (
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-widest text-zinc-600">
                      Enable Sub-modules
                    </span>
                  </div>
                  {hasSubmenus && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setMenuSubmenus([
                          ...menuSubmenus,
                          {
                            title: "",
                            url: "",
                            order: menuSubmenus.length + 1,
                            isActive: true,
                          },
                        ])
                      }
                      className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-[#605DFF] hover:bg-[#605DFF]/5"
                    >
                      <PlusCircle className="size-3 mr-1.5" />
                      Add Sub-module
                    </Button>
                  )}
                </div>

                {hasSubmenus && (
                  <div className="space-y-2">
                    {menuSubmenus.map((sm, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-zinc-50/60 p-3 rounded-xl border border-zinc-100 group hover:border-[#605DFF]/20 transition-all"
                      >
                        <div className="w-5 h-5 rounded bg-zinc-200 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black text-zinc-500">{idx + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Sub-module title"
                            value={sm.title}
                            onChange={(e) => {
                              const n = [...menuSubmenus];
                              n[idx].title = e.target.value;
                              setMenuSubmenus(n);
                            }}
                            className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-medium text-zinc-800 outline-none focus:border-[#605DFF] transition-all placeholder:text-zinc-300"
                          />
                          <input
                            type="text"
                            placeholder="/url-path"
                            value={sm.url}
                            onChange={(e) => {
                              const n = [...menuSubmenus];
                              n[idx].url = e.target.value;
                              setMenuSubmenus(n);
                            }}
                            className="px-3 py-2 bg-white border border-zinc-200 rounded-lg text-[12px] font-mono text-zinc-800 outline-none focus:border-[#605DFF] transition-all placeholder:text-zinc-300"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const n = [...menuSubmenus];
                            n.splice(idx, 1);
                            if (n.length === 0) setHasSubmenus(false);
                            setMenuSubmenus(n);
                          }}
                          className="h-9 w-9 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mini live preview inside dialog */}
            <div className="w-[180px] shrink-0 border-l border-zinc-100 bg-zinc-50/60 p-4 flex flex-col">
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
                Preview
              </div>
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex-1 flex flex-col">
                {/* header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-100">
                  <div className="w-5 h-5 rounded bg-[#605DFF] flex items-center justify-center">
                    <UtensilsCrossed className="size-3 text-white" />
                  </div>
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-tight truncate">Restaurant</span>
                </div>

                {/* items preview from current form state */}
                <div className="flex-1 px-2 py-2 space-y-1">
                  {/* existing menus */}
                  {menus
                    .filter((m) => m.id !== editingMenu?.id && m.isActive !== false)
                    .slice(0, 3)
                    .map((m) => {
                      const I = getIcon(m.icon);
                      return (
                        <div key={m.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-400">
                          <I className="size-3 shrink-0" strokeWidth={1.8} />
                          <span className="text-[9px] font-medium truncate">{m.title}</span>
                        </div>
                      );
                    })}
                  {menus.filter(m => m.id !== editingMenu?.id && m.isActive !== false).length > 3 && (
                    <div className="text-[8px] text-zinc-300 px-2 font-bold">···</div>
                  )}

                  {/* current editing item highlighted */}
                  {editingMenu?.title && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#605DFF]/10 border border-[#605DFF]/20">
                      <SelectedIconComp className="size-3 shrink-0 text-[#605DFF]" strokeWidth={2} />
                      <span className="text-[9px] font-bold text-[#605DFF] truncate">
                        {editingMenu.title || "…"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-7 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsMenuDialogOpen(false)}
              className="px-6 h-10 rounded-lg font-bold text-zinc-500 text-[12px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMenu}
              disabled={isSaving}
              className="px-8 h-10 rounded-lg font-bold bg-[#605DFF] hover:bg-[#4E4BCB] text-white shadow-lg shadow-[#605DFF]/20 border-none text-[12px]"
            >
              {isSaving
                ? editingMenu?.id
                  ? "Updating..."
                  : "Creating..."
                : editingMenu?.id
                ? "Update Module"
                : "Create Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRM MODAL ─── */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsDeleteDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[460px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl">
          <div className="p-8 flex items-start gap-5 pt-10">
            <div className="w-12 h-12 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-[#1E293B] mb-2">Remove Module?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-bold text-[#1E293B]">
                  "{itemToDelete?.name}"
                </span>
                ? This will also remove it from all role permissions.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="rounded-lg font-bold px-6 h-10 text-zinc-500 text-[12px]"
              disabled={isDeleting}
            >
              Go Back
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-10 shadow-lg shadow-rose-600/10 text-[12px]"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
