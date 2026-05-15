import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/backend/db";

export type AssetPickRow = {
  id: string;
  tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: Prisma.AssetGetPayload<Record<string, never>>["status"];
  site: { id: string; name: string } | null;
  assignee: { id: string; name: string | null; email: string } | null;
  activeCheckoutId: string | null;
};

export type CheckoutTargetOptions = {
  users: { id: string; name: string | null; email: string; image: string | null }[];
  people: { id: string; firstName: string; lastName: string; email: string | null; jobTitle: string | null }[];
  sites: { id: string; name: string }[];
  customers: { id: string; name: string }[];
};

const ASSIGNABLE_STATUSES = ["AVAILABLE", "RESERVED"] as const;

export async function getAvailableAssets(workspaceId: string, q?: string): Promise<AssetPickRow[]> {
  const where: Prisma.AssetWhereInput = {
    workspaceId,
    deletedAt: null,
    status: { in: [...ASSIGNABLE_STATUSES] },
  };
  if (q?.trim()) {
    where.OR = [
      { tag: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { serialNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.asset.findMany({
    where,
    orderBy: [{ tag: "asc" }],
    take: 200,
    include: {
      site: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tag: r.tag,
    name: r.name,
    brand: r.brand,
    model: r.model,
    status: r.status,
    site: r.site,
    assignee: r.assignee,
    activeCheckoutId: null,
  }));
}

export async function getCheckedOutAssets(workspaceId: string, q?: string): Promise<AssetPickRow[]> {
  const where: Prisma.AssetWhereInput = {
    workspaceId,
    deletedAt: null,
    status: "CHECKED_OUT",
  };
  if (q?.trim()) {
    where.OR = [
      { tag: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
      { serialNumber: { contains: q, mode: "insensitive" } },
    ];
  }
  const rows = await prisma.asset.findMany({
    where,
    orderBy: [{ tag: "asc" }],
    take: 200,
    include: {
      site: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, email: true } },
      checkouts: {
        where: { returnedAt: null },
        orderBy: { checkedOutAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    tag: r.tag,
    name: r.name,
    brand: r.brand,
    model: r.model,
    status: r.status,
    site: r.site,
    assignee: r.assignee,
    activeCheckoutId: r.checkouts[0]?.id ?? null,
  }));
}

export async function getCheckoutTargetOptions(workspaceId: string): Promise<CheckoutTargetOptions> {
  const [users, people, sites, customers] = await Promise.all([
    prisma.user.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, email: true, image: true },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      where: { workspaceId },
      select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
      orderBy: [{ firstName: "asc" }],
    }),
    prisma.site.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.customer.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return { users, people, sites, customers };
}
