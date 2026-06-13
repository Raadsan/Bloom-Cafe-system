"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Percent,
  Megaphone,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { usePermissions } from "@/context/PermissionContext";
import {
  discountAdvertisementApi,
  CampaignType,
  DiscountAdvertisement,
} from "@/lib/api/discountAdvertisementApi";
import { menuItemApi, MenuItem } from "@/lib/api/menuItemApi";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  actionBtnEdit,
  actionBtnDelete,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardStatusBadgeClass,
  btnCreatePage,
} from "@/lib/dashboard-ui";

const formLabelClass = "text-xs font-medium text-[#1e293b] dark:text-zinc-200";
const formInputClass =
  "w-full px-3 py-2 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 text-sm font-medium dark:text-white placeholder:text-zinc-400";

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export default function DiscountAdvertisementsPage() {
  const { showToast } = useToast();
  const { canAdd: checkAdd, canEdit: checkEdit, canDelete: checkDelete } = usePermissions();
  const canAdd = checkAdd("/discount-advertisements");
  const canEdit = checkEdit("/discount-advertisements");
  const canDelete = checkDelete("/discount-advertisements");

  const [campaigns, setCampaigns] = useState<DiscountAdvertisement[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | CampaignType>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DiscountAdvertisement | null>(null);

  const [formType, setFormType] = useState<CampaignType>("advertisement");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formPercent, setFormPercent] = useState("20");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignData, productData] = await Promise.all([
        discountAdvertisementApi.getAll(),
        menuItemApi.getAllMenuItems(),
      ]);
      setCampaigns(campaignData || []);
      setMenuItems(productData || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load promotions", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const haystack = `${item.title || ""} ${item.description || ""} ${item.type}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [campaigns, search, typeFilter]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((item) =>
      `${item.name} ${item.category?.name || ""}`.toLowerCase().includes(q)
    );
  }, [menuItems, productSearch]);

  const resetForm = () => {
    setFormType("advertisement");
    setFormTitle("");
    setFormDescription("");
    setFormImage("");
    setFormUrl("");
    setFormPercent("20");
    setFormStartAt("");
    setFormEndAt("");
    setFormActive(true);
    setSelectedProductIds([]);
    setProductSearch("");
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item: DiscountAdvertisement) => {
    setSelected(item);
    setFormType(item.type);
    setFormTitle(item.title || "");
    setFormDescription(item.description || "");
    setFormImage(item.imageUrl || "");
    setFormUrl(item.url || "");
    setFormPercent(String(item.discountPercent ?? 20));
    setFormStartAt(toLocalInputValue(item.startAt));
    setFormEndAt(toLocalInputValue(item.endAt));
    setFormActive(item.isActive);
    setSelectedProductIds(item.products?.map((p) => p.menuItemId) || []);
    setProductSearch("");
    setIsFormOpen(true);
  };

  const openDelete = (item: DiscountAdvertisement) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      showToast("Only PNG images are allowed", "error");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size should be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setFormImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (formType === "advertisement" && !formTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (formType === "advertisement" && !formImage) {
      showToast("PNG image is required", "error");
      return;
    }
    if (formType === "discount") {
      const pct = Number(formPercent);
      if (!pct || pct <= 0 || pct > 100) {
        showToast("Discount percentage must be between 1 and 100", "error");
        return;
      }
      if (!formStartAt || !formEndAt) {
        showToast("Start and end time are required", "error");
        return;
      }
      if (selectedProductIds.length === 0) {
        showToast("Select at least one product", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        type: formType,
        title: formTitle.trim() || undefined,
        description: formDescription.trim() || undefined,
        imageUrl: formType === "advertisement" ? formImage : undefined,
        url: formType === "advertisement" ? formUrl.trim() || undefined : undefined,
        discountPercent: formType === "discount" ? Number(formPercent) : undefined,
        startAt: formType === "discount" ? new Date(formStartAt).toISOString() : undefined,
        endAt: formType === "discount" ? new Date(formEndAt).toISOString() : undefined,
        isActive: formActive,
        menuItemIds: formType === "discount" ? selectedProductIds : undefined,
      };

      if (selected) {
        await discountAdvertisementApi.update(selected.id, payload);
        showToast("Campaign updated successfully", "success");
      } else {
        await discountAdvertisementApi.create(payload);
        showToast("Campaign created successfully", "success");
      }

      setIsFormOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save campaign";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await discountAdvertisementApi.delete(selected.id);
      showToast("Campaign deleted successfully", "success");
      setIsDeleteOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete campaign";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      <div className="mb-8 px-4 flex items-start justify-between gap-4">
        <div>
          <h1 className={pageHeaderTitleClass}>Promotions</h1>
          <p className={pageHeaderSubtitleClass}>
            Manage flash sale discounts and homepage advertisement banners
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canAdd && (
            <Button className={btnCreatePage} onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Campaign
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search campaigns..."
          className={`${formInputClass} max-w-xs`}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | CampaignType)}
          className={`${formInputClass} max-w-[180px]`}
        >
          <option value="all">All types</option>
          <option value="advertisement">Advertisement</option>
          <option value="discount">Discount</option>
        </select>
      </div>

      <div className="px-4">
        <div className="rounded-xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden">
          <Table>
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                <TableHead className={dashboardTableHeadClass}>Type</TableHead>
                <TableHead className={dashboardTableHeadClass}>Title</TableHead>
                <TableHead className={dashboardTableHeadClass}>Details</TableHead>
                <TableHead className={dashboardTableHeadClass}>Schedule</TableHead>
                <TableHead className={dashboardTableHeadClass}>Status</TableHead>
                <TableHead className={dashboardTableHeadClass}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="inline-flex items-center gap-1 capitalize">
                        {item.type === "discount" ? (
                          <Percent className="w-4 h-4" />
                        ) : (
                          <Megaphone className="w-4 h-4" />
                        )}
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      {item.title || "-"}
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      {item.type === "discount" ? (
                        <span>
                          {item.discountPercent}% off • {item.products?.length || 0} products
                        </span>
                      ) : (
                        <span className="line-clamp-2">{item.description || "-"}</span>
                      )}
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <div className="text-xs">
                        <div>Start: {formatDate(item.startAt)}</div>
                        <div>End: {formatDate(item.endAt)}</div>
                      </div>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span
                        className={`${dashboardStatusBadgeClass} ${
                          item.isCurrentlyActive
                            ? "bg-emerald-100 text-emerald-700"
                            : item.isActive
                              ? "bg-amber-100 text-amber-700"
                              : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {item.isCurrentlyActive
                          ? "Live"
                          : item.isActive
                            ? "Scheduled/Inactive"
                            : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={actionBtnEdit}
                            onClick={() => openEdit(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className={actionBtnDelete}
                            onClick={() => openDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{selected ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
          <DialogDescription>
            Choose type first. Discount applies percentage off selected products for a time range.
            Advertisement shows a PNG banner on the mobile homepage.
          </DialogDescription>

          <div className="space-y-4 py-2">
            <div>
              <label className={formLabelClass}>Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as CampaignType)}
                className={formInputClass}
                disabled={!!selected}
              >
                <option value="advertisement">Advertisement</option>
                <option value="discount">Discount (Flash Sale)</option>
              </select>
            </div>

            <div>
              <label className={formLabelClass}>Title</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className={formInputClass}
                placeholder={formType === "advertisement" ? "Fresh & Hot" : "Summer Flash Sale"}
              />
            </div>

            <div>
              <label className={formLabelClass}>Description</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className={`${formInputClass} min-h-[80px]`}
                placeholder="Order your favorites today"
              />
            </div>

            {formType === "advertisement" && (
              <>
                <div>
                  <label className={formLabelClass}>Banner Image (PNG only)</label>
                  <input type="file" accept="image/png" onChange={handleImageUpload} />
                  {formImage && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-[#2a2a2a]">
                      <img src={formImage} alt="Preview" className="w-full max-h-48 object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className={formLabelClass}>URL (optional website link)</label>
                  <input
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={formInputClass}
                    placeholder="https://example.com/shop"
                  />
                </div>
              </>
            )}

            {formType === "discount" && (
              <>
                <div>
                  <label className={formLabelClass}>Discount Percentage (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formPercent}
                    onChange={(e) => setFormPercent(e.target.value)}
                    className={formInputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className={formLabelClass}>Start Time</label>
                    <input
                      type="datetime-local"
                      value={formStartAt}
                      onChange={(e) => setFormStartAt(e.target.value)}
                      className={formInputClass}
                    />
                  </div>
                  <div>
                    <label className={formLabelClass}>End Time</label>
                    <input
                      type="datetime-local"
                      value={formEndAt}
                      onChange={(e) => setFormEndAt(e.target.value)}
                      className={formInputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className={formLabelClass}>Select Products</label>
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className={`${formInputClass} mb-3`}
                    placeholder="Search products..."
                  />
                  <div className="max-h-56 overflow-y-auto border border-zinc-200 dark:border-[#2a2a2a] rounded-lg divide-y divide-zinc-100 dark:divide-[#2a2a2a]">
                    {filteredProducts.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#1a1a1a]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{product.name}</div>
                          <div className="text-xs text-zinc-500">
                            ${product.price.toFixed(2)}
                            {product.category?.name ? ` • ${product.category.name}` : ""}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    Selected: {selectedProductIds.length} product(s)
                  </p>
                </div>
              </>
            )}

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : selected ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogTitle>Delete Campaign</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{selected?.title || selected?.type}&quot;?
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
