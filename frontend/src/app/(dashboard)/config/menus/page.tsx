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
  const [isSubMenuDialogOpen, setIsSubMenuDialogOpen] = useState(false);

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
      if (editingMenu.id) {
        await menuApi.updateMenu(editingMenu.id, editingMenu);
      } else {
        await menuApi.createMenu(editingMenu);
      }
      setIsMenuDialogOpen(false);
      setEditingMenu(null);
      fetchMenus();
    } catch (error) {
      console.error("Failed to save menu:", error);
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm("Are you sure you want to delete this menu and all its submenus?")) return;
    try {
      await menuApi.deleteMenu(id);
      fetchMenus();
    } catch (error) {
      console.error("Failed to delete menu:", error);
    }
  };

  const handleSaveSubMenu = async () => {
    if (!editingSubMenu?.title || !editingSubMenu?.url) return;
    
    try {
      if (editingSubMenu.id) {
        await menuApi.updateSubMenu(editingSubMenu.id, editingSubMenu);
      } else {
        await menuApi.createSubMenu({
          menuId: editingSubMenu.menuId!,
          title: editingSubMenu.title,
          url: editingSubMenu.url,
          order: editingSubMenu.order
        });
      }
      setIsSubMenuDialogOpen(false);
      setEditingSubMenu(null);
      fetchMenus();
    } catch (error) {
      console.error("Failed to save submenu:", error);
    }
  };

  const handleDeleteSubMenu = async (id: number) => {
    if (!confirm("Are you sure you want to delete this submenu?")) return;
    try {
      await menuApi.deleteSubMenu(id);
      fetchMenus();
    } catch (error) {
      console.error("Failed to delete submenu:", error);
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
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Title</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">URL Path</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-center">Submenus</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 pr-6">Actions</TableHead>
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
                    <TableRow 
                      className={cn(
                        "group cursor-pointer transition-all border-none",
                        expandedMenus[menu.id] ? "bg-zinc-50/80" : "hover:bg-zinc-50/40"
                      )}
                      onClick={() => toggleExpand(menu.id)}
                    >
                      <TableCell className="font-mono text-[10px] text-zinc-400 pl-6">
                        <div className="flex items-center gap-2">
                          <GripVertical className="size-3 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {menu.order}
                        </div>
                      </TableCell>
                      <TableCell>
                        {menu.items && menu.items.length > 0 && (
                          expandedMenus[menu.id] ? <ChevronDown className="size-4 text-primary" /> : <ChevronRight className="size-4 text-zinc-400" />
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-zinc-700">{menu.title}</TableCell>
                      <TableCell className="text-zinc-500 font-mono text-xs">{menu.url}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {menu.items?.length || 0}
                        </span>
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
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" onClick={() => {
                            setEditingSubMenu({ title: "", url: "", order: (menu.items?.length || 0) + 1, menuId: menu.id });
                            setIsSubMenuDialogOpen(true);
                          }}>
                            <PlusCircle className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => {
                            setEditingMenu(menu);
                            setIsMenuDialogOpen(true);
                          }}>
                            <Edit className="size-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDeleteMenu(menu.id)}>
                            <Trash2 className="size-4 text-destructive/70" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedMenus[menu.id] && menu.items?.map((sub) => (
                      <TableRow key={`sub-${sub.id}`} className="bg-zinc-50/20 border-none">
                        <TableCell className="font-mono text-[9px] text-zinc-300 pl-8">{sub.order}</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="pl-6 text-zinc-500 text-[13px]">
                           <span className="text-zinc-200 mr-2 font-light">└</span>
                           {sub.title}
                        </TableCell>
                        <TableCell className="text-zinc-400 font-mono text-[9px]">{sub.url}</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-7 hover:bg-primary/5 hover:text-primary" onClick={() => {
                              setEditingSubMenu(sub);
                              setIsSubMenuDialogOpen(true);
                            }}>
                              <Edit className="size-3 text-zinc-400" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-7 hover:bg-destructive/5 hover:text-destructive" onClick={() => handleDeleteSubMenu(sub.id)}>
                              <Trash2 className="size-3 text-destructive/30" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="h-4 border-none hover:bg-transparent"><TableCell colSpan={6}></TableCell></TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Menu Edit Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMenu?.id ? "Edit Main Menu" : "Create New Menu"}</DialogTitle>
            <DialogDescription>
              Adjust the core sidebar item. The URL should start with / (e.g. /orders).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Title</label>
              <Input 
                value={editingMenu?.title || ""} 
                onChange={(e) => setEditingMenu(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="e.g. Marketing"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL Path</label>
              <Input 
                value={editingMenu?.url || ""} 
                onChange={(e) => setEditingMenu(prev => ({ ...prev!, url: e.target.value }))}
                placeholder="e.g. /marketing"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Icon Name</label>
                <Input 
                  value={editingMenu?.icon || ""} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, icon: e.target.value }))}
                  placeholder="e.g. Activity"
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Order</label>
                <Input 
                  type="number"
                  value={editingMenu?.order || 0} 
                  onChange={(e) => setEditingMenu(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMenu} className="bg-primary text-white">Save Menu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SubMenu Edit Dialog */}
      <Dialog open={isSubMenuDialogOpen} onOpenChange={setIsSubMenuDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubMenu?.id ? "Edit Submenu" : "Add New Submenu"}</DialogTitle>
            <DialogDescription>
              Create a sub-item under the selected main menu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Title</label>
              <Input 
                value={editingSubMenu?.title || ""} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, title: e.target.value }))}
                placeholder="e.g. Campaigns"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">URL Path</label>
              <Input 
                value={editingSubMenu?.url || ""} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, url: e.target.value }))}
                placeholder="e.g. /marketing/campaigns"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Display Order</label>
              <Input 
                type="number"
                value={editingSubMenu?.order || 0} 
                onChange={(e) => setEditingSubMenu(prev => ({ ...prev!, order: parseInt(e.target.value) }))}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubMenuDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSubMenu} className="bg-primary text-white">Save Submenu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
