"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Plus, Search, Filter, MoreVertical, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import { usePermissions } from "@/context/PermissionContext";

export default function MenuItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { canAdd: checkAdd } = usePermissions();
  const canAdd = checkAdd("/menu/items");

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await menuItemApi.getAllMenuItems();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch menu items", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">MENU ITEMS</h1>
          <div className="h-1 w-20 bg-primary mt-2"></div>
        </div>
        {canAdd && (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            ADD MENU ITEM
          </Button>
        )}
      </div>

      <Card className="rounded-md border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight uppercase">Product List</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Search menu..." className="w-full pl-9 pr-4 py-1.5 text-xs bg-muted/50 rounded-md focus:outline-none border border-border/50" />
            </div>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="size-3 mr-2" />
              FILTER
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold tracking-widest uppercase text-[10px]">Item Name</TableHead>
                <TableHead className="font-bold tracking-widest uppercase text-[10px]">Category</TableHead>
                <TableHead className="font-bold tracking-widest uppercase text-[10px] text-right">Price</TableHead>
                <TableHead className="font-bold tracking-widest uppercase text-[10px] text-center">Status</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-12 animate-pulse bg-muted/10">
                    <TableCell colSpan={5} />
                  </TableRow>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground text-[10px] font-black uppercase tracking-tighter">
                      {item.category?.name || "Uncategorized"}
                    </TableCell>
                    <TableCell className="text-right font-black text-primary">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.isAvailable ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                      }`}>
                        {item.isAvailable ? "Available" : "Sold Out"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <PackageSearch className="size-10 text-muted-foreground/20 mb-2" />
                       <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">No menu items found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
