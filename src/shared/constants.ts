import type {
  AlertSeverity,
  AlertType,
  AssetStatus,
  LeaseStatus,
  LicenseStatus,
  MaintenanceStatus,
  MaintenanceType,
  Role,
} from "@prisma/client";

export const APP_NAME = "AssetArt";
export const APP_TAGLINE = "Enterprise asset intelligence";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_TIMEZONE = "Europe/Istanbul";
export const DEFAULT_LOCALE = "en-US";

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_WIDTH_COLLAPSED = 64;
export const TOPBAR_HEIGHT = 56;

/* ───────── Asset status meta ───────── */
type StatusMeta = {
  label: string;
  bg: string;
  fg: string;
  dot: string;
};

export const ASSET_STATUS_META: Record<AssetStatus, StatusMeta> = {
  AVAILABLE:      { label: "Available",      bg: "bg-[color:var(--color-status-available-bg)]",   fg: "text-[color:var(--color-status-available-fg)]",   dot: "bg-[color:var(--color-status-available-fg)]" },
  CHECKED_OUT:    { label: "Checked out",    bg: "bg-[color:var(--color-status-checked-out-bg)]", fg: "text-[color:var(--color-status-checked-out-fg)]", dot: "bg-[color:var(--color-status-checked-out-fg)]" },
  IN_MAINTENANCE: { label: "In maintenance", bg: "bg-[color:var(--color-status-maintenance-bg)]", fg: "text-[color:var(--color-status-maintenance-fg)]", dot: "bg-[color:var(--color-status-maintenance-fg)]" },
  RESERVED:       { label: "Reserved",       bg: "bg-[color:var(--color-status-reserved-bg)]",    fg: "text-[color:var(--color-status-reserved-fg)]",    dot: "bg-[color:var(--color-status-reserved-fg)]" },
  LEASED:         { label: "Leased",         bg: "bg-[color:var(--color-status-leased-bg)]",      fg: "text-[color:var(--color-status-leased-fg)]",      dot: "bg-[color:var(--color-status-leased-fg)]" },
  DISPOSED:       { label: "Disposed",       bg: "bg-[color:var(--color-status-disposed-bg)]",    fg: "text-[color:var(--color-status-disposed-fg)]",    dot: "bg-[color:var(--color-status-disposed-fg)]" },
  LOST:           { label: "Lost",           bg: "bg-[color:var(--color-status-lost-bg)]",        fg: "text-[color:var(--color-status-lost-fg)]",        dot: "bg-[color:var(--color-status-lost-fg)]" },
};

export const MAINTENANCE_STATUS_META: Record<MaintenanceStatus, { label: string; tone: "info" | "warning" | "success" | "muted" | "danger" }> = {
  SCHEDULED:    { label: "Scheduled",    tone: "info" },
  IN_PROGRESS:  { label: "In progress",  tone: "warning" },
  COMPLETED:    { label: "Completed",    tone: "success" },
  CANCELLED:    { label: "Cancelled",    tone: "muted" },
  OVERDUE:      { label: "Overdue",      tone: "danger" },
};

export const MAINTENANCE_TYPE_META: Record<MaintenanceType, { label: string; icon: string }> = {
  PREVENTIVE: { label: "Preventive", icon: "shield-check" },
  CORRECTIVE: { label: "Corrective", icon: "wrench" },
  INSPECTION: { label: "Inspection", icon: "search" },
  CALIBRATION:{ label: "Calibration", icon: "ruler" },
};

export const LEASE_STATUS_META: Record<LeaseStatus, { label: string; tone: "success" | "warning" | "muted" | "danger" }> = {
  ACTIVE:    { label: "Active",    tone: "success" },
  EXPIRING:  { label: "Expiring",  tone: "warning" },
  ENDED:     { label: "Ended",     tone: "muted" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
};

export const LICENSE_STATUS_META: Record<LicenseStatus, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  ACTIVE:    { label: "Active",    tone: "success" },
  EXPIRING:  { label: "Expiring",  tone: "warning" },
  EXPIRED:   { label: "Expired",   tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
};

export const ROLE_META: Record<Role, { label: string; description: string }> = {
  OWNER:   { label: "Owner",   description: "Full access, billing, can delete workspace" },
  ADMIN:   { label: "Admin",   description: "Full access except billing & workspace deletion" },
  MANAGER: { label: "Manager", description: "Can create / edit assets, check in/out, run reports" },
  MEMBER:  { label: "Member",  description: "Can check in/out and view all assets" },
  VIEWER:  { label: "Viewer",  description: "Read-only access" },
};

export const ALERT_TYPE_META: Record<AlertType, { label: string; icon: string }> = {
  WARRANTY_EXPIRING: { label: "Warranty expiring", icon: "shield" },
  LEASE_EXPIRING:    { label: "Lease expiring",    icon: "calendar-clock" },
  MAINTENANCE_DUE:   { label: "Maintenance due",   icon: "wrench" },
  LICENSE_EXPIRING:  { label: "License expiring",  icon: "key-round" },
  ASSET_OVERDUE:     { label: "Asset overdue",     icon: "alert-circle" },
  ASSET_MISSING:     { label: "Asset missing",     icon: "search-x" },
};

export const ALERT_SEVERITY_META: Record<AlertSeverity, { label: string; bg: string; fg: string }> = {
  INFO:     { label: "Info",     bg: "bg-info-bg",    fg: "text-info-fg" },
  WARNING:  { label: "Warning",  bg: "bg-warning-bg", fg: "text-warning-fg" },
  CRITICAL: { label: "Critical", bg: "bg-danger-bg",  fg: "text-danger-fg" },
};

/* ───────── Pagination ───────── */
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export const DEFAULT_PAGE_SIZE = 50;

/* ───────── Alert windows ───────── */
export const ALERT_WINDOW_DAYS = {
  WARRANTY_EXPIRING: 60,
  LEASE_EXPIRING: 60,
  LICENSE_EXPIRING: 60,
  MAINTENANCE_DUE: 7,
} as const;
