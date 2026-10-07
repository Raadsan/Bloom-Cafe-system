"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingBag,
  DollarSign,
  Layers,
  Receipt,
  Download,
  Printer,
  Search,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Filter,
  Percent,
  Trophy,
  Award,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  dashboardPageClass,
  dashboardPageStyle,
  pageHeaderTitleClass,
  pageHeaderWrapperClass,
  dashboardStatIconClass,
  chartPrimary,
  chartPrimaryVariants,
  chartTooltipStyle,
  chartAxisTick,
  dashboardTableHeaderClass,
  dashboardTableHeadRowClass,
  dashboardTableHeadClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableIdClass,
} from "@/lib/dashboard-ui";
import { businessDateKey, dateFromBusinessKey, formatLocalKey } from "@/lib/businessDay";

const EMPTY_WEEKLY = [
  { name: "Mon", orders: 0, revenue: 0 },
  { name: "Tue", orders: 0, revenue: 0 },
  { name: "Wed", orders: 0, revenue: 0 },
  { name: "Thu", orders: 0, revenue: 0 },
  { name: "Fri", orders: 0, revenue: 0 },
  { name: "Sat", orders: 0, revenue: 0 },
  { name: "Sun", orders: 0, revenue: 0 },
];

function formatLabel(value: string) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CategorySaleItem {
  name: string;
  quantity: number;
  totalAmount: number;
  unitPrice?: number;
  vat?: number;
  netAmount?: number;
}

interface CategorySale {
  categoryName: string;
  totalQuantity: number;
  totalAmount: number;
  totalVat?: number;
  totalNet?: number;
  items: CategorySaleItem[];
}

export interface Top5SaleItem {
  name: string;
  categoryName: string;
  quantity: number;
  totalAmount: number;
  vat?: number;
  netAmount?: number;
  unitPrice?: number;
}

interface OrdersReportData {
  totalOrders: number;
  cancelledOrders?: number;
  totalAmount: number;
  totalVat?: number;
  totalSubTotal?: number;
  totalDiscount?: number;
  totalNet?: number;
  totalItemsSold?: number;
  top5Sales?: Top5SaleItem[];
  categorySales?: CategorySale[];
  breakdownByType?: Record<string, number>;
  breakdownBySource?: Record<string, number>;
}

type PresetType = "all" | "today" | "week" | "month" | "last30" | "custom";

export default function OrdersReportPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrdersReportData | null>(null);
  const [weeklyData, setWeeklyData] = useState(EMPTY_WEEKLY);
  
  // Table state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Date filters with preset support (defaults to 'all' so it syncs with Dashboard on load)
  const [preset, setPreset] = useState<PresetType>("all");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const { showToast } = useToast();

  const handleSelectPreset = (p: PresetType) => {
    setPreset(p);
    const today = dateFromBusinessKey(businessDateKey());
    const todayStr = formatLocalKey(today);
    if (p === "all") {
      setDateRange({ startDate: "", endDate: "" });
    } else if (p === "today") {
      setDateRange({ startDate: todayStr, endDate: todayStr });
    } else if (p === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today);
      monday.setDate(diff);
      setDateRange({
        startDate: formatLocalKey(monday),
        endDate: todayStr,
      });
    } else if (p === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateRange({
        startDate: formatLocalKey(firstDay),
        endDate: todayStr,
      });
    } else if (p === "last30") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      setDateRange({
        startDate: formatLocalKey(d),
        endDate: todayStr,
      });
    }
  };

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: { startDate?: string; endDate?: string } = {};
      if (dateRange.startDate) queryParams.startDate = dateRange.startDate;
      if (dateRange.endDate) queryParams.endDate = dateRange.endDate;

      const [ordersRes, weeklyRes] = await Promise.all([
        reportApi.getOrdersReport(queryParams),
        reportApi.getWeeklyAnalytics(),
      ]);

      if (ordersRes.success) {
        setData(ordersRes.data);
      } else {
        setData(null);
      }

      if (weeklyRes.success && Array.isArray(weeklyRes.data)) {
        setWeeklyData(weeklyRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders report:", error);
      showToast("Error loading orders data", "error");
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

  // Type Chart Data
  const typeChartData = useMemo(() => {
    if (!data?.breakdownByType) return [];
    return Object.entries(data.breakdownByType).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }));
  }, [data?.breakdownByType]);

  // Source Chart Data
  const sourceChartData = useMemo(() => {
    if (!data?.breakdownBySource) return [];
    return Object.entries(data.breakdownBySource).map(([name, value]) => ({
      name: formatLabel(name),
      value,
    }));
  }, [data?.breakdownBySource]);

  // Top 5 Sales Chart Data
  const top5ChartData = useMemo(() => {
    if (data?.top5Sales && data.top5Sales.length > 0) {
      return data.top5Sales;
    }
    if (!data?.categorySales) return [];
    const all: Top5SaleItem[] = [];
    data.categorySales.forEach((cat) => {
      cat.items.forEach((it) => {
        all.push({
          name: it.name,
          categoryName: cat.categoryName,
          quantity: it.quantity,
          totalAmount: it.totalAmount,
          vat: it.vat,
          netAmount: it.netAmount,
          unitPrice: it.unitPrice,
        });
      });
    });
    return all.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5);
  }, [data?.top5Sales, data?.categorySales]);

  // Category Filter Options
  const categoryOptions = useMemo(() => {
    if (!data?.categorySales) return [];
    return data.categorySales.map((c) => c.categoryName);
  }, [data?.categorySales]);

  // Filter Category Sales
  const filteredCategorySales = useMemo(() => {
    if (!data?.categorySales) return [];
    const q = search.toLowerCase().trim();

    return data.categorySales
      .filter((cat) => {
        if (selectedCategory !== "all" && cat.categoryName.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
        if (!q) return true;
        const matchesCat = cat.categoryName.toLowerCase().includes(q);
        const matchesItems = cat.items.some((it) => it.name.toLowerCase().includes(q));
        return matchesCat || matchesItems;
      })
      .map((cat) => {
        if (!q) return cat;
        return {
          ...cat,
          items: cat.items.filter(
            (it) => it.name.toLowerCase().includes(q) || cat.categoryName.toLowerCase().includes(q)
          ),
        };
      })
      .filter((cat) => cat.items.length > 0);
  }, [data?.categorySales, search, selectedCategory]);

  // Totals of current filtered data
  const totalCategoryQty = useMemo(() => {
    return filteredCategorySales.reduce(
      (sum, c) => sum + c.items.reduce((s, it) => s + it.quantity, 0),
      0
    );
  }, [filteredCategorySales]);

  const totalCategoryAmount = useMemo(() => {
    return filteredCategorySales.reduce(
      (sum, c) => sum + c.items.reduce((s, it) => s + it.totalAmount, 0),
      0
    );
  }, [filteredCategorySales]);

  const totalCategoryVat = useMemo(() => {
    return filteredCategorySales.reduce(
      (sum, c) => sum + c.items.reduce((s, it) => s + (it.vat ?? 0), 0),
      0
    );
  }, [filteredCategorySales]);

  const totalCategoryNet = useMemo(() => {
    return filteredCategorySales.reduce(
      (sum, c) =>
        sum +
        c.items.reduce((s, it) => s + (it.netAmount !== undefined ? it.netAmount : it.totalAmount - (it.vat ?? 0)), 0),
      0
    );
  }, [filteredCategorySales]);

  // Pagination for Categories
  const totalPages = Math.max(1, Math.ceil(filteredCategorySales.length / pageSize));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCategorySales.slice(start, start + pageSize);
  }, [filteredCategorySales, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, pageSize]);

  const startRecord = filteredCategorySales.length ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = Math.min(currentPage * pageSize, filteredCategorySales.length);

  // Export to CSV
  const handleExportCsv = () => {
    if (!filteredCategorySales.length) {
      showToast("No data to export", "error");
      return;
    }
    const lines = ["Category,Item Name,Quantity Sold,Total Sales ($),VAT ($),Net Sales ($)"];
    filteredCategorySales.forEach((cat) => {
      const catVat = cat.items.reduce((s, it) => s + (it.vat ?? 0), 0);
      const catNet = cat.items.reduce(
        (s, it) => s + (it.netAmount !== undefined ? it.netAmount : it.totalAmount - (it.vat ?? 0)),
        0
      );
      lines.push(
        `"${cat.categoryName}",[TOTAL CATEGORY],${cat.totalQuantity.toFixed(1)},${cat.totalAmount.toFixed(2)},${catVat.toFixed(2)},${catNet.toFixed(2)}`
      );
      cat.items.forEach((it) => {
        const itemVat = it.vat ?? 0;
        const itemNet = it.netAmount !== undefined ? it.netAmount : it.totalAmount - itemVat;
        lines.push(
          `"${cat.categoryName}","${it.name.replace(/"/g, '""')}",${it.quantity.toFixed(1)},${it.totalAmount.toFixed(2)},${itemVat.toFixed(2)},${itemNet.toFixed(2)}`
        );
      });
    });
    lines.push(
      `"GRAND TOTAL",,${totalCategoryQty.toFixed(1)},${totalCategoryAmount.toFixed(2)},${totalCategoryVat.toFixed(2)},${totalCategoryNet.toFixed(2)}`
    );

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-by-category-${dateRange.startDate || "all"}-to-${dateRange.endDate || "time"}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Sales report exported to CSV", "success");
  };

  // Export to PDF
  const handleExportPdf = () => {
    if (!filteredCategorySales.length) {
      showToast("No data to export", "error");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked. Please allow pop-ups for this site.", "error");
      return;
    }

    let rowsHtml = "";
    filteredCategorySales.forEach((cat) => {
      const catVat = cat.items.reduce((s, it) => s + (it.vat ?? 0), 0);
      const catNet = cat.items.reduce(
        (s, it) => s + (it.netAmount !== undefined ? it.netAmount : it.totalAmount - (it.vat ?? 0)),
        0
      );
      rowsHtml += `
        <tr style="background:#f8fafc; font-weight: 700; border-top: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 7px 10px; color: #0f172a;">${cat.categoryName} (${cat.items.length} items)</td>
          <td style="padding: 7px 10px; color: #5b1017;">Category</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 700;">${cat.totalQuantity.toFixed(1)}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(cat.totalAmount)}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #4f46e5;">${formatCurrency(catVat)}</td>
          <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #059669;">${formatCurrency(catNet)}</td>
        </tr>
      `;
      cat.items.forEach((it) => {
        const itemVat = it.vat ?? 0;
        const itemNet = it.netAmount !== undefined ? it.netAmount : it.totalAmount - itemVat;
        rowsHtml += `
          <tr>
            <td style="padding: 5px 10px 5px 24px; color: #334155;">• ${it.name}</td>
            <td style="padding: 5px 10px; color: #94a3b8; font-size: 10px;">${cat.categoryName}</td>
            <td style="padding: 5px 10px; text-align: right;">${it.quantity.toFixed(1)}</td>
            <td style="padding: 5px 10px; text-align: right; font-weight: 500;">${formatCurrency(it.totalAmount)}</td>
            <td style="padding: 5px 10px; text-align: right; color: #4f46e5;">${formatCurrency(itemVat)}</td>
            <td style="padding: 5px 10px; text-align: right; font-weight: 600; color: #059669;">${formatCurrency(itemNet)}</td>
          </tr>
        `;
      });
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orders & Sales Report - Category Breakdown</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #5b1017; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { font-size: 18px; font-weight: 800; color: #5b1017; letter-spacing: -0.5px; }
            .meta { text-align: right; font-size: 11px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
            th { background: #5b1017; color: white; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
            td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; }
            .grand-total { background: #fff1f2; font-weight: 800; font-size: 12px; border-top: 2px solid #5b1017; border-bottom: 2px solid #5b1017; color: #5b1017; }
            .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">BLOOM CAFE</div>
              <div style="font-size: 13px; font-weight: 600; color: #334155; margin-top: 2px;">Orders Activity & Category Sales Report</div>
            </div>
            <div class="meta">
              <div><strong>Period:</strong> ${dateRange.startDate && dateRange.endDate ? `${dateRange.startDate} to ${dateRange.endDate}` : "All Time"}</div>
              <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item / Category</th>
                <th>Group</th>
                <th style="text-align:right;">Qty Sold</th>
                <th style="text-align:right;">Total Sales</th>
                <th style="text-align:right;">VAT</th>
                <th style="text-align:right;">Net Sales</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="grand-total">
                <td style="padding: 10px;">Grand Total</td>
                <td style="padding: 10px;">${filteredCategorySales.length} Categories</td>
                <td style="padding: 10px; text-align: right;">${totalCategoryQty.toFixed(1)}</td>
                <td style="padding: 10px; text-align: right;">${formatCurrency(totalCategoryAmount)}</td>
                <td style="padding: 10px; text-align: right;">${formatCurrency(totalCategoryVat)}</td>
                <td style="padding: 10px; text-align: right;">${formatCurrency(totalCategoryNet)}</td>
              </tr>
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

  const avgOrderValue =
    (data?.totalOrders ?? 0) > 0 ? (data?.totalAmount ?? 0) / (data?.totalOrders ?? 1) : 0;

  const statCards = [
    {
      title: "Total Orders",
      value: (data?.totalOrders ?? 0).toLocaleString(),
      icon: ShoppingBag,
    },
    {
      title: "Total Sales",
      value: formatCurrency(data?.totalAmount ?? 0),
      icon: DollarSign,
    },
    {
      title: "Total VAT",
      value: formatCurrency(data?.totalVat ?? totalCategoryVat ?? 0),
      icon: Percent,
    },
    {
      title: "Net Sales",
      value: formatCurrency(data?.totalNet ?? totalCategoryNet ?? 0),
      icon: Receipt,
    },
    {
      title: "Total Items Sold",
      value: (data?.totalItemsSold ?? 0).toLocaleString(),
      icon: Coffee,
    },
    {
      title: "Avg Order Value",
      value: formatCurrency(avgOrderValue),
      icon: Layers,
    },
  ];

  return (
    <div
      className={cn(dashboardPageClass, "space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700")}
      style={dashboardPageStyle}
    >
      <div className="space-y-3">
      <div className={cn(pageHeaderWrapperClass, "mb-0")}>
        <h1 className={pageHeaderTitleClass}>Orders & Sales Report</h1>
      </div>
      <div className="px-4">
        <div className="flex flex-wrap items-center justify-end gap-2 trezo-card p-2 w-fit ml-auto">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 border-r border-border pr-2">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "week", label: "This Week" },
              { id: "month", label: "This Month" },
              { id: "last30", label: "Last 30 Days" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => handleSelectPreset(btn.id as PresetType)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                  preset === btn.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="size-3.5 text-muted-foreground" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setPreset("custom");
                setDateRange((prev) => ({ ...prev, startDate: e.target.value }));
              }}
              className="text-xs font-semibold bg-transparent outline-none border-none cursor-pointer text-foreground"
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setPreset("custom");
                setDateRange((prev) => ({ ...prev, endDate: e.target.value }));
              }}
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
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="trezo-card h-28 animate-pulse bg-muted/20" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4">
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
            {/* Order Trends Chart */}
            <div className="lg:col-span-2 trezo-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Order Trends
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Weekly order volume & revenue
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Orders
                  </span>
                </div>
              </div>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="orderTrendGradient" x1="0" y1="0" x2="0" y2="1">
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
                    <YAxis axisLine={false} tickLine={false} tick={chartAxisTick} />
                    <Tooltip contentStyle={chartTooltipStyle} itemStyle={{ color: "#ffffff" }} />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke={chartPrimary}
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#orderTrendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Order Types / Channel Volume */}
            <div className="trezo-card p-6">
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Order Types
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Dine-in, Takeaway & Delivery
                </p>
              </div>
              <div className="h-[180px] w-full mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeChartData}>
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
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {typeChartData.map((_, index) => (
                        <Cell
                          key={`order-type-${index}`}
                          fill={chartPrimaryVariants[index % chartPrimaryVariants.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                {typeChartData.map((entry, index) => (
                  <div
                    key={`type-legend-${entry.name}-${index}`}
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
                      {entry.value} orders
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 5 Sales in Orders Report Section */}
          <div className="px-4">
            <div className="trezo-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-sm">
                    <Trophy className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                      Top 5 Sales in Orders Report
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Highest revenue items • {preset === "all" ? "All Time" : `${dateRange.startDate || "Start"} to ${dateRange.endDate || "End"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Award className="size-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold text-foreground">
                    Ranked by Total Revenue ($)
                  </span>
                </div>
              </div>

              {top5ChartData.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                  <Coffee className="size-8 stroke-1 text-muted-foreground/40" />
                  <p>No sales data recorded for the selected period</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left: Bar Chart (7 cols) */}
                  <div className="lg:col-span-7 h-[270px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={top5ChartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="hsl(var(--border))"
                          opacity={0.5}
                        />
                        <XAxis
                          type="number"
                          axisLine={false}
                          tickLine={false}
                          tick={chartAxisTick}
                          tickFormatter={(val) => `$${val}`}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "currentColor", fontSize: 11, fontWeight: 600 }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(value: any, name: any, item: any) => [
                            `$${Number(value || 0).toFixed(2)} (${item?.payload?.quantity ?? 0} sold)`,
                            "Total Sales",
                          ]}
                        />
                        <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]}>
                          {top5ChartData.map((_, index) => (
                            <Cell
                              key={`top5-bar-${index}`}
                              fill={chartPrimaryVariants[index % chartPrimaryVariants.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right: Ranked List Badges (5 cols) */}
                  <div className="lg:col-span-5 space-y-2.5">
                    {top5ChartData.map((item, index) => {
                      const rankBadges = [
                        "bg-amber-500 text-white border-amber-600 shadow-sm",
                        "bg-slate-400 text-white border-slate-500 shadow-sm",
                        "bg-amber-700 text-white border-amber-800 shadow-sm",
                        "bg-primary/80 text-white border-primary",
                        "bg-primary/60 text-white border-primary/80",
                      ];
                      return (
                        <div
                          key={`top5-rank-card-${item.name}-${index}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/25 border border-border/80 hover:border-primary/40 hover:bg-muted/40 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-black border",
                                rankBadges[index] || "bg-muted text-muted-foreground"
                              )}
                            >
                              #{index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {item.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                  {item.categoryName}
                                </span>
                                <span className="size-1 rounded-full bg-border" />
                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                                  {item.quantity} sold
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0 pl-3">
                            <p className="text-sm font-black text-foreground tabular-nums">
                              {formatCurrency(item.totalAmount)}
                            </p>
                            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Sales Revenue
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full-width Main Activity Table matching Transaction Details */}
          <div className="px-4">
            <div className="trezo-card overflow-hidden">
              {/* Controls Bar */}
              <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">
                    Order Activity & Category Sales
                  </h3>
                  <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mt-0.5">
                    Items sold and sales revenue grouped by category
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

                  {/* Category Filter */}
                  <div className="flex items-center">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-9 px-3 bg-muted/30 border border-border rounded-md text-xs font-semibold outline-none focus:border-primary text-foreground cursor-pointer max-w-[160px]"
                    >
                      <option value="all">All Categories</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-48 sm:w-56 group">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Search items, categories..."
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
                      <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Item / Category</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-left")}>Category Group</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Qty Sold</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Total Sales</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>VAT</TableHead>
                      <TableHead className={cn(dashboardTableHeadClass, "text-right")}>Net Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-card">
                    {paginatedCategories.length > 0 ? (
                      paginatedCategories.map((cat, catIdx) => {
                        const catVat = cat.items.reduce((s, it) => s + (it.vat ?? 0), 0);
                        const catNet = cat.items.reduce(
                          (s, it) => s + (it.netAmount !== undefined ? it.netAmount : it.totalAmount - (it.vat ?? 0)),
                          0
                        );
                        return (
                          <React.Fragment key={`cat-group-${cat.categoryName}-${catIdx}`}>
                            {/* Category Summary / Header Row */}
                            <TableRow className="bg-muted/40 hover:bg-muted/60 border-y border-border/80">
                              <TableCell className={cn(dashboardTableCellClass, "font-bold")}>
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-bold text-zinc-900 dark:text-white">
                                    {cat.categoryName}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold px-1.5 py-0.5 rounded bg-muted/80 border border-border/60">
                                    {cat.items.length} {cat.items.length === 1 ? "item" : "items"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className={dashboardTableCellClass}>
                                <span className="text-[10px] font-bold text-primary dark:text-white bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                  {cat.categoryName}
                                </span>
                              </TableCell>
                              <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-foreground tabular-nums")}>
                                {cat.totalQuantity.toFixed(1)}
                              </TableCell>
                              <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-foreground tabular-nums")}>
                                {formatCurrency(cat.totalAmount)}
                              </TableCell>
                              <TableCell className={cn(dashboardTableCellClass, "text-right font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums")}>
                                {formatCurrency(catVat)}
                              </TableCell>
                              <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums")}>
                                {formatCurrency(catNet)}
                              </TableCell>
                            </TableRow>

                            {/* Item Sub-rows */}
                            {cat.items.map((it, itemIdx) => {
                              const itemVat = it.vat ?? 0;
                              const itemNet = it.netAmount !== undefined ? it.netAmount : it.totalAmount - itemVat;
                              return (
                                <TableRow
                                  key={`cat-item-${cat.categoryName}-${it.name}-${itemIdx}`}
                                  className={dashboardTableBodyRowClass}
                                >
                                  <TableCell className={dashboardTableCellClass}>
                                    <div className="flex items-center gap-2.5 pl-4">
                                      <span className="size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
                                      <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                                        {it.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className={dashboardTableCellClass}>
                                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                                      {cat.categoryName}
                                    </span>
                                  </TableCell>
                                  <TableCell className={cn(dashboardTableCellClass, "text-right font-medium text-zinc-700 dark:text-zinc-200 tabular-nums")}>
                                    {it.quantity.toFixed(1)}
                                  </TableCell>
                                  <TableCell className={cn(dashboardTableCellClass, "text-right font-medium text-zinc-800 dark:text-white tabular-nums")}>
                                    {formatCurrency(it.totalAmount)}
                                  </TableCell>
                                  <TableCell className={cn(dashboardTableCellClass, "text-right font-medium text-indigo-600 dark:text-indigo-400 tabular-nums")}>
                                    {formatCurrency(itemVat)}
                                  </TableCell>
                                  <TableCell className={cn(dashboardTableCellClass, "text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums")}>
                                    {formatCurrency(itemNet)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          No category sales records found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Grand Total Row */}
                    {filteredCategorySales.length > 0 && (
                      <TableRow className="border-t-2 border-border bg-muted/20 font-extrabold text-sm">
                        <TableCell className={cn(dashboardTableCellClass, "font-bold text-primary dark:text-white uppercase tracking-wider")}>
                          Grand Total
                        </TableCell>
                        <TableCell className={dashboardTableCellClass}>
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {filteredCategorySales.length} {filteredCategorySales.length === 1 ? "Category" : "Categories"}
                          </span>
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-foreground tabular-nums")}>
                          {totalCategoryQty.toFixed(1)}
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-foreground tabular-nums")}>
                          {formatCurrency(totalCategoryAmount)}
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-indigo-600 dark:text-indigo-400 tabular-nums")}>
                          {formatCurrency(totalCategoryVat)}
                        </TableCell>
                        <TableCell className={cn(dashboardTableCellClass, "text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums")}>
                          {formatCurrency(totalCategoryNet)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination & Summary Footer */}
              <div className="px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border bg-muted/10">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing {startRecord}–{endRecord} of {filteredCategorySales.length} categories
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
