import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your restaurant system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your business details and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center border-t border-border">
          <p className="text-muted-foreground">Settings form coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
