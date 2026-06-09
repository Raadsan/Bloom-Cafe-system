"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, AlertTriangle, CheckCircle, Clock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notificationApi, Notification } from "@/lib/api/notificationApi";
import { onDebouncedEvent, REFRESH_NOTIFICATIONS } from "@/lib/live-updates";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderSubtitleClass,
} from "@/lib/dashboard-ui";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationApi.getMyNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();

    const removeListener = onDebouncedEvent(REFRESH_NOTIFICATIONS, () => {
      fetchNotifications();
    }, 800);

    return () => removeListener();
  }, []);

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ready") || t.includes("success")) return <CheckCircle className="size-5 text-green-500" />;
    if (t.includes("order") || t.includes("new")) return <Bell className="size-5 text-blue-500" />;
    if (t.includes("warning") || t.includes("alert")) return <AlertTriangle className="size-5 text-orange-500" />;
    return <Info className="size-5 text-primary" />;
  };

  return (
    <div className={`${dashboardPageClass} space-y-6 w-full`} style={dashboardPageStyle}>
      <div className="flex items-center justify-between border-b border-border pb-4 px-4">
        <div>
          <h1 className={pageHeaderTitleClass}>Notifications</h1>
          <p className={pageHeaderSubtitleClass}>View alerts and system messages for your restaurant.</p>
        </div>
        <Button variant="outline" size="sm" className="font-bold uppercase tracking-widest text-[10px]">
          MARK ALL AS READ
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/20 border-border rounded-xl" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Card key={n.id} className={`border-border shadow-sm hover:border-primary/30 transition-all rounded-xl overflow-hidden group ${n.isRead ? 'opacity-60' : ''}`}>
              <CardContent className="p-0 flex items-stretch">
                <div className={`w-1 group-hover:w-2 transition-all ${
                  n.title.toLowerCase().includes('warning') ? 'bg-orange-500' : 
                  n.title.toLowerCase().includes('success') ? 'bg-green-500' : 
                  n.title.toLowerCase().includes('order') ? 'bg-blue-500' : 'bg-primary'
                }`} />
                <div className="flex-1 p-5 flex gap-4 items-start">
                  <div className="p-2.5 rounded-xl bg-muted shrink-0">
                    {getIcon(n.title)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm uppercase tracking-tight">{n.title}</h3>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                  </div>
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                      DISMISS
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center flex flex-col items-center">
            <Inbox className="size-12 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest">All caught up!</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase">No new notifications at the moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
