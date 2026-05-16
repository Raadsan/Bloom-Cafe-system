"use client";

import React, { useEffect, useState } from "react";
import { menuApi, Menu, SubMenu } from "@/lib/api/menuApi";
import { 
  Plus, 
  Edit, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  PlusCircle,
  GripVertical,
  LayoutGrid,
  ExternalLink,
  Settings,
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMenu, setEditingMenu] = useState<Partial<Menu> | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [hasSubmenus, setHasSubmenus] = useState(false);
  const [menuSubmenus, setMenuSubmenus] = useState<{ id?: number, title: string, url: string, order: number, isActive?: boolean }[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: 'menu' | 'submenu', name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
                order: sm.order
              });
            }
          }
        }
      }

      showToast(`Menu ${editingMenu.id ? 'updated' : 'created'} successfully`, "success");
      setIsMenuDialogOpen(false);
      setEditingMenu(null);
      fetchMenus();
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
      if (itemToDelete.type === 'menu') {
        await menuApi.deleteMenu(itemToDelete.id);
        showToast("Menu deleted successfully", "success");
      } else {
        await menuApi.deleteSubMenu(itemToDelete.id);
        showToast("Submenu deleted successfully", "success");
      }
      fetchMenus();
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      showToast("Failed to delete item", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMenus = menus.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 font-sans mx-1">
      {/* Page Header */}
      <div className="mb-6 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1e293b] uppercase tracking-tight flex items-center gap-2">
            
            Sidebar Configuration
          </h1>
          <p className="text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium italic">Configure main navigation, sub-modules and display order.</p>
        </div>
      </div>

      {/* Main Container Box */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Controls Row */}
        <div className="px-8 py-4 flex flex-wrap items-center gap-6 border-b border-zinc-50 bg-zinc-50/10">
          <div className="flex items-center gap-4">
            <div className="size-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                <Settings className="size-4 text-[#605DFF]" />
            </div>
            <div>
                <h3 className="text-[13px] font-bold text-zinc-800 uppercase tracking-tight">Navigation Structure</h3>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 group">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#605DFF] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search menus..."
                className="w-full h-[42px] pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-md outline-none focus:border-[#605DFF] focus:ring-1 focus:ring-[#605DFF]/10 transition-all text-sm font-normal text-zinc-600"
              />
            </div>

            <Button
              onClick={() => {
                setEditingMenu({ title: "", url: "", icon: "LayoutDashboard", order: (menus.length + 1), isActive: true });
                setHasSubmenus(false);
                setMenuSubmenus([{ title: "", url: "", order: 1, isActive: true }]);
                setIsMenuDialogOpen(true);
              }}
              className="h-[42px] px-6 bg-[#605DFF] hover:bg-[#4f4cef] text-white rounded-md flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest shadow-sm"
            >
              <Plus className="size-4" />
              Add Main Menu
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-[#605DFF]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none w-20">Order</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none w-10 text-center">Icon</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">Menu Title</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none">URL Path</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-center">Sub-Modules</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-center">Status</TableHead>
                <TableHead className="px-6 py-4 text-[12px] font-black uppercase text-white border-none text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="h-16 animate-pulse bg-muted/5"><TableCell colSpan={6} /></TableRow>
                ))
              ) : filteredMenus.length > 0 ? (
                filteredMenus.map((menu) => (
                  <TableRow key={menu.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="size-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[13px] text-zinc-600">
                            {menu.order}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100 min-w-[60px]">
                            {menu.icon || "None"}
                          </span>
                       </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-[13px] font-normal text-zinc-800 uppercase tracking-tight">{menu.title}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <span className="text-[11px] font-black tracking-widest text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                         {menu.url}
                       </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                        {menu.items && menu.items.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {menu.items.map((sub, idx) => (
                                    <span key={idx} className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                        {sub.title}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-zinc-300 text-[10px] font-bold uppercase italic tracking-widest">No Submenus</div>
                        )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                        {menu.isActive ? (
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="size-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1.5 text-zinc-300">
                                <XCircle className="size-3.5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hidden</span>
                            </div>
                        )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => {
                                setEditingMenu(menu);
                                const subms = menu.items || [];
                                setHasSubmenus(subms.length > 0);
                                setMenuSubmenus(subms.length > 0 ? subms.map(s => ({ ...s })) : [{ title: "", url: "", order: 1, isActive: true }]);
                                setIsMenuDialogOpen(true);
                             }}
                             className="h-8 w-8 p-0 text-[#64748B] hover:text-[#605DFF] hover:bg-[#605DFF]/5 rounded-lg transition-colors"
                           >
                             <Edit className="size-4" />
                           </Button>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             onClick={() => {
                                setItemToDelete({ id: menu.id, type: 'menu', name: menu.title });
                                setIsDeleteDialogOpen(true);
                             }}
                             className="h-8 w-8 p-0 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                           >
                             <Trash2 className="size-4" />
                           </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <LayoutGrid className="size-12 text-zinc-100" />
                      <p className="text-zinc-400 font-black uppercase text-[11px] tracking-widest">No menu configurations found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <Dialog open={isMenuDialogOpen} onOpenChange={(open) => { if(!open) setIsMenuDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[750px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl">
          <div className="p-8 border-b border-zinc-100 bg-zinc-50/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-[#1e293b]">
                {editingMenu?.id ? "Edit Module" : "New Module Configuration"}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-sm mt-1">
                Configure main navigation link, order and its associated sub-modules.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Row 1: Title and URL */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Module Title *</label>
                <input 
                  type="text"
                  value={editingMenu?.title || ""} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, title: e.target.value }))}
                  placeholder="e.g. Finance"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-medium placeholder:text-zinc-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">URL Path *</label>
                <input 
                  type="text"
                  value={editingMenu?.url || ""} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, url: e.target.value }))}
                  placeholder="e.g. /finance"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] focus:ring-4 focus:ring-[#605DFF]/5 transition-all text-[15px] font-mono font-medium placeholder:text-zinc-400"
                />
              </div>
            </div>

            {/* Row 2: Icon and Order */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Icon Name</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={editingMenu?.icon || ""} 
                    onChange={(e) => setEditingMenu(prev => ({ ...prev!, icon: e.target.value }))}
                    placeholder="e.g. LayoutDashboard, Settings..."
                    className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] transition-all text-[15px] font-medium placeholder:text-zinc-400"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    <LayoutGrid className="size-4" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Display Order</label>
                <input 
                  type="number"
                  value={editingMenu?.order || 0} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] transition-all text-[15px] font-medium"
                />
              </div>
            </div>

            {/* Row 3: Status */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1e293b]">Status</label>
                <select
                  value={editingMenu?.isActive ? "active" : "inactive"}
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, isActive: e.target.value === "active" }))}
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF] transition-all text-[15px] font-medium appearance-none cursor-pointer"
                >
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Inactive (Hidden)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setHasSubmenus(!hasSubmenus)}>
                     <div className={cn("size-5 rounded border-2 flex items-center justify-center transition-all", hasSubmenus ? "bg-[#605DFF] border-[#605DFF]" : "border-zinc-300")}>
                         {hasSubmenus && <Plus className="size-3 text-white" />}
                     </div>
                     <span className="text-sm font-bold text-[#1e293b]">Enable Sub-modules</span>
                  </div>
                  {hasSubmenus && (
                      <Button variant="ghost" size="sm" onClick={() => setMenuSubmenus([...menuSubmenus, { title: "", url: "", order: menuSubmenus.length + 1, isActive: true }])} className="h-8 px-3 text-[11px] font-bold uppercase tracking-widest text-[#605DFF] hover:bg-[#605DFF]/5">
                        <PlusCircle className="size-3 mr-1.5" /> Add Sub-module
                      </Button>
                  )}
              </div>

              {hasSubmenus && (
                <div className="space-y-3">
                  {menuSubmenus.map((sm, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 group transition-all hover:border-[#605DFF]/20">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <input 
                          type="text"
                          placeholder="Submenu Title"
                          value={sm.title}
                          onChange={(e) => {
                            const newSms = [...menuSubmenus];
                            newSms[idx].title = e.target.value;
                            setMenuSubmenus(newSms);
                          }}
                          className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-800 outline-none focus:border-[#605DFF]"
                        />
                        <input 
                          type="text"
                          placeholder="Submenu URL"
                          value={sm.url}
                          onChange={(e) => {
                            const newSms = [...menuSubmenus];
                            newSms[idx].url = e.target.value;
                            setMenuSubmenus(newSms);
                          }}
                          className="px-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 outline-none focus:border-[#605DFF]"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                            const newSms = [...menuSubmenus];
                            newSms.splice(idx, 1);
                            if (newSms.length === 0) setHasSubmenus(false);
                            setMenuSubmenus(newSms);
                        }} 
                        className="h-10 w-10 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="px-8 py-6 bg-zinc-50/50 border-t border-zinc-100 flex items-center sm:justify-end gap-3">
            <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)} className="px-6 h-11 rounded-lg font-bold text-zinc-500">
              Cancel
            </Button>
            <Button onClick={handleSaveMenu} disabled={isSaving} className="px-8 h-11 rounded-lg font-bold bg-[#605DFF] hover:bg-[#4E4BCB] text-white shadow-lg shadow-[#605DFF]/20 border-none">
              {isSaving ? (editingMenu?.id ? "Updating..." : "Creating...") : (editingMenu?.id ? "Update Module" : "Create Module")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE MODAL */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { if(!open) setIsDeleteDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[480px] bg-white border-none p-0 overflow-hidden rounded-2xl shadow-xl">
          <div className="p-8 flex items-start gap-6 pt-10">
            <div className="w-14 h-14 shrink-0 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
              <Trash2 className="size-6 text-rose-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1E293B] mb-2">Remove Module?</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-[#1E293B]">"{itemToDelete?.name}"</span>? 
                This will remove it from the sidebar for all roles.
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-lg font-bold px-6 h-11 text-zinc-500" disabled={isDeleting}>
              Go Back
            </Button>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-8 h-11 shadow-lg shadow-rose-600/10" disabled={isDeleting}>
              {isDeleting ? "Processing..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
