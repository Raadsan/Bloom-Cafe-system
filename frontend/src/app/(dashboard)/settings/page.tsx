import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashboardPageClass,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
} from "@/lib/dashboard-ui";

export default function SettingsPage() {
  return (
    <div className={`${dashboardPageClass} space-y-6`}>
      <div className="px-4">
        <h1 className={pageHeaderTitleClass}>System Settings</h1>
        <p className={pageHeaderSubtitleClass}>Configure your restaurant system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your business details and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Settings panel coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
