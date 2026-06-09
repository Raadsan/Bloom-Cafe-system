"use client";

import React, { useEffect, useState } from "react";
import { authApi, AuthUser } from "@/lib/api/authApi";
import { reportApi } from "@/lib/api/reportApi";
import { orderApi, Order } from "@/lib/api/orderApi";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import WaiterDashboard from "@/components/dashboard/WaiterDashboard";
import KitchenDashboard from "@/components/dashboard/KitchenDashboard";

interface DashboardData {
  totalOrders: number;
  totalCustomers: number;
  totalTables: number;
  totalPaidPayments: number;
  totalPendingPayments: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // 1. Fetch user first to determine role
        const currentUser = await authApi.getMe();
        setUser(currentUser);
        
        const role = currentUser?.role?.toLowerCase() || 'admin';
        const isAdminOrManager = role === 'admin' || role === 'manager';
        const isWaiter = role === 'waiter';

        // 2. Conditionally fetch data based on role to avoid 403 Forbidden errors
        const promises: Promise<any>[] = [
          orderApi.getAllOrders(isWaiter ? { onlyMine: true } : undefined),
        ];
        
        if (isAdminOrManager) {
          promises.push(reportApi.getDashboardSummary());
        } else {
          promises.push(Promise.resolve({ data: null })); // mock for non-admins
        }

        const [ordersRes, summaryRes] = await Promise.all(promises);
        
        setOrders(ordersRes);
        if (isAdminOrManager) {
          setData(summaryRes.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-muted/20 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-32 bg-muted/20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[400px] bg-muted/20 rounded-xl" />
          <div className="h-[400px] bg-muted/20 rounded-xl" />
        </div>
      </div>
    );
  }

  // Render dashboard based on user role
  const role = user?.role?.toLowerCase() || 'admin';
  const recentOrders = orders.slice(0, 5); // Default recent orders for admin

  if (role === 'waiter') {
    return <WaiterDashboard orders={orders} />;
  }
  
  if (role === 'kitchen') {
    return <KitchenDashboard orders={orders} />;
  }

  // Default to Admin/Manager Dashboard
  return <AdminDashboard data={data} recentOrders={recentOrders} />;
}
