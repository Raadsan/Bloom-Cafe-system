"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  Search,
  RefreshCw,
  Filter,
  Wallet,
  Receipt,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Percent,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { reportApi } from "@/lib/api/restaurant/reportApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatPaymentMethod } from "@/lib/format-payment-method";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
  dashboardStatIconClass,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableIdClass,
  chartPrimary,
  chartPrimaryVariants,
  chartTooltipStyle,
  chartAxisTick,
} from "@/lib/dashboard-ui";

const EMPTY_WEEKLY = [
  { name: "Mon", revenue: 0, orders: 0 },
  { name: "Tue", revenue: 0, orders: 0 },
  { name: "Wed", revenue: 0, orders: 0 },
  { name: "Thu", revenue: 0, orders: 0 },
  { name: "Fri", revenue: 0, orders: 0 },
  { name: "Sat", revenue: 0, orders: 0 },
  { name: "Sun", revenue: 0, orders: 0 },
];

function formatLabel(value: string) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface FinanceItem {
  id: number;
  orderId: number;
  name: string;
  quantity: number;
  costPrice?: number;
  sellingPrice?: number;
  totalCost?: number;
  totalSelling?: number;
  vat?: number;
  profit: number;
  date: string;
  paymentMethod?: string;
  providerName?: string | null;
}

interface FinanceReportData {
  totalRevenue: number;
  totalVat?: number;
  netRevenue?: number;
  totalCost: number;
  netProfit: number;
  averageTransaction: number;
  transactionCount: number;
  breakdownByMethod?: Record<string, number>;
  breakdownBySource?: Record<string, number>;
  items?: FinanceItem[];
}

export default function FinanceReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinanceReportData | null>(null);
  const [weeklyData, setWeeklyData] = useState(EMPTY_WEEKLY);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const { showToast } = useToast();

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const [financeRes, weeklyRes] = await Promise.all([
        reportApi.getFinanceReport(dateRange),
        reportApi.getWeeklyAnalytics(),
      ]);
      if (financeRes.success) {
        setData(financeRes.data);
      } else {
        setData(null);
      }
      if (weeklyRes.success && Array.isArray(weeklyRes.data)) {
        setWeeklyData(weeklyRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch finance report:", error);
      showToast("Error loading finance data", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange.endDate, dateRange.startDate, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount || 0);

  // Group breakdown by unique formatted method label to prevent duplicate chart keys
  const methodChartData = useMemo(() => {
    if (!data?.breakdownByMethod) return [];
    const aggregated: Record<string, number> = {};
    Object.entries(data.breakdownByMethod).forEach(([rawName, value]) => {
      const label = formatPaymentMethod(rawName);
      aggregated[label] = (aggregated[label] || 0) + Number(value || 0);
    });
    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data?.breakdownByMethod]);

  // Group breakdown by unique formatted source label
  const sourceChartData = useMemo(() => {
    if (!data?.breakdownBySource) return [];
    const aggregated: Record<string, number> = {};
    Object.entries(data.breakdownBySource).forEach(([rawName, value]) => {
      const label = formatLabel(rawName);
      aggregated[label] = (aggregated[label] || 0) + Number(value || 0);
    });
    return Object.entries(aggregated).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data?.breakdownBySource]);

  // Unique list of payment methods for the filter dropdown
  const paymentMethodOptions = useMemo(() => {
    if (!data?.items) return [];
    const methods = new Set<string>();
    data.items.forEach((item) => {
      const label = formatPaymentMethod(item.paymentMethod, item.providerName);
      if (label && label !== "—") methods.add(label);
    });
    return Array.from(methods);
  }, [data?.items]);

  // Filtered transactions
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];
    const q = search.toLowerCase().trim();
    return data.items.filter((item) => {
      const method = formatPaymentMethod(item.paymentMethod, item.providerName);
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.orderId.toString().includes(q) ||
        method.toLowerCase().includes(q);

      const matchesMethod =
        selectedMethod === "all" || method.toLowerCase() === selectedMethod.toLowerCase();

      return matchesSearch && matchesMethod;
    });
  }, [data?.items, search, selectedMethod]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedMethod, pageSize]);

  const startRecord = filteredItems.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, filteredItems.length);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredItems.length) {
      showToast("No data to export", "error");
      return;
    }
    const headers = [
      "Item Name",
      "Order ID",
      "Date",
      "Quantity",
      "Cost Price",
      "Selling Price",
      "VAT",
      "Net Profit",
      "Payment Method",
    ];

    const rows = filteredItems.map((item) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.orderId,
      new Date(item.date).toLocaleDateString(),
      item.quantity,
      (item.costPrice ?? 0).toFixed(2),
      (item.sellingPrice ?? 0).toFixed(2),
      (item.vat ?? 0).toFixed(2),
      item.profit.toFixed(2),
      `"${formatPaymentMethod(item.paymentMethod, item.providerName)}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `finance-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV report exported successfully", "success");
  };

  // Export / Print PDF
  const handleExportPdf = () => {
    if (!filteredItems.length) {
      showToast("No data to export", "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups for this site.", "error");
      return;
    }

    const rowsHtml = filteredItems
      .map(
        (item) => `
        <tr>
          <td><strong>${item.name}</strong><br><small style="color:#64748b;">x${item.quantity} · ${new Date(item.date).toLocaleDateString()}</small></td>
          <td>#${item.orderId}</td>
          <td><span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#f1f5f9;font-size:11px;font-weight:bold;">${formatPaymentMethod(item.paymentMethod, item.providerName)}</span></td>
          <td style="text-align:right;">${formatCurrency(item.costPrice ?? 0)}</td>
          <td style="text-align:right;">${formatCurrency(item.sellingPrice ?? 0)}</td>
          <td style="text-align:right;color:#64748b;">${formatCurrency(item.vat ?? 0)}</td>
          <td style="text-align:right;font-weight:bold;color:${item.profit >= 0 ? "#10b981" : "#ef4444"};">
            ${item.profit >= 0 ? "+" : ""}${formatCurrency(item.profit)}
          </td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Finance Report (${dateRange.startDate} to ${dateRange.endDate})</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .brand h1 { margin: 0; font-size: 22px; color: #5b1017; font-weight: 800; letter-spacing: -0.5px; }
            .brand p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
            .meta { text-align: right; }
            .meta p { margin: 2px 0; font-size: 11px; color: #475569; }
            .kpis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 24px; }
            .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
            .kpi-title { font-size: 9px; text-transform: uppercase; font-weight: bold; color: #64748b; letter-spacing: 0.5px; }
            .kpi-value { font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
            td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
            .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>BLOOM CAFE</h1>
              <p>Financial & Revenue Statement Report</p>
            </div>
            <div class="meta">
              <p><strong>Period:</strong> ${dateRange.startDate} to ${dateRange.endDate}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total Transactions:</strong> ${filteredItems.length}</p>
            </div>
          </div>

          <div class="kpis">
            <div class="kpi-card">
              <div class="kpi-title">Total Revenue</div>
              <div class="kpi-value">${formatCurrency(data?.totalRevenue ?? 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">VAT Collected</div>
              <div class="kpi-value" style="color: #6366f1;">${formatCurrency(data?.totalVat ?? 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Net Profit</div>
              <div class="kpi-value" style="color: #059669;">${formatCurrency(data?.netProfit ?? 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Cost</div>
              <div class="kpi-value" style="color: #d97706;">${formatCurrency(data?.totalCost ?? 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Avg Order Value</div>
              <div class="kpi-value">${formatCurrency(data?.averageTransaction ?? 0)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Transactions</div>
              <div class="kpi-value">${data?.transactionCount ?? 0}</div>
            </div>
          </div>

          <h3 style="font-size: 13px; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">Transaction Details (${filteredItems.length} records)</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Order #</th>
                <th>Payment</th>
                <th style="text-align:right;">Cost Price</th>
                <th style="text-align:right;">Selling Price</th>
                <th style="text-align:right;">VAT</th>
                <th style="text-align:right;">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <span>Bloom Cafe Management System</span>
            <span>Page 1 of 1</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statCards = [
    { title: "Total Revenue", value: formatCurrency(data?.totalRevenue ?? 0), icon: DollarSign },
    { title: "VAT Collected", value: formatCurrency(data?.totalVat ?? 0), icon: Percent },
    { title: "Net Profit", value: formatCurrency(data?.netProfit ?? 0), icon: TrendingUp },
    { title: "Total Cost", value: formatCurrency(data?.totalCost ?? 0), icon: Wallet },
    {
      title: "Avg Order Value",
      value: formatCurrency(data?.averageTransaction ?? 0),
      icon: Receipt,
    },
    { title: "Transactions", value: data?.transactionCount ?? 0, icon: CreditCard },
  ];

  return (
    <div
      className={cn(dashboardPageClass, "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700")}
      style={dashboardPageStyle}
    >
      <div className={cn(pageHeaderWrapperClass, "flex flex-col md:flex-row md:items-end justify-between gap-4")}>
        <div>
          <h1 className={pageHeaderTitleClass}>Finance Report</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 trezo-card p-2">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="text-xs font-semibold bg-transparent outline-none border-none cursor-pointer text-foreground"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="text-xs font-semibold bg-transparent outline-none border-none cursor-pointer text-foreground"
            />
          </div>
          <Button
            type="button"
            onClick={fetchReport}
            disabled={loading}
            className="bg-primary !text-white hover:bg-primary/90 h-9 px-4 rounded-lg text-xs font-bold gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            {loading ? "Updating..." : "Apply"}
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="trezo-card h-28 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 px-4">
            {statCards.map((stat, i) => (
              <div
                key={stat.title}
                className="trezo-card p-5 flex flex-col justify-between group hover:border-primary/30 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className={dashboardStatIconClass(i)}>
                    <stat.icon className="size-4 text-white" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    {stat.title}
                  </p>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-1">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4">
            {/* Revenue Trends */}
            <div className="trezo-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Revenue Trends
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Weekly revenue
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Revenue
                  </span>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="financeRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={chartPrimary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={chartAxisTick} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={chartAxisTick}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: "#ffffff" }}
                      formatter={(v) => formatCurrency(Number(v ?? 0))}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={chartPrimary}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#financeRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="trezo-card p-6">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Payment Methods
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Revenue by method
                </p>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {methodChartData.map((_, index) => (
                        <Cell
                          key={`method-cell-${index}`}
                          fill={chartPrimaryVariants[index % chartPrimaryVariants.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: "#ffffff" }}
                      formatter={(v) => formatCurrency(Number(v ?? 0))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2 max-h-[110px] overflow-y-auto pr-1">
                {methodChartData.map((entry, index) => (
                  <div
                    key={`method-legend-${entry.name}-${index}`}
                    className="flex items-center justify-between text-[10px] font-bold uppercase"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: chartPrimaryVariants[index % chartPrimaryVariants.length],
                        }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="text-foreground tabular-nums">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Revenue */}
            <div className="trezo-card p-6">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Channel Revenue
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Performance by source
                </p>
              </div>
              <div className="h-[180px] w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.5}
                    />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={chartAxisTick} dy={10} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(91, 16, 23, 0.06)" }}
                      contentStyle={chartTooltipStyle}
                      itemStyle={{ color: "#ffffff" }}
                      formatter={(v) => formatCurrency(Number(v ?? 0))}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {sourceChartData.map((_, index) => (
                        <Cell
                          key={`source-cell-${index}`}
                          fill={chartPrimaryVariants[index % chartPrimaryVariants.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                {sourceChartData.map((entry, index) => (
                  <div
                    key={`source-legend-${entry.name}-${index}`}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30 border border-border text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: chartPrimaryVariants[index % chartPrimaryVariants.length],
                        }}
                      />
                      <span className="font-bold text-foreground">{entry.name}</span>
                    </div>
                    <span className="font-bold text-primary dark:text-white tabular-nums">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full-width Transaction Details Table */}
          <div className="px-4">
            <div className="trezo-card overflow-hidden">
              {/* Table Controls Header */}
              <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">
                    Transaction Details
                  </h3>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">
                    Item-level revenue, costs, VAT, and profit breakdown
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Rows selector */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground font-medium text-[11px]">Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-9 px-2.5 bg-muted/30 border border-border rounded-md text-xs font-semibold outline-none focus:border-primary text-foreground cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="flex items-center">
                    <select
                      value={selectedMethod}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                      className="h-9 px-3 bg-muted/30 border border-border rounded-md text-xs font-semibold outline-none focus:border-primary text-foreground cursor-pointer max-w-[150px]"
                    >
                      <option value="all">All Methods</option>
                      {paymentMethodOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-48 sm:w-56 group">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Search items, order #..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 bg-muted/30 border border-border rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 transition-all text-xs font-medium text-foreground"
                    />
                  </div>

                  {/* Export CSV */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                    className="h-9 px-3 border-border text-foreground hover:bg-muted/50 rounded-md gap-1.5 text-xs font-bold"
                  >
                    <Download className="size-3.5" />
                    <span>CSV</span>
                  </Button>

                  {/* Export PDF */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    className="h-9 px-3 border-border text-foreground hover:bg-muted/50 rounded-md gap-1.5 text-xs font-bold"
                  >
                    <Printer className="size-3.5" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>

              {/* Table Data */}
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className={dashboardTableHeaderClass}>
                    <TableRow className={dashboardTableHeadRowClass}>
                      <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Item Name</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Order #</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Payment Method</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Cost Price</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Selling Price</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>VAT</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Net Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-card">
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((item, idx) => (
                        <TableRow
                          key={`${item.id}-${item.orderId}-${idx}`}
                          className={dashboardTableBodyRowClass}
                        >
                          <TableCell className={dashboardTableCellClass}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[13px] font-bold text-zinc-800 dark:text-white">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-zinc-500 dark:text-white/70">
                                x{item.quantity} · {new Date(item.date).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={dashboardTableCellClass}>
                            <span className={dashboardTableIdClass}>#{item.orderId}</span>
                          </TableCell>
                          <TableCell className={dashboardTableCellClass}>
                            <span className="text-[10px] font-bold text-primary dark:text-white bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                              {formatPaymentMethod(item.paymentMethod, item.providerName)}
                            </span>
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-right font-medium tabular-nums")}>
                            {formatCurrency(item.costPrice ?? 0)}
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-right font-medium tabular-nums")}>
                            {formatCurrency(item.sellingPrice ?? 0)}
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-right font-medium text-indigo-600 dark:text-indigo-400 tabular-nums")}>
                            {formatCurrency(item.vat ?? 0)}
                          </TableCell>
                          <TableCell className={cn(dashboardTableCellClass, "text-right")}>
                            <span
                              className={cn(
                                "text-[12px] font-bold tabular-nums px-2 py-0.5 rounded border inline-block",
                                item.profit >= 0
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
                                  : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40"
                              )}
                            >
                              {item.profit >= 0 ? "+" : ""}
                              {formatCurrency(item.profit)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                          No transactions found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination & Summary Footer */}
              <div className="px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/10">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing {startRecord}–{endRecord} of {filteredItems.length} records
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-8 w-8 p-0"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="px-3 py-1 text-xs font-semibold rounded-md border border-border bg-card text-foreground">
                    {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 w-8 p-0"
                    aria-label="Next page"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
