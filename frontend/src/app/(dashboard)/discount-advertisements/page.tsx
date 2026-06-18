"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Megaphone,
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
  DiscountAdvertisement,
} from "@/lib/api/discountAdvertisementApi";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<DiscountAdvertisement | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formActive, setFormActive] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const campaignData = await discountAdvertisementApi.getAll();
      setCampaigns(campaignData || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load advertisements", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((item) => {
      const haystack = `${item.title || ""} ${item.description || ""}`.toLowerCase();
      return !search || haystack.includes(search.toLowerCase());
    });
  }, [campaigns, search]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormImage("");
    setFormUrl("");
    setFormStartAt("");
    setFormEndAt("");
    setFormActive(true);
  };

  const openCreate = () => {
    setSelected(null);
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (item: DiscountAdvertisement) => {
    setSelected(item);
    setFormTitle(item.title || "");
    setFormDescription(item.description || "");
    setFormImage(item.imageUrl || "");
    setFormUrl(item.url || "");
    setFormStartAt(toLocalInputValue(item.startAt));
    setFormEndAt(toLocalInputValue(item.endAt));
    setFormActive(item.isActive);
    setIsFormOpen(true);
  };

  const openDelete = (item: DiscountAdvertisement) => {
    setSelected(item);
    setIsDeleteOpen(true);
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
    if (!formTitle.trim()) {
      showToast("Title is required", "error");
      return;
    }
    if (!formImage) {
      showToast("PNG image is required", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: "advertisement" as const,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        imageUrl: formImage,
        url: formUrl.trim() || undefined,
        startAt: formStartAt ? new Date(formStartAt).toISOString() : undefined,
        endAt: formEndAt ? new Date(formEndAt).toISOString() : undefined,
        isActive: formActive,
      };

      if (selected) {
        await discountAdvertisementApi.update(selected.id, payload);
        showToast("Advertisement updated successfully", "success");
      } else {
        await discountAdvertisementApi.create(payload);
        showToast("Advertisement created successfully", "success");
      }

      setIsFormOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to save advertisement";
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
      showToast("Advertisement deleted successfully", "success");
      setIsDeleteOpen(false);
      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to delete advertisement";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={dashboardPageClass} style={dashboardPageStyle}>
      <div className="mb-8 px-4 flex items-start justify-between gap-4">
        <div>
          <h1 className={pageHeaderTitleClass}>Advertisements</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canAdd && (
            <Button className={btnCreatePage} onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Advertisement
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search advertisements..."
          className={`${formInputClass} max-w-xs`}
        />
      </div>

      <div className="px-4">
        <div className="rounded-xl border border-zinc-200 dark:border-[#2a2a2a] overflow-hidden">
          <Table>
            <TableHeader className={dashboardTableHeaderClass}>
              <TableRow className={dashboardTableHeadRowClass}>
                <TableHead className={dashboardTableHeadClass}>Title</TableHead>
                <TableHead className={dashboardTableHeadClass}>Description</TableHead>
                <TableHead className={dashboardTableHeadClass}>Schedule</TableHead>
                <TableHead className={dashboardTableHeadClass}>Status</TableHead>
                <TableHead className={dashboardTableHeadClass}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No advertisements found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className={dashboardTableBodyRowClass}>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="inline-flex items-center gap-2">
                        <Megaphone className="w-4 h-4" />
                        {item.title || "-"}
                      </span>
                    </TableCell>
                    <TableCell className={dashboardTableCellClass}>
                      <span className="line-clamp-2">{item.description || "-"}</span>
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
          <DialogTitle>{selected ? "Edit Advertisement" : "Create Advertisement"}</DialogTitle>
          <DialogDescription>
            Upload a PNG banner for the mobile app homepage. Product discounts are managed from Menu Items.
          </DialogDescription>

          <div className="space-y-4 py-2">
            <div>
              <label className={formLabelClass}>Title</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className={formInputClass}
                placeholder="Fresh & Hot"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={formLabelClass}>Start Time (optional)</label>
                <input
                  type="datetime-local"
                  value={formStartAt}
                  onChange={(e) => setFormStartAt(e.target.value)}
                  className={formInputClass}
                />
              </div>
              <div>
                <label className={formLabelClass}>End Time (optional)</label>
                <input
                  type="datetime-local"
                  value={formEndAt}
                  onChange={(e) => setFormEndAt(e.target.value)}
                  className={formInputClass}
                />
              </div>
            </div>

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
          <DialogTitle>Delete Advertisement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{selected?.title}&quot;?
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
