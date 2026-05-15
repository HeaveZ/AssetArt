import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Boxes,
  ChartLine,
  FileChartColumn,
  KeyRound,
  LayoutDashboard,
  Map,
  PackageX,
  ReceiptText,
  Settings,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
  badge?: "soon" | "new" | "beta";
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
      { label: "Alerts", href: "/alerts", icon: AlertTriangle, shortcut: "G N" },
      { label: "Activity", href: "/activity", icon: Activity, shortcut: "G Y" },
    ],
  },
  {
    title: "Assets",
    items: [
      { label: "Assets", href: "/assets", icon: Boxes, shortcut: "G A" },
      { label: "Check out", href: "/checkout", icon: ArrowUpFromLine, shortcut: "G O" },
      { label: "Check in", href: "/checkin", icon: ArrowDownToLine, shortcut: "G I" },
      { label: "Transfer", href: "/transfer", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Maintenance", href: "/maintenance", icon: Wrench, shortcut: "G M" },
      { label: "Leases", href: "/leases", icon: ReceiptText, shortcut: "G L" },
      { label: "Licenses", href: "/licenses", icon: KeyRound },
      { label: "Floor map", href: "/floor-map", icon: Map, badge: "new" },
      { label: "Disposed", href: "/disposed", icon: PackageX },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", href: "/reports", icon: FileChartColumn, shortcut: "G R" },
      { label: "Forecast", href: "/forecast", icon: ChartLine, badge: "beta" },
      { label: "Settings", href: "/settings", icon: Settings, shortcut: "G S" },
    ],
  },
];

export function findActiveItem(pathname: string): NavItem | null {
  for (const section of NAV) {
    for (const item of section.items) {
      if (pathname === item.href) return item;
      if (item.href !== "/" && pathname.startsWith(`${item.href}/`)) return item;
    }
  }
  return null;
}
