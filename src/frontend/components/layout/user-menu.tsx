"use client";

import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { ROLE_META } from "@/shared/constants";
import { signOutAction } from "@/backend/actions/auth";
import type { Role } from "@prisma/client";

interface Props {
  name: string | null;
  email: string;
  image: string | null;
  role: Role;
}

export function UserMenu({ name, email, image, role }: Props) {
  const { setTheme, resolvedTheme } = useTheme();
  const displayName = name ?? email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="group/user bg-surface hover:bg-surface-muted/70 text-text-muted hover:text-text flex h-8 items-center gap-2 rounded-md border pl-1 pr-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
        >
          <UserAvatar name={displayName} src={image} size={24} />
          <span className="text-text hidden text-[12.5px] font-medium md:inline-block">
            {displayName}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 transition-transform group-data-[state=open]/user:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-[260px]">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
          <UserAvatar name={displayName} src={image} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-text truncate text-[12.5px] font-medium">{displayName}</p>
            <p className="text-text-subtle truncate text-[11px]">{email}</p>
            <p className="text-text-subtle text-[10.5px] uppercase tracking-[0.06em]">
              {ROLE_META[role].label}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <User /> My profile
            <span className="text-text-subtle ml-auto text-[10.5px]">Name &amp; avatar</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/password">
            <KeyRound /> Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/account">
            <Shield /> Account details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings/billing">
            <CreditCard /> Subscription plans
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
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
  );
}
