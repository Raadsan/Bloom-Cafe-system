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
  GripVertical
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
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
  const [editingSubMenu, setEditingSubMenu] = useState<Partial<SubMenu> & { menuId?: number } | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<number, boolean>>({});
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [hasSubmenus, setHasSubmenus] = useState(false);
  const [menuSubmenus, setMenuSubmenus] = useState<{ id?: number, title: string, url: string, order: number }[]>([]);
  const [isSubMenuDialogOpen, setIsSubMenuDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: 'menu' | 'submenu', name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (!editingMenu?.title || !editingMenu?.url) return;
    
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
    }
  };

  const handleSaveSubMenu = async () => {
    if (!editingSubMenu?.title || !editingSubMenu?.url) return;
    
    try {
      if (editingSubMenu.id) {
        await menuApi.updateSubMenu(editingSubMenu.id, editingSubMenu);
        showToast("Submenu updated successfully", "success");
      } else {
        await menuApi.createSubMenu({
          menuId: editingSubMenu.menuId!,
          title: editingSubMenu.title,
          url: editingSubMenu.url,
          order: editingSubMenu.order
        });
        showToast("Submenu created successfully", "success");
      }
      setIsSubMenuDialogOpen(false);
      setEditingSubMenu(null);
      fetchMenus();
    } catch (error) {
      console.error("Failed to save submenu:", error);
      showToast("Failed to save submenu", "error");
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

  const toggleExpand = (id: number) => {
    setExpandedMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sidebar Management</h2>
          <p className="text-muted-foreground font-medium text-sm">Configure your sidebar navigation structure.</p>
        </div>
      </div>

      <Card className="border-zinc-200/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-zinc-100 bg-zinc-50/30">
          <div>
            <CardTitle className="text-lg">Menu Structure</CardTitle>
            <CardDescription className="text-xs">Manage main menus and their associated submenus.</CardDescription>
          </div>
          <Button 
            className="h-10 bg-primary text-white hover:bg-primary/90 shadow-sm px-4"
            onClick={() => {
              setEditingMenu({ title: "", url: "", icon: "LayoutDashboard", order: (menus.length + 1) });
              setHasSubmenus(false);
              setMenuSubmenus([{ title: "", url: "", order: 1 }]);
              setIsMenuDialogOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add New Menu
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[80px] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pl-6">Order</TableHead>
                <TableHead className="w-[20%] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Title</TableHead>
                <TableHead className="w-[20%] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">URL Path</TableHead>
                <TableHead className="w-[25%] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Submenus</TableHead>
                <TableHead className="w-[15%] text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Status</TableHead>
                <TableHead className="w-[120px] text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-none">
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">Loading database records...</TableCell>
                </TableRow>
              ) : menus.length === 0 ? (
                <TableRow className="border-none">
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No menus found.</TableCell>
                </TableRow>
              ) : (
                menus.map((menu) => (
                  <React.Fragment key={menu.id}>
                    <TableRow className="group transition-all border-none hover:bg-zinc-50/40">
                      <TableCell className="font-mono text-[10px] text-zinc-400 pl-6">
                        <div className="flex items-center gap-2">
                          <GripVertical className="size-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {menu.order}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-700">{menu.title}</TableCell>
                      <TableCell className="text-zinc-500 font-mono text-xs">{menu.url}</TableCell>
                      <TableCell>
                        {menu.items && menu.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {menu.items.map((sub, idx) => (
                              <span key={idx} className="bg-[#605DFF]/10 border border-[#605DFF]/20 text-[#605DFF] px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap">
                                {sub.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-zinc-400 text-xs italic">—</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                          menu.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                        )}>
                          {menu.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                            setEditingMenu(menu);
                            const subms = menu.items || [];
                            setHasSubmenus(subms.length > 0);
                            setMenuSubmenus(subms.length > 0 ? subms.map(s => ({ ...s })) : [{ title: "", url: "", order: 1 }]);
                            setIsMenuDialogOpen(true);
                          }}>
                            <Edit className="size-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                            setItemToDelete({ id: menu.id, type: 'menu', name: menu.title });
                            setIsDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="size-4 text-destructive/70" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="h-4 border-none hover:bg-transparent"><TableCell colSpan={6}></TableCell></TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Menu Edit Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={(open) => { if(!open) setIsMenuDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[700px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold">
              {editingMenu?.id ? "Edit Main Menu" : "Create New Menu"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Adjust the core sidebar item. The URL should start with / (e.g. /orders).
            </DialogDescription>
          </div>
          
          <div className="p-6 grid gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Title *</label>
              <input 
                type="text"
                value={editingMenu?.title || ""} 
                onChange={(e) => setEditingMenu(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="e.g. Marketing"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">URL Path *</label>
              <input 
                type="text"
                value={editingMenu?.url || ""} 
                onChange={(e) => setEditingMenu(prev => ({ ...prev!, url: e.target.value }))}
                placeholder="e.g. /marketing"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Icon Name</label>
                <input 
                  type="text"
                  value={editingMenu?.icon || ""} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, icon: e.target.value }))}
                  placeholder="e.g. Activity"
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1E293B]">Display Order</label>
                <input 
                  type="number"
                  value={editingMenu?.order || 0} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer w-max">
                <input 
                  type="checkbox" 
                  checked={hasSubmenus} 
                  onChange={(e) => setHasSubmenus(e.target.checked)} 
                  className="w-4 h-4 rounded border-zinc-300 text-[#605DFF] focus:ring-[#605DFF]"
                />
                <span className="text-sm font-bold text-[#1E293B]">Has Submenus?</span>
              </label>
            </div>

            {hasSubmenus && (
              <div className="space-y-3 pt-4 border-t border-zinc-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-zinc-700">Submenus List</h4>
                  <Button variant="outline" size="sm" onClick={() => setMenuSubmenus([...menuSubmenus, { title: "", url: "", order: menuSubmenus.length + 1 }])} className="h-8 px-3 text-xs font-bold text-[#605DFF] border-[#605DFF]/20 hover:bg-[#605DFF]/5">
                    <Plus className="size-3 mr-1" /> Add Submenu
                  </Button>
                </div>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 pb-2">
                  {menuSubmenus.map((sm, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-zinc-50/50 p-3 rounded-lg border border-zinc-100 relative">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input 
                            type="text"
                            placeholder="Title (e.g. Campaigns)"
                            value={sm.title}
                            onChange={(e) => {
                              const newSms = [...menuSubmenus];
                              newSms[idx].title = e.target.value;
                              setMenuSubmenus(newSms);
                            }}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm outline-none focus:border-[#605DFF]/30 font-medium"
                          />
                          <input 
                            type="text"
                            placeholder="URL (e.g. /marketing)"
                            value={sm.url}
                            onChange={(e) => {
                              const newSms = [...menuSubmenus];
                              newSms[idx].url = e.target.value;
                              setMenuSubmenus(newSms);
                            }}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-sm outline-none focus:border-[#605DFF]/30 font-mono"
                          />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newSms = [...menuSubmenus];
                        newSms.splice(idx, 1);
                        if (newSms.length === 0) newSms.push({ title: "", url: "", order: 1 });
                        setMenuSubmenus(newSms);
                      }} className="h-9 w-9 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-md shrink-0">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)} className="rounded-lg font-bold px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleSaveMenu} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">
              Save Menu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SubMenu Edit Dialog */}
      <Dialog open={isSubMenuDialogOpen} onOpenChange={(open) => { if(!open) setIsSubMenuDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[500px] bg-white border-zinc-100 p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <DialogTitle className="text-xl font-bold">
              {editingSubMenu?.id ? "Edit Submenu" : "Add New Submenu"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Create a sub-item under the selected main menu.
            </DialogDescription>
          </div>
          
          <div className="p-6 grid gap-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Title *</label>
              <input 
                type="text"
                value={editingSubMenu?.title || ""} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="e.g. Campaigns"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">URL Path *</label>
              <input 
                type="text"
                value={editingSubMenu?.url || ""} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, url: e.target.value }))}
                placeholder="e.g. /marketing/campaigns"
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B]">Display Order</label>
              <input 
                type="number"
                value={editingSubMenu?.order || 0} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-lg outline-none focus:border-[#605DFF]/30 focus:ring-2 focus:ring-[#605DFF]/10 transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <DialogFooter className="p-6 bg-zinc-50/50 border-t border-zinc-100 gap-3">
            <Button variant="outline" onClick={() => setIsSubMenuDialogOpen(false)} className="rounded-lg font-bold px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleSaveSubMenu} className="bg-[#605DFF] hover:bg-[#4E4BCB] text-white rounded-lg font-bold border-none px-8 h-11">
              Save Submenu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DELETE MODAL */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => { if(!open) setIsDeleteDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[440px] bg-white border-zinc-100 p-0 overflow-hidden">
          <DialogTitle className="sr-only">Delete Item</DialogTitle>
          <div className="p-6 flex flex-col items-center text-center pt-10">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <Trash2 className="size-8 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Item?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-bold text-foreground">"{itemToDelete?.name}"</span>? 
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="p-6 gap-3 bg-zinc-50/50 border-t border-zinc-100 flex-row justify-center w-full">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-lg font-bold px-6 h-11 w-full" disabled={isDeleting}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold border-none px-6 h-11 w-full" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
