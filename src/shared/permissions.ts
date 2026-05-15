import type { Role } from "@prisma/client";

/** All known permission strings — extend as features are added. */
export const PERMISSIONS = [
  "asset.read",
  "asset.create",
  "asset.update",
  "asset.delete",
  "asset.dispose",
  "asset.import",
  "asset.export",
  "checkout.create",
  "checkout.return",
  "maintenance.read",
  "maintenance.create",
  "maintenance.update",
  "lease.read",
  "lease.create",
  "lease.update",
  "lease.delete",
  "license.read",
  "license.create",
  "license.update",
  "license.delete",
  "alert.read",
  "alert.dismiss",
  "settings.read",
  "settings.update",
  "users.read",
  "users.invite",
  "users.update",
  "users.delete",
  "report.read",
  "report.export",
  "savedview.create",
  "savedview.update",
  "savedview.delete",
  "floorplan.read",
  "floorplan.update",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const VIEWER_PERMS: Permission[] = [
  "asset.read",
  "maintenance.read",
  "lease.read",
  "license.read",
  "alert.read",
  "report.read",
  "settings.read",
  "savedview.create",
  "floorplan.read",
];

const MEMBER_PERMS: Permission[] = [
  ...VIEWER_PERMS,
  "asset.export",
  "checkout.create",
  "checkout.return",
  "alert.dismiss",
  "savedview.update",
  "savedview.delete",
];

const MANAGER_PERMS: Permission[] = [
  ...MEMBER_PERMS,
  "asset.create",
  "asset.update",
  "asset.import",
  "maintenance.create",
  "maintenance.update",
  "lease.create",
  "lease.update",
  "license.create",
  "license.update",
  "report.export",
  "floorplan.update",
];

const ADMIN_PERMS: Permission[] = [
  ...MANAGER_PERMS,
  "asset.delete",
  "asset.dispose",
  "lease.delete",
  "license.delete",
  "settings.update",
  "users.read",
  "users.invite",
  "users.update",
];

const OWNER_PERMS: Permission[] = [...ADMIN_PERMS, "users.delete"];

const ROLE_PERMS: Record<Role, ReadonlySet<Permission>> = {
  VIEWER: new Set(VIEWER_PERMS),
  MEMBER: new Set(MEMBER_PERMS),
  MANAGER: new Set(MANAGER_PERMS),
  ADMIN: new Set(ADMIN_PERMS),
  OWNER: new Set(OWNER_PERMS),
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMS[role]?.has(permission) ?? false;
}

export class PermissionError extends Error {
  constructor(permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionError";
  }
}

export function requirePermission(role: Role | null | undefined, permission: Permission): void {
  if (!can(role, permission)) throw new PermissionError(permission);
}
