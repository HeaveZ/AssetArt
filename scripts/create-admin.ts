// ─────────────────────────────────────────────────────────────────────────────
// AssetNova — bootstrap admin user
//
// Seed prod'da yasak (prisma/seed.ts NODE_ENV=production'da throw eder),
// bu script ise prod'da bootstrap için. İlk Workspace + OWNER kullanıcısını
// upsert eder. Idempotent — tekrar çalıştırılırsa hash/role günceller.
//
// Container içinde çalıştırılması:
//   docker exec -i \
//     -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e ADMIN_NAME=... \
//     -e WORKSPACE_NAME=... -e WORKSPACE_SLUG=... \
//     assetnova-app node node_modules/tsx/dist/cli.mjs /tmp/create-admin.ts
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrator";
  const workspaceName = process.env.WORKSPACE_NAME ?? "Evam Tech";
  const workspaceSlug = process.env.WORKSPACE_SLUG ?? "evam-tech";

  if (!email) throw new Error("ADMIN_EMAIL is required");
  if (!password) throw new Error("ADMIN_PASSWORD is required");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 chars");

  const workspace = await prisma.workspace.upsert({
    where: { slug: workspaceSlug },
    update: {},
    create: { name: workspaceName, slug: workspaceSlug },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "OWNER", name },
    create: {
      email,
      name,
      passwordHash,
      role: "OWNER",
      workspaceId: workspace.id,
    },
  });

  console.log(`OK workspace=${workspace.slug} user=${user.email} role=${user.role}`);
}

main()
  .catch((err) => {
    console.error("create-admin failed:", err.message ?? err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
