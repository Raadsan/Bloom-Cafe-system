"use client";

import { useCallback, useEffect, useState } from "react";
import { systemSettingsApi, SystemSettings } from "@/lib/api/systemSettingsApi";

const DEFAULTS: SystemSettings = {
  id: 1,
  systemName: "Restaurant",
  systemTagline: "Management System",
  systemLogoUrl: null,
};

export function useSystemBranding() {
  const [branding, setBranding] = useState<SystemSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await systemSettingsApi.getSettings();
      setBranding(data);
    } catch {
      setBranding(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const onUpdate = () => {
      refresh();
    };

    window.addEventListener("system_branding_updated", onUpdate);
    return () => window.removeEventListener("system_branding_updated", onUpdate);
  }, [refresh]);

  return { branding, loading, refresh };
}
