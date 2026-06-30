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

export const dashboardAddButtonClass =
  "flex items-center gap-2 h-10 px-4 bg-[#1565c0] hover:bg-[#0a2744] text-white text-sm font-bold rounded-lg shadow-sm transition-colors";

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
    case "APPROVED":
      return "bg-emerald-700 text-white";
    case "IN_PROGRESS":
    case "UNDER_REVIEW":
      return "bg-[#1565c0] text-white";
    case "PENDING":
      return "bg-amber-500 text-white";
    case "AWAITING_APPROVAL":
      return "bg-orange-500 text-white";
    case "FAILED":
    case "REJECTED":
      return "bg-rose-600 text-white";
    case "EXPIRED":
      return "bg-zinc-600 text-white";
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

export function formatInspectionInspectorLabel(
  inspection: {
    company?: { name?: string };
    createdByUser?: {
      fullName?: string | null;
      username?: string;
      role?: string;
      company?: { name?: string };
    } | null;
  }
): string {
  const user = inspection.createdByUser;
  const companyName = inspection.company?.name || user?.company?.name;

  if (user?.role === "SUPER_ADMIN") return "Super Admin";
  if (user?.role === "STAFF") return "Admin";
  if (user?.role === "OWNER" || user?.role === "INSPECTOR") {
    return companyName || user.fullName || user.username || "—";
  }
  if (companyName) return companyName;
  return "—";
}

export function formatInspectionCreator(
  user?: {
    fullName?: string | null;
    username?: string;
    role?: string;
    company?: { name?: string };
  } | null
): string {
  if (!user) return "—";
  const name = user.fullName || user.username || "Unknown";
  if (user.role === "SUPER_ADMIN") return `${name} (Admin)`;
  if (user.role === "STAFF" || user.role === "OWNER" || user.role === "INSPECTOR") {
    return user.company?.name || name;
  }
  if (user.company?.name) return user.company.name;
  return name;
}

export function getInspectionInspectorDisplay(
  user?: {
    fullName?: string | null;
    username?: string;
    role?: string;
    company?: { name?: string };
  } | null,
  inspectionCompany?: { name?: string } | null
): { primary: string; secondary?: string } {
  const primary = formatInspectionCreator(user);
  const personName = user?.fullName || user?.username;

  if (user?.role === "SUPER_ADMIN") {
    const secondary = inspectionCompany?.name && inspectionCompany.name !== primary
      ? inspectionCompany.name
      : undefined;
    return { primary, secondary };
  }

  if (personName && personName !== primary) {
    return { primary, secondary: personName };
  }

  if (inspectionCompany?.name && inspectionCompany.name !== primary) {
    return { primary, secondary: inspectionCompany.name };
  }

  return { primary };
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

// ─── Vehicle & owner display (use everywhere for consistent tables) ───────────

export type VehicleDisplayLike = {
  color?: string | null;
  year?: number | null;
  vehicleColor?: { name?: string } | null;
  model?: { name?: string; brand?: { name?: string } } | null;
  owner?: { fullName?: string; phone?: string } | null;
  vehicleOwners?: { owner?: { fullName?: string; phone?: string } | null }[];
};

export function getVehicleBrand(vehicle?: VehicleDisplayLike | null): string {
  return vehicle?.model?.brand?.name || "—";
}

export function getVehicleModelName(vehicle?: VehicleDisplayLike | null): string {
  return vehicle?.model?.name || "—";
}

export function getVehicleColor(vehicle?: VehicleDisplayLike | null): string {
  return vehicle?.color || vehicle?.vehicleColor?.name || "—";
}

export function getVehicleYear(vehicle?: VehicleDisplayLike | null): string {
  return vehicle?.year != null ? String(vehicle.year) : "—";
}

export function getVehicleBrandModel(vehicle?: VehicleDisplayLike | null): string {
  const brand = vehicle?.model?.brand?.name;
  const model = vehicle?.model?.name;
  if (brand && model) return `${brand} ${model}`;
  return brand || model || "—";
}

export function getVehicleYearColor(vehicle?: VehicleDisplayLike | null): string {
  const year = getVehicleYear(vehicle);
  const color = getVehicleColor(vehicle);
  if (year === "—" && color === "—") return "—";
  return `${year} / ${color}`;
}

export function resolveVehicleOwner(
  vehicle?: VehicleDisplayLike | null,
  owner?: { fullName?: string; phone?: string } | null
): { fullName?: string; phone?: string } | null {
  return owner ?? vehicle?.owner ?? vehicle?.vehicleOwners?.[0]?.owner ?? null;
}

export const ownerNameClass =
  "text-xs font-bold text-foreground uppercase tracking-wide";

export const ownerPhoneBadgeClass =
  "inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";

export const vehicleCellTextClass =
  "text-sm text-zinc-600 dark:text-zinc-300";
