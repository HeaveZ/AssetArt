import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  History,
  Image as ImageIcon,
  Pencil,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/app/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { AssetDetailHero } from "@/frontend/components/app/assets/asset-detail-hero";
import { EmptyState } from "@/frontend/components/app/empty-state";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { Badge } from "@/frontend/components/ui/badge";
import { AssetStatusBadge } from "@/frontend/components/app/status-badge";
import {
  ASSET_STATUS_META,
  LEASE_STATUS_META,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_TYPE_META,
} from "@/shared/constants";
import { getAssetDetail } from "@/backend/services/assets";
import { formatDate, formatDateTime, formatMoney, timeAgo } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Asset ${id.slice(-6)}` };
}

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.workspaceId) notFound();

  const asset = await getAssetDetail(session.user.workspaceId, id);
  if (!asset) notFound();

  const heroAsset = {
    id: asset.id,
    tag: asset.tag,
    name: asset.name,
    brand: asset.brand,
    model: asset.model,
    serialNumber: asset.serialNumber,
    status: asset.status,
    cpu: asset.cpu,
    memoryGB: asset.memoryGB,
    storageGB: asset.storageGB,
    displayInches: asset.displayInches ? asset.displayInches.toString() : null,
    os: asset.os,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice ? asset.purchasePrice.toString() : null,
    currency: asset.currency,
    warrantyEndsAt: asset.warrantyEndsAt,
    category: asset.category,
    site: asset.site,
    location: asset.location,
    assignee: asset.assignee,
  };

  const activeCheckout = asset.checkouts.find((c) => !c.returnedAt);

  return (
    <div className="space-y-5">
      <PageHeader title={asset.name} description={`Detail view for ${asset.tag}`} />

      <AssetDetailHero asset={heroAsset} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="px-0">
          <TabsTrigger value="overview"><ClipboardList /> Overview</TabsTrigger>
          <TabsTrigger value="history"><History /> History</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench /> Maintenance</TabsTrigger>
          <TabsTrigger value="lease"><ReceiptText /> Lease</TabsTrigger>
          <TabsTrigger value="photos"><ImageIcon /> Photos</TabsTrigger>
          <TabsTrigger value="audit"><Pencil /> Audit log</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <DetailCard title="About">
              <DetailRow label="Brand" value={asset.brand} />
              <DetailRow label="Model" value={asset.model} />
              <DetailRow label="Serial" value={asset.serialNumber} mono />
              <DetailRow label="OS" value={asset.os} />
              <DetailRow label="Category" value={asset.category?.name ?? null} />
            </DetailCard>
            <DetailCard title="Location & assignment">
              <DetailRow label="Site" value={asset.site?.name ?? null} />
              <DetailRow label="Location" value={asset.location?.name ?? null} />
              <DetailRow
                label="Assignee"
                value={asset.assignee?.name ?? asset.assignee?.email ?? null}
              />
              <DetailRow label="Status" value={ASSET_STATUS_META[asset.status].label} />
              {activeCheckout ? (
                <DetailRow label="Due" value={formatDate(activeCheckout.dueAt) ?? "—"} />
              ) : null}
            </DetailCard>
            <DetailCard title="Finance">
              <DetailRow label="Purchased" value={formatDate(asset.purchaseDate)} />
              <DetailRow label="Price" value={formatMoney(asset.purchasePrice, asset.currency)} />
              <DetailRow label="Currency" value={asset.currency} />
              <DetailRow label="Warranty ends" value={formatDate(asset.warrantyEndsAt)} />
            </DetailCard>
          </div>
          {asset.notes ? (
            <DetailCard title="Notes">
              <p className="text-text whitespace-pre-wrap text-[12.5px] leading-relaxed">{asset.notes}</p>
            </DetailCard>
          ) : null}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-3">
          {asset.checkouts.length === 0 ? (
            <EmptyState
              icon={History}
              title="No checkout history yet"
              description="Hand-offs to people, customers, or sites will show up here."
              compact
            />
          ) : (
            <ol className="bg-surface divide-y divide-border-subtle rounded-xl border">
              {asset.checkouts.map((co) => {
                const target =
                  co.toUser?.name ??
                  co.toUser?.email ??
                  (co.toPerson ? `${co.toPerson.firstName} ${co.toPerson.lastName}` : null) ??
                  co.toSite?.name ??
                  co.toCustomer?.name ??
                  "—";
                return (
                  <li key={co.id} className="flex items-start gap-3 px-4 py-3">
                    {co.returnedAt ? (
                      <ArrowDownToLine className="text-info-fg mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <ArrowUpFromLine className="text-success-fg mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-text text-[12.5px]">
                        <span className="font-medium">{co.returnedAt ? "Returned from" : "Checked out to"}</span>{" "}
                        <span className="text-text">{target}</span>
                      </p>
                      <p className="text-text-muted text-[11.5px]">
                        {formatDateTime(co.checkedOutAt)}
                        {co.dueAt ? ` · due ${formatDate(co.dueAt)}` : ""}
                        {co.returnedAt ? ` · returned ${formatDate(co.returnedAt)}` : ""}
                      </p>
                      {co.notes ? <p className="text-text-muted mt-1 text-[12px]">{co.notes}</p> : null}
                    </div>
                    <Badge tone={co.returnedAt ? "muted" : "success"} size="md">
                      {co.returnedAt ? "Returned" : "Active"}
                    </Badge>
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-3">
          {asset.maintenance.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No maintenance records"
              description="Schedule preventive, corrective, or inspection jobs."
              compact
            />
          ) : (
            <ol className="bg-surface divide-y divide-border-subtle rounded-xl border">
              {asset.maintenance.map((m) => {
                const typeMeta = MAINTENANCE_TYPE_META[m.type];
                const statusMeta = MAINTENANCE_STATUS_META[m.status];
                return (
                  <li key={m.id} className="flex items-start gap-3 px-4 py-3">
                    <Wrench className="text-warning-fg mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-text text-[12.5px] font-medium">{typeMeta.label}</span>
                        <Badge tone={statusMeta.tone === "muted" ? "muted" : statusMeta.tone} size="md">
                          {statusMeta.label}
                        </Badge>
                      </div>
                      <p className="text-text-muted mt-0.5 text-[11.5px]">
                        {m.scheduledAt ? `Scheduled ${formatDate(m.scheduledAt)}` : "Not scheduled"}
                        {m.completedAt ? ` · completed ${formatDate(m.completedAt)}` : ""}
                        {m.vendor ? ` · ${m.vendor}` : ""}
                      </p>
                      {m.description ? <p className="text-text mt-1 text-[12px]">{m.description}</p> : null}
                    </div>
                    {m.cost ? (
                      <span className="text-text num text-[12.5px] font-medium">
                        {formatMoney(m.cost.toString(), m.currency)}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>

        {/* Lease */}
        <TabsContent value="lease" className="space-y-3">
          {asset.lease ? (
            <DetailCard title={asset.lease.vendor}>
              <DetailRow label="Status" value={LEASE_STATUS_META[asset.lease.status].label} />
              <DetailRow label="Start" value={formatDate(asset.lease.startDate)} />
              <DetailRow label="End" value={formatDate(asset.lease.endDate)} />
              <DetailRow label="Monthly cost" value={formatMoney(asset.lease.monthlyCost.toString(), asset.lease.currency)} />
              <DetailRow label="Auto-renew" value={asset.lease.autoRenew ? "Yes" : "No"} />
              {asset.lease.notes ? (
                <p className="text-text mt-3 text-[12.5px] leading-relaxed">{asset.lease.notes}</p>
              ) : null}
            </DetailCard>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No lease attached"
              description="Track a lease vendor, term, and monthly cost for this asset."
              compact
            />
          )}
        </TabsContent>

        {/* Photos */}
        <TabsContent value="photos" className="space-y-3">
          {asset.photos.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No photos yet"
              description="Drag images here in milestone 4 to attach proof of condition."
              compact
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {asset.photos.map((p) => (
                <div key={p.id} className="bg-surface relative aspect-video overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="space-y-3">
          {asset.auditLogs.length === 0 ? (
            <EmptyState
              icon={Pencil}
              title="No audit entries"
              description="Every change to this asset will appear here."
              compact
            />
          ) : (
            <ol className="bg-surface divide-y divide-border-subtle rounded-xl border">
              {asset.auditLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <UserAvatar name={log.actor.name ?? log.actor.email} src={log.actor.image} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-text text-[12.5px]">
                      <span className="font-medium">{log.actor.name ?? log.actor.email}</span>{" "}
                      <span className="text-text-muted">{log.action}</span>
                    </p>
                    <p className="text-text-subtle text-[11px]">{timeAgo(log.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn("bg-surface rounded-xl border p-4")}>
      <h3 className="text-text-subtle mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em]">{title}</h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-text-muted shrink-0 text-[11.5px]">{label}</dt>
      <dd className={cn("text-text truncate text-right text-[12.5px]", mono && "font-mono text-[12px]")}>
        {value ?? "—"}
      </dd>
    </div>
  );
}
