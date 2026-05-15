"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  ChevronsUpDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Logo } from "@/frontend/components/app/logo";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Badge } from "@/frontend/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { NAV } from "@/frontend/lib/navigation";
import { cn } from "@/frontend/lib/utils";
import { ROLE_META } from "@/shared/constants";
import { signOutAction } from "@/backend/actions/auth";
import type { ActiveSession } from "@/backend/session";

interface Props {
  workspace: { name: string; siteCount: number };
  session: ActiveSession;
}

export function AppSidebar({ workspace, session }: Props) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className="bg-brand-navy-900 fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col text-white lg:flex"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo + workspace */}
      <div className="border-white/[0.06] border-b px-4 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <Logo />
        </div>
        <button
          type="button"
          className={cn(
            "group/ws mt-3.5 flex w-full items-center gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.025] px-2 py-2",
            "text-left transition-colors duration-150 hover:bg-white/[0.05]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/50",
          )}
        >
          <span className="from-brand-navy-700 to-brand-navy-500 flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-white">{workspace.name}</p>
            <p className="text-brand-navy-200 truncate text-[10.5px]">
              {workspace.siteCount} {workspace.siteCount === 1 ? "site" : "sites"}
            </p>
          </div>
          <ChevronsUpDown className="text-brand-navy-200 group-hover/ws:text-white h-3.5 w-3.5 shrink-0 transition-colors" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="text-brand-navy-200/70 px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "group/item relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5",
                        "text-[12.5px] font-medium transition-colors duration-150",
                        "outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
                        isActive
                          ? "text-white"
                          : "text-brand-navy-100/85 hover:text-white",
                      )}
                    >
                      {isActive ? (
                        <motion.span
                          layoutId="sidebar-active-bg"
                          className="absolute inset-0 -z-0 rounded-md"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(245,147,62,0.16) 0%, rgba(245,147,62,0.04) 60%, transparent 100%)",
                          }}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      ) : null}
                      {isActive ? (
                        <motion.span
                          layoutId="sidebar-active-accent"
                          className="absolute -left-2.5 top-1.5 bottom-1.5 w-[2px] rounded-r-full"
                          style={{
                            background:
                              "linear-gradient(180deg, var(--color-brand-orange-500), var(--color-brand-orange-600))",
                          }}
                          transition={{ type: "spring", stiffness: 480, damping: 32 }}
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "relative z-10 h-3.5 w-3.5 shrink-0 transition-colors",
                          isActive ? "text-brand-orange-300" : "text-brand-navy-200/70",
                          "group-hover/item:text-brand-orange-200",
                        )}
                        strokeWidth={2}
                      />
                      <span className="relative z-10 flex-1 truncate">{item.label}</span>
                      <AnimatePresence>
                        {item.badge ? (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge
                              tone={item.badge === "new" ? "orange" : "muted"}
                              size="sm"
                              className="relative z-10"
                            >
                              {item.badge}
                            </Badge>
                          </motion.span>
                        ) : null}
                        {!item.badge && item.shortcut && hoveredItem === item.href ? (
                          <motion.kbd
                            initial={{ opacity: 0, x: 4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 4 }}
                            className="relative z-10 border-white/10 bg-white/[0.04] text-brand-navy-200/80 text-[9.5px]"
                            transition={{ duration: 0.15 }}
                          >
                            {item.shortcut}
                          </motion.kbd>
                        ) : null}
                      </AnimatePresence>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-white/[0.06] border-t p-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "group/user flex w-full items-center gap-2.5 rounded-md px-2 py-2",
                "transition-colors duration-150 hover:bg-white/[0.05]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
              )}
            >
              <UserAvatar name={session.name ?? session.email} src={session.image} size={28} />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[12.5px] font-medium text-white">
                  {session.name ?? session.email}
                </p>
                <p className="text-brand-navy-200 truncate text-[10.5px]">{ROLE_META[session.role].label}</p>
              </div>
              <ChevronsUpDown className="text-brand-navy-200 group-hover/user:text-white h-3.5 w-3.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-[220px]">
            <DropdownMenuLabel>{session.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <User /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings /> Workspace settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              Toggle theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-danger-fg hover:bg-danger-bg/40 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
