import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type AssetStatus, type Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seeding");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SEED_USERS: Array<{
  email: string;
  name: string;
  role: Role;
  password: string;
}> = [
  { email: "ibrahim@evam.com",   name: "Ibrahim Bekar",   role: "OWNER",   password: "Evam!2026" },
  { email: "elif@evam.com",      name: "Elif Demir",       role: "ADMIN",   password: "Evam!2026" },
  { email: "kerem@evam.com",     name: "Kerem Aksoy",      role: "ADMIN",   password: "Evam!2026" },
  { email: "deniz@evam.com",     name: "Deniz Yıldız",     role: "MANAGER", password: "Evam!2026" },
  { email: "selin@evam.com",     name: "Selin Kaya",       role: "MANAGER", password: "Evam!2026" },
  { email: "burak@evam.com",     name: "Burak Şahin",      role: "MEMBER",  password: "Evam!2026" },
  { email: "ayse@evam.com",      name: "Ayşe Çelik",       role: "MEMBER",  password: "Evam!2026" },
  { email: "mehmet@evam.com",    name: "Mehmet Arslan",    role: "VIEWER",  password: "Evam!2026" },
];

const SITE_DATA = [
  { name: "HQ Istanbul",   code: "IST", address: "Maslak, Istanbul, TR", timezone: "Europe/Istanbul",
    locations: ["Floor 12 — Engineering", "Floor 11 — Operations", "Storage room"] },
  { name: "Ankara Office", code: "ANK", address: "Çankaya, Ankara, TR", timezone: "Europe/Istanbul",
    locations: ["Floor 3 — Sales", "Floor 3 — Storage"] },
  { name: "Remote",        code: "RMT", address: "Distributed",          timezone: "UTC",
    locations: ["Home office"] },
];

const DEPARTMENTS = [
  { name: "Engineering", code: "ENG" },
  { name: "Product",     code: "PRD" },
  { name: "Operations",  code: "OPS" },
  { name: "Finance",     code: "FIN" },
  { name: "People",      code: "PPL" },
];

const FIRST_NAMES = ["Ali","Zeynep","Can","Naz","Ege","Lara","Onur","Defne","Eren","Berk","Cem","Pınar","Tuna","Beren","Ozan","Sıla","Mert","Ada","Hakan","Ela","Doruk","Mira","Tarık","Yara","Ahmet"];
const LAST_NAMES  = ["Yılmaz","Demir","Aydın","Kara","Şahin","Çelik","Korkmaz","Erdem","Bulut","Tunç","Polat","Genç","Aslan","Doğan","Koç","Aktaş","Güneş","Soylu","Eren","Bayar","Acar","Mutlu","Türk","Öz","Kaya"];

const ASSET_BRANDS_LAPTOP = ["Apple","Dell","Lenovo","HP","Asus"];
const ASSET_MODELS_LAPTOP: Record<string, string[]> = {
  Apple:  ["MacBook Pro 16 M3", "MacBook Air 15 M2", "MacBook Pro 14 M3"],
  Dell:   ["XPS 15 9530", "Latitude 7440", "Precision 5560"],
  Lenovo: ["ThinkPad X1 Carbon Gen 11", "ThinkPad T14s", "Legion 5 Pro"],
  HP:     ["EliteBook 845 G10", "ZBook Firefly 14", "Pavilion Plus 14"],
  Asus:   ["ZenBook 14 OLED", "ROG Zephyrus G14", "ExpertBook B5"],
};
const ASSET_BRANDS_PHONE = ["Apple","Samsung","Google"];
const ASSET_MODELS_PHONE: Record<string, string[]> = {
  Apple:   ["iPhone 15 Pro", "iPhone 15", "iPhone 14"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy Z Flip5"],
  Google:  ["Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
};
const ASSET_BRANDS_MONITOR = ["Dell","LG","Samsung","BenQ"];
const ASSET_MODELS_MONITOR: Record<string, string[]> = {
  Dell:    ["UltraSharp U2723QE", "UltraSharp U3223QE", "U2422HE"],
  LG:      ["27UP850-W", "32UN880-B", "34WK95U-W"],
  Samsung: ["Odyssey G7", "ViewFinity S9"],
  BenQ:    ["PD2725U", "PD3220U"],
};

function rand<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] as T;
}

function dateAdd(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function pad(n: number, len: number): string {
  return n.toString().padStart(len, "0");
}

async function main() {
  console.info("🌱 Seeding Evam Assets…");

  // ───────── Reset (idempotent) ─────────
  console.info("  ↻ wiping existing data");
  await prisma.commandLog.deleteMany().catch(() => undefined);
  await prisma.auditLog.deleteMany().catch(() => undefined);
  await prisma.alert.deleteMany().catch(() => undefined);
  await prisma.floorPlanPin.deleteMany().catch(() => undefined);
  await prisma.floorPlan.deleteMany().catch(() => undefined);
  await prisma.savedView.deleteMany().catch(() => undefined);
  await prisma.customFieldDefinition.deleteMany().catch(() => undefined);
  await prisma.maintenanceRecord.deleteMany().catch(() => undefined);
  await prisma.checkout.deleteMany().catch(() => undefined);
  await prisma.lease.deleteMany().catch(() => undefined);
  await prisma.license.deleteMany().catch(() => undefined);
  await prisma.assetPhoto.deleteMany().catch(() => undefined);
  await prisma.asset.deleteMany().catch(() => undefined);
  await prisma.category.deleteMany().catch(() => undefined);
  await prisma.person.deleteMany().catch(() => undefined);
  await prisma.customer.deleteMany().catch(() => undefined);
  await prisma.department.deleteMany().catch(() => undefined);
  await prisma.location.deleteMany().catch(() => undefined);
  await prisma.site.deleteMany().catch(() => undefined);
  await prisma.session.deleteMany().catch(() => undefined);
  await prisma.account.deleteMany().catch(() => undefined);
  await prisma.verificationToken.deleteMany().catch(() => undefined);
  await prisma.user.deleteMany().catch(() => undefined);
  await prisma.workspace.deleteMany().catch(() => undefined);

  // ───────── Workspace ─────────
  console.info("  ✓ workspace");
  const workspace = await prisma.workspace.create({
    data: {
      name: "Evam Tech",
      slug: "evam-tech",
      currency: "USD",
      timezone: "Europe/Istanbul",
      fiscalYearStart: 1,
    },
  });

  // ───────── Users ─────────
  console.info("  ✓ users");
  const users = await Promise.all(
    SEED_USERS.map(async (u) =>
      prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: await bcrypt.hash(u.password, 12),
          role: u.role,
          workspaceId: workspace.id,
          emailVerified: new Date(),
        },
      }),
    ),
  );
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));
  const ibrahim = userByEmail["ibrahim@evam.com"]!;

  // ───────── Sites + Locations ─────────
  console.info("  ✓ sites + locations");
  const sites: Awaited<ReturnType<typeof prisma.site.create>>[] = [];
  const locations: Awaited<ReturnType<typeof prisma.location.create>>[] = [];
  for (const s of SITE_DATA) {
    const site = await prisma.site.create({
      data: {
        workspaceId: workspace.id,
        name: s.name,
        code: s.code,
        address: s.address,
        timezone: s.timezone,
      },
    });
    sites.push(site);
    for (const locName of s.locations) {
      const loc = await prisma.location.create({
        data: { siteId: site.id, name: locName },
      });
      locations.push(loc);
    }
  }

  // ───────── Departments ─────────
  console.info("  ✓ departments");
  const departments = await Promise.all(
    DEPARTMENTS.map((d) =>
      prisma.department.create({ data: { ...d, workspaceId: workspace.id } }),
    ),
  );

  // ───────── People ─────────
  console.info("  ✓ people (25)");
  const people: Awaited<ReturnType<typeof prisma.person.create>>[] = [];
  for (let i = 0; i < 25; i++) {
    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    const dept = rand(departments);
    const person = await prisma.person.create({
      data: {
        workspaceId: workspace.id,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@evam.com`.replace(/[^a-z0-9.@]/g, ""),
        employeeId: `EMP-${pad(1000 + i, 4)}`,
        jobTitle: rand(["Engineer","Designer","Analyst","Coordinator","Specialist","Lead"]),
        departmentId: dept.id,
      },
    });
    people.push(person);
  }

  // ───────── Customers ─────────
  console.info("  ✓ customers");
  await Promise.all([
    prisma.customer.create({ data: { workspaceId: workspace.id, name: "Acme Logistics",  contactName: "Sarah Park", contactEmail: "sarah@acme.example" } }),
    prisma.customer.create({ data: { workspaceId: workspace.id, name: "Northwind Retail", contactName: "Mark Vega", contactEmail: "mark@nw.example" } }),
  ]);

  // ───────── Categories ─────────
  console.info("  ✓ categories");
  const catLaptops = await prisma.category.create({ data: { workspaceId: workspace.id, name: "Laptops", icon: "laptop" } });
  const catMac     = await prisma.category.create({ data: { workspaceId: workspace.id, name: "Mac",     parentId: catLaptops.id, icon: "apple" } });
  const catPC      = await prisma.category.create({ data: { workspaceId: workspace.id, name: "PC",      parentId: catLaptops.id, icon: "monitor" } });
  const catPhones  = await prisma.category.create({ data: { workspaceId: workspace.id, name: "Phones",  icon: "smartphone" } });
  const catMonitors= await prisma.category.create({ data: { workspaceId: workspace.id, name: "Monitors",icon: "monitor" } });
  const catPeri    = await prisma.category.create({ data: { workspaceId: workspace.id, name: "Peripherals", icon: "keyboard" } });

  const allCategories = [catMac, catPC, catPhones, catMonitors, catPeri];

  // ───────── Assets ─────────
  console.info("  ✓ assets (60)");
  const now = new Date();
  const statusPlan: AssetStatus[] = [
    ...Array.from({ length: 20 }, () => "CHECKED_OUT" as const),
    ...Array.from({ length: 25 }, () => "AVAILABLE" as const),
    ...Array.from({ length: 5 },  () => "IN_MAINTENANCE" as const),
    ...Array.from({ length: 5 },  () => "LEASED" as const),
    ...Array.from({ length: 3 },  () => "RESERVED" as const),
    ...Array.from({ length: 2 },  () => "DISPOSED" as const),
  ];

  const assets: Awaited<ReturnType<typeof prisma.asset.create>>[] = [];
  for (let i = 0; i < 60; i++) {
    const status = statusPlan[i] ?? "AVAILABLE";
    const cat = rand(allCategories);
    let brand: string;
    let model: string;
    let mem = 16;
    let storage = 512;
    let display = 0;
    let cpu = "";
    if (cat.id === catMac.id || cat.id === catPC.id) {
      brand = rand(ASSET_BRANDS_LAPTOP);
      model = rand(ASSET_MODELS_LAPTOP[brand]!);
      mem = rand([8, 16, 24, 32, 64]);
      storage = rand([256, 512, 1000, 2000]);
      display = rand([13.6, 14, 15.3, 16]);
      cpu = brand === "Apple" ? rand(["M3","M3 Pro","M3 Max"]) : rand(["Intel i7","Intel i9","Ryzen 7","Ryzen 9"]);
    } else if (cat.id === catPhones.id) {
      brand = rand(ASSET_BRANDS_PHONE);
      model = rand(ASSET_MODELS_PHONE[brand]!);
      mem = rand([6, 8, 12]);
      storage = rand([128, 256, 512]);
      display = rand([6.1, 6.7]);
    } else if (cat.id === catMonitors.id) {
      brand = rand(ASSET_BRANDS_MONITOR);
      model = rand(ASSET_MODELS_MONITOR[brand]!);
      display = rand([27, 32, 34]);
    } else {
      brand = rand(["Logitech","Keychron","Apple","Razer"]);
      model = rand(["MX Master 3S","Q1 Pro","Magic Mouse","DeathAdder V3"]);
    }

    const site = rand(sites);
    const siteLocs = locations.filter((l) => l.siteId === site.id);
    const location = siteLocs.length > 0 ? rand(siteLocs) : null;
    const assignee = status === "CHECKED_OUT" ? rand(users) : null;
    const purchaseDate = dateAdd(now, -rand([60, 120, 240, 365, 540, 720, 900]));
    const purchasePrice = brand === "Apple" ? rand([1899, 2399, 3199, 3799]) : rand([899, 1299, 1799, 2299]);
    const warrantyEndsAt = dateAdd(purchaseDate, 365 * rand([1, 2, 3]));

    const asset = await prisma.asset.create({
      data: {
        workspaceId: workspace.id,
        tag: `E${pad(1400 + i, 4)}`,
        name: `${brand} ${model}`,
        brand,
        model,
        serialNumber: `${brand.slice(0,3).toUpperCase()}-${pad(100000 + i, 7)}`,
        categoryId: cat.id,
        siteId: site.id,
        locationId: location?.id ?? null,
        assigneeId: assignee?.id ?? null,
        status,
        purchaseDate,
        purchasePrice,
        warrantyEndsAt,
        cpu: cpu || null,
        memoryGB: mem,
        storageGB: storage,
        displayInches: display || null,
        os: cat.id === catPhones.id ? (brand === "Apple" ? "iOS 17" : "Android 14") : brand === "Apple" ? "macOS 14" : "Windows 11 Pro",
        notes: i % 7 === 0 ? "Refurbished unit. Battery health check scheduled." : null,
      },
    });
    assets.push(asset);
  }

  // ───────── Checkouts ─────────
  console.info("  ✓ checkouts (15)");
  const checkoutAssets = assets.filter((a) => a.status === "CHECKED_OUT").slice(0, 15);
  for (const asset of checkoutAssets) {
    const person = rand(people);
    const due = dateAdd(now, rand([14, 30, 60, 90]));
    await prisma.checkout.create({
      data: {
        assetId: asset.id,
        toType: "PERSON",
        toPersonId: person.id,
        checkedOutBy: ibrahim.id,
        checkedOutAt: dateAdd(now, -rand([1, 5, 14, 30])),
        dueAt: due,
        notes: "Standard hardware allocation.",
      },
    });
  }

  // ───────── Maintenance ─────────
  console.info("  ✓ maintenance (6)");
  const maintenanceAssets = assets.filter((a) => a.status === "IN_MAINTENANCE").slice(0, 5);
  const extraOne = assets.filter((a) => a.status === "AVAILABLE")[0]!;
  const maintenanceTargets = [...maintenanceAssets, extraOne];
  const maintenanceStatuses = ["SCHEDULED","IN_PROGRESS","COMPLETED","SCHEDULED","IN_PROGRESS","COMPLETED"] as const;
  for (let i = 0; i < maintenanceTargets.length; i++) {
    const asset = maintenanceTargets[i]!;
    const status = maintenanceStatuses[i] ?? "SCHEDULED";
    await prisma.maintenanceRecord.create({
      data: {
        assetId: asset.id,
        type: rand(["PREVENTIVE","CORRECTIVE","INSPECTION","CALIBRATION"]),
        status,
        scheduledAt: dateAdd(now, rand([-14, -7, 3, 7, 14])),
        completedAt: status === "COMPLETED" ? dateAdd(now, -rand([1, 7])) : null,
        cost: status === "COMPLETED" ? rand([120, 240, 360, 480]) : null,
        vendor: rand(["TechFix Inc","Apple Premium Service","DellPro Care"]),
        description: rand(["Battery replacement","Screen repair","Annual checkup","Calibration after move"]),
        createdBy: ibrahim.id,
      },
    });
  }

  // ───────── Leases ─────────
  console.info("  ✓ leases (4)");
  const leaseAssets = assets.filter((a) => a.status === "LEASED").slice(0, 4);
  for (let i = 0; i < leaseAssets.length; i++) {
    const asset = leaseAssets[i]!;
    const startDate = dateAdd(now, -rand([90, 180, 365]));
    const endDate   = dateAdd(now, rand([45, 60, 120, 365]));
    await prisma.lease.create({
      data: {
        assetId: asset.id,
        vendor: rand(["LeasePro Finance","CloudLease","TechRent"]),
        contractRef: `LE-${pad(2000 + i, 4)}`,
        startDate,
        endDate,
        monthlyCost: rand([69, 119, 149, 199]),
        currency: "USD",
        autoRenew: i % 2 === 0,
        status: endDate.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 60 ? "EXPIRING" : "ACTIVE",
      },
    });
  }

  // ───────── Licenses ─────────
  console.info("  ✓ licenses (3)");
  await prisma.license.createMany({
    data: [
      { workspaceId: workspace.id, name: "Microsoft 365 Business Premium", vendor: "Microsoft", seats: 50, seatsUsed: 38, cost: 22, currency: "USD", startDate: dateAdd(now, -180), endDate: dateAdd(now, 45), status: "EXPIRING" },
      { workspaceId: workspace.id, name: "Figma Org",                       vendor: "Figma",     seats: 30, seatsUsed: 27, cost: 45, currency: "USD", startDate: dateAdd(now, -365), endDate: dateAdd(now, 200), status: "ACTIVE" },
      { workspaceId: workspace.id, name: "GitHub Enterprise",               vendor: "GitHub",    seats: 25, seatsUsed: 22, cost: 21, currency: "USD", startDate: dateAdd(now, -90),  endDate: dateAdd(now, 275), status: "ACTIVE" },
    ],
  });

  // ───────── Alerts ─────────
  console.info("  ✓ alerts (8)");
  const expiringWarrantyAsset = assets[3]!;
  const expiringLeaseAsset    = leaseAssets[0];
  const overdueAsset          = checkoutAssets[0];

  await prisma.alert.createMany({
    data: [
      { workspaceId: workspace.id, type: "WARRANTY_EXPIRING", severity: "WARNING",  title: `Warranty for ${expiringWarrantyAsset.tag} expires soon`, message: `Warranty ends on ${expiringWarrantyAsset.warrantyEndsAt?.toISOString().slice(0,10) ?? ""}`, resourceType: "asset", resourceId: expiringWarrantyAsset.id },
      { workspaceId: workspace.id, type: "LICENSE_EXPIRING",  severity: "CRITICAL", title: "Microsoft 365 expires in 45 days", message: "Renew or downgrade seats before expiry.", resourceType: "license", resourceId: "" },
      { workspaceId: workspace.id, type: "MAINTENANCE_DUE",   severity: "WARNING",  title: "3 preventive maintenance jobs due this week", message: "Schedule slots before Friday.", resourceType: "maintenance", resourceId: "" },
      ...(expiringLeaseAsset ? [{ workspaceId: workspace.id, type: "LEASE_EXPIRING" as const, severity: "WARNING" as const, title: `Lease for ${expiringLeaseAsset.tag} expiring`, message: "Confirm renewal or return.", resourceType: "lease", resourceId: expiringLeaseAsset.id }] : []),
      ...(overdueAsset ? [{ workspaceId: workspace.id, type: "ASSET_OVERDUE" as const, severity: "CRITICAL" as const, title: `Asset ${overdueAsset.tag} is overdue`, message: "Holder has not returned on time.", resourceType: "asset", resourceId: overdueAsset.id }] : []),
      { workspaceId: workspace.id, type: "WARRANTY_EXPIRING", severity: "INFO",     title: "5 assets within 60 days of warranty end", message: "Group renewal recommended.", resourceType: "asset", resourceId: "" },
      { workspaceId: workspace.id, type: "MAINTENANCE_DUE",   severity: "INFO",     title: "Quarterly inspection batch ready",        message: "Auto-generated for all laptops over 24 months old.", resourceType: "maintenance", resourceId: "" },
      { workspaceId: workspace.id, type: "ASSET_MISSING",     severity: "WARNING",  title: "1 asset unscanned in 90 days",              message: "Run a floor sweep in Istanbul HQ.", resourceType: "asset", resourceId: "" },
    ],
  });

  // ───────── Audit log ─────────
  console.info("  ✓ audit log (~80)");
  const auditPayload: { workspaceId: string; actorId: string; action: string; resourceType: string; resourceId: string; payload?: object }[] = [];
  for (const a of assets) {
    auditPayload.push({
      workspaceId: workspace.id,
      actorId: ibrahim.id,
      action: "asset.created",
      resourceType: "asset",
      resourceId: a.id,
      payload: { tag: a.tag, name: a.name },
    });
  }
  for (const a of checkoutAssets) {
    auditPayload.push({
      workspaceId: workspace.id,
      actorId: rand(users).id,
      action: "asset.checked_out",
      resourceType: "asset",
      resourceId: a.id,
      payload: { tag: a.tag },
    });
  }
  await prisma.auditLog.createMany({ data: auditPayload });

  console.info(`\n✅ Seed complete · Workspace "${workspace.name}" · ${users.length} users · ${assets.length} assets`);
  console.info("Login: ibrahim@evam.com / Evam!2026\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
