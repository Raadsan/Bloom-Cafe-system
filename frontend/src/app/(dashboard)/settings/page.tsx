"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import LogoUploadField from "@/components/receipt/LogoUploadField";
import { systemSettingsApi } from "@/lib/api/systemSettingsApi";
import { usePermissions } from "@/context/PermissionContext";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
  pageHeaderWrapperClass,
  btnCreatePage,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full px-3 py-2.5 bg-white dark:bg-[#161616] border border-zinc-200 dark:border-[#2a2a2a] rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm font-medium dark:text-white";

export default function SettingsPage() {
  const router = useRouter();
  const { isAdmin, loading: permLoading } = usePermissions();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemName, setSystemName] = useState("Restaurant");
  const [systemTagline, setSystemTagline] = useState("Management System");
  const [systemLogoUrl, setSystemLogoUrl] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await systemSettingsApi.getSettings();
      setSystemName(data.systemName || "Restaurant");
      setSystemTagline(data.systemTagline || "Management System");
      setSystemLogoUrl(data.systemLogoUrl || "");
    } catch {
      showToast("Failed to load system settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, permLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      load();
    }
  }, [isAdmin]);

  const handleSave = async () => {
    if (!systemName.trim()) {
      showToast("System name is required", "error");
      return;
    }
    setSaving(true);
    try {
      await systemSettingsApi.updateSettings({
        systemName: systemName.trim(),
        systemTagline: systemTagline.trim(),
        systemLogoUrl: systemLogoUrl || null,
      });
      window.dispatchEvent(new Event("system_branding_updated"));
      showToast("System branding saved — sidebar logo updated", "success");
    } catch {
      showToast("Failed to save system settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (permLoading || !isAdmin) {
    return null;
  }

  return (
    <div className={cn(dashboardPageClass, "pb-8")} style={dashboardPageStyle}>
      <div className={cn(pageHeaderWrapperClass, "flex flex-col sm:flex-row sm:items-end justify-between gap-4")}>
        <div>
          <h1 className={pageHeaderTitleClass}>System settings</h1>
          <p className={pageHeaderSubtitleClass}>
            Upload your restaurant logo for the sidebar and POS header.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className={btnCreatePage}>
          {saving ? <Loader2 className="animate-spin size-4" /> : <Save className="size-4" />}
          Save branding
        </Button>
      </div>

      {loading ? (
        <div className="px-4 h-48 trezo-card animate-pulse" />
      ) : (
        <div className="px-4 max-w-2xl">
          <div className="trezo-card p-5 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">System logo</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Shown in sidebar & POS header
                </p>
              </div>
            </div>

            <LogoUploadField
              value={systemLogoUrl}
              onChange={setSystemLogoUrl}
              onError={(msg) => showToast(msg, "error")}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">System name</label>
              <input
                type="text"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                placeholder="Restaurant"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tagline</label>
              <input
                type="text"
                value={systemTagline}
                onChange={(e) => setSystemTagline(e.target.value)}
                placeholder="Management System"
                className={fieldClass}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
