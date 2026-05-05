import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Clock, User, MessageSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function TrackingPage() {
  const logs = [
    { id: 1, user: "Ahmed", action: "Updated Menu", target: "Burger Supreme", time: "2 mins ago" },
    { id: 2, user: "Fartun", action: "Deleted Order", target: "#ORD-992", time: "15 mins ago" },
    { id: 3, user: "Admin", action: "Changed Roles", target: "Manager Permissions", time: "1 hour ago" },
    { id: 4, user: "Ali", action: "Added Item", target: "Ice Cream", time: "3 hours ago" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">SYSTEM ACTIVITY TRACKING</h1>
          <div className="h-1 w-20 bg-primary mt-2"></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Actions", value: "1,284", icon: Activity, color: "text-blue-500" },
          { label: "Active Users", value: "12", icon: User, color: "text-green-500" },
          { label: "Security Alerts", value: "0", icon: Clock, color: "text-orange-500" },
          { label: "System Messages", value: "45", icon: MessageSquare, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-md border border-border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-2 rounded-full bg-muted ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-md border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight uppercase">Audit Logs</CardTitle>
          <CardDescription>Real-time tracking of all critical system changes and user actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold tracking-widest uppercase">User</TableHead>
                <TableHead className="font-bold tracking-widest uppercase">Action</TableHead>
                <TableHead className="font-bold tracking-widest uppercase">Target</TableHead>
                <TableHead className="font-bold tracking-widest uppercase">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{log.user}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.target}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{log.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
