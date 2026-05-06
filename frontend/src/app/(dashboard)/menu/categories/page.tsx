"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LayoutGrid, Search, MoreVertical, Edit2, Trash2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryApi, Category } from "@/lib/api/categoryApi";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAllCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">MENU CATEGORIES</h1>
          <div className="h-1 w-20 bg-primary mt-2"></div>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" />
          NEW CATEGORY
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-40 animate-pulse bg-muted/20 border-border" />
          ))
        ) : categories.length > 0 ? (
          categories.map((cat) => (
            <Card key={cat.id} className="group overflow-hidden border-border shadow-sm hover:shadow-md transition-all rounded-xl border-t-4 border-t-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="text-3xl">📂</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                <h3 className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors truncate">{cat.name}</h3>
                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest">
                  {cat.description || "No description"}
                </p>
                
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest gap-2">
                    <Edit2 className="size-3" />
                    EDIT
                  </Button>
                  <Button variant="ghost" className="flex-1 h-9 text-[10px] font-bold uppercase tracking-widest gap-2 text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-3" />
                    DELETE
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <FolderOpen className="size-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">No categories found</p>
            <Button variant="link" className="mt-2 text-primary">Create your first category</Button>
          </div>
        )}
      </div>
    </div>
  );
}
