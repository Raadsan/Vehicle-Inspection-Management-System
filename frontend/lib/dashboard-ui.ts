/** Shared dashboard page layout & style utility classes mapped to the Southwest State brand theme */

export const dashboardPageClass =
  "animate-in fade-in duration-700 mx-1 pt-0 pb-8";

export const dashboardPageStyle = {
  fontFamily: "var(--font-sans), sans-serif",
} as const;

export const pageHeaderTitleClass =
  "text-2xl font-normal text-[#0a2744] dark:text-white tracking-tight";

export const pageHeaderSubtitleClass =
  "text-[12px] text-zinc-500 dark:text-white/80 uppercase tracking-wider mt-1 font-semibold";

export const pageHeaderWrapperClass = "mb-6 px-1";

export const dashboardCardClass =
  "bg-white dark:bg-card rounded-lg border border-zinc-200 dark:border-border shadow-xs overflow-hidden";

export const dashboardControlsRowClass =
  "px-5 py-3.5 flex flex-wrap items-center gap-3 border-b border-zinc-100 dark:border-border";

export const dashboardTableWrapClass =
  "border-t border-zinc-100 dark:border-border overflow-hidden bg-white dark:bg-card";

export const dashboardTextPrimary =
  "text-[13px] font-semibold text-zinc-800 dark:text-white";

export const dashboardTextSecondary =
  "text-[13px] font-medium text-zinc-600 dark:text-white/90";

export const dashboardTextMuted =
  "text-[13px] text-zinc-500 dark:text-white/70";

export const dashboardLabelClass =
  "text-[13px] text-zinc-400 dark:text-white/60 font-normal shrink-0";

export const dashboardTableHeaderClass =
  "bg-[#0a2744] dark:bg-[#1e1e1e] border-b border-[#0a2744] dark:border-[#2a2a2a]";
export const dashboardTableHeadRowClass = "hover:bg-transparent border-none";
export const dashboardTableHeadClass =
  "px-5 py-3 text-[11px] font-black uppercase text-white tracking-wider border-none";
export const dashboardTableBodyRowClass =
  "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors";
export const dashboardTableCellClass = "px-5 py-3 text-foreground dark:text-white";

/* Chart colors - all blue shades */
export const chartPrimary = "#1565c0";
export const chartPrimaryMid = "#2196f3";
export const chartPrimaryLight = "#4fc3f7";
export const chartPrimaryVariants = [
  "#0a2744", // Dark Navy
  "#1565c0", // Primary Blue
  "#1976d2", // Medium Blue
  "#2196f3", // Sky Blue
  "#4fc3f7", // Light Blue
  "#90caf9", // Pale Blue
] as const;

export const chartTooltipStyle = {
  backgroundColor: "#0a2744",
  borderColor: "#0a2744",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  color: "#ffffff",
} as const;

export const chartAxisTick = {
  fontSize: 10,
  fontWeight: 700,
  fill: "var(--chart-tick, #888888)",
} as const;

export const dashboardTableIdClass =
  "text-[13px] font-bold text-[#1565c0] dark:text-[#4fc3f7]";

export const dashboardStatusBadgeClass =
  "px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider rounded inline-flex items-center gap-1";

export function getOrderStatusBadgeClass(status: string): string {
  switch (status.toUpperCase()) {
    case "COMPLETED":
    case "PASSED":
      return "bg-emerald-600 text-white";
    case "IN_PROGRESS":
    case "UNDER_REVIEW":
      return "bg-[#1565c0] text-white";
    case "PENDING":
      return "bg-amber-500 text-white";
    case "FAILED":
      return "bg-rose-600 text-white";
    case "CANCELLED":
      return "bg-zinc-500 text-white";
    default:
      return "bg-zinc-500 text-white";
  }
}

export function formatStatusLabel(status: string): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

const dashboardStatIconBaseClass =
  "w-fit shrink-0 self-start p-3 rounded-lg text-white shadow-md transition-all group-hover:scale-110 group-hover:brightness-110 [&_svg]:text-white";

// All blue gradient shades — from darkest navy → lightest sky
export const dashboardStatIconBgVariants = [
  "bg-[#0a2744]", // Dark Navy
  "bg-[#1565c0]", // Primary Blue
  "bg-[#1976d2]", // Medium Blue
  "bg-[#2196f3]", // Sky Blue
  "bg-[#4fc3f7]", // Light Blue
] as const;

export function dashboardStatIconClass(index = 0): string {
  const bg =
    dashboardStatIconBgVariants[index % dashboardStatIconBgVariants.length];
  return `${dashboardStatIconBaseClass} ${bg}`;
}
