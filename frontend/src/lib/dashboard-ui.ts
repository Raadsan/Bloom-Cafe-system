/** Shared dashboard page layout & table action button styles (Rooms page standard). */

export const dashboardPageClass =
  "animate-in fade-in duration-700 mx-1 pt-0 pb-8";

export const dashboardPageStyle = {
  fontFamily: "var(--font-poppins), sans-serif",
} as const;

export const pageHeaderTitleClass =
  "text-2xl font-semibold text-[#1e293b] capitalize tracking-tight";

export const pageHeaderSubtitleClass =
  "text-[12px] text-zinc-500 uppercase tracking-wider mt-1 font-medium";

/** Dashboard table — primary header, white labels. */
export const dashboardTableHeaderClass = "bg-primary border-b border-primary";
export const dashboardTableHeadRowClass = "hover:bg-transparent border-none";
export const dashboardTableHeadClass =
  "px-6 py-3.5 text-[11px] font-bold uppercase text-white tracking-wider border-none";
export const dashboardTableBodyRowClass =
  "border-zinc-100 hover:bg-zinc-50/50 transition-colors";
export const dashboardTableCellClass = "px-6 py-3";

/** Chart colors — primary family, no blue. */
export const chartPrimary = "#5b1017";
export const chartPrimaryMid = "#8b3340";
export const chartPrimaryLight = "#d4a0a6";
export const chartPrimaryVariants = [
  chartPrimary,
  "#6d252e",
  "#8b3340",
  "#a8555c",
  chartPrimaryLight,
] as const;

export const chartTooltipStyle = {
  backgroundColor: chartPrimary,
  borderColor: chartPrimary,
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#ffffff",
} as const;

/** Status badge — solid style (Users page standard). */
export const dashboardStatusBadgeClass =
  "px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-md";

export function getTableStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "inactive":
      return "bg-rose-600 text-white";
    default:
      // active, occupied, or any legacy value → Active (green)
      return "bg-emerald-600 text-white";
  }
}

export function getTableStatusLabel(status: string): string {
  return status.toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function getOrderStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "paid":
    case "served":
    case "completed":
      return "bg-emerald-600 text-white";
    case "preparing":
    case "ready":
      return "bg-blue-600 text-white";
    case "pending":
      return "bg-amber-500 text-white";
    case "cancelled":
      return "bg-rose-600 text-white";
    case "held":
      return "bg-zinc-500 text-white";
    default:
      return "bg-zinc-500 text-white";
  }
}

export function formatStatusLabel(status: string): string {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** Native `<table>` header — same primary style as shadcn Table. */
export const dashboardNativeTheadClass = "bg-primary border-b border-primary";
export const dashboardNativeThClass =
  "px-6 py-3.5 text-[11px] font-bold uppercase text-white tracking-wider border-none";

export function getStockStatusBadgeClass(kind: "in" | "low" | "out"): string {
  switch (kind) {
    case "out":
      return "bg-rose-600 text-white";
    case "low":
      return "bg-amber-500 text-white";
    default:
      return "bg-emerald-600 text-white";
  }
}

/** Stat card icon — different soft primary tints, white icon. */
const dashboardStatIconBaseClass =
  "p-2.5 rounded-xl text-white shadow-md shadow-primary/15 transition-all group-hover:scale-110 group-hover:brightness-105 [&_svg]:text-white";

/** Full primary (left) → lighter primary (right). */
export const dashboardStatIconBgVariants = [
  "bg-[#5b1017]",
  "bg-[#6d252e]",
  "bg-[#8b3340]",
  "bg-[#a8555c]",
  "bg-[#d4a0a6]",
] as const;

export function dashboardStatIconClass(index = 0): string {
  const bg =
    dashboardStatIconBgVariants[index % dashboardStatIconBgVariants.length];
  return `${dashboardStatIconBaseClass} ${bg}`;
}

export const actionBtnView =
  "h-8 w-8 p-0 text-primary hover:!text-emerald-600 hover:!bg-emerald-50 rounded-lg transition-colors";

export const actionBtnEdit =
  "h-8 w-8 p-0 text-primary hover:!text-blue-600 hover:!bg-blue-50 rounded-lg transition-colors";

export const actionBtnDelete =
  "h-8 w-8 p-0 text-rose-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors";

/** Solid red confirm button — keeps white text on hover (overrides default Button variant). */
export const btnConfirmDelete =
  "bg-rose-600 hover:bg-rose-700 !text-white hover:!text-white rounded-lg font-bold border-none shadow-lg shadow-rose-600/10";

/** Page header create / add button — primary with lighter hover, white text always. */
export const btnCreatePage =
  "h-[42px] px-6 bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-md flex items-center gap-2 transition-all font-medium text-sm shadow-sm hover:shadow-md hover:shadow-primary/20 border-none";

/** Modal create / save submit button. */
export const btnCreateSubmit =
  "bg-primary !text-white hover:bg-primary/90 hover:!text-white rounded-lg font-bold border-none px-8 h-11 shadow-md shadow-primary/15 disabled:opacity-70 transition-all";

/** Order card — light primary view button. */
export const btnViewOrder =
  "h-9 px-3.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:!text-primary font-semibold text-[12px] shadow-sm transition-all gap-1.5";

/** Order card — light blue edit button. */
export const btnEditOrder =
  "h-9 w-9 p-0 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 hover:!text-blue-700 transition-all shrink-0";
