/**
 * One-shot helper to upsert a test user — bypasses the registration schema
 * (which enforces strong passwords). DEV / LOCAL ONLY.
 *
 * Run:  pnpm tsx scripts/upsert-test-user.ts
 *
 * Defaults can be overridden via env vars:
 *   TEST_USER_EMAIL=foo@bar.com TEST_USER_PASSWORD=secret pnpm tsx scripts/upsert-test-user.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const email = (process.env.TEST_USER_EMAIL ?? "ibrahim@evam.com").toLowerCase();
const password = process.env.TEST_USER_PASSWORD ?? "EvamAssetArt!2026";
const name = process.env.TEST_USER_NAME ?? "Ibrahim (Evam)";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run in production");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  try {
    const ws = await prisma.workspace.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });
    if (!ws) {
      throw new Error("No workspace exists — run `pnpm db:seed` first.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        deletedAt: null,
        emailVerified: new Date(),
      },
      create: {
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
        role: "ADMIN",
        workspaceId: ws.id,
      },
      select: { id: true, email: true, role: true, workspace: { select: { name: true } } },
    });

    // eslint-disable-next-line no-console
    console.log("✅ Upserted user:");
    // eslint-disable-next-line no-console
    console.log(`   email:     ${user.email}`);
    // eslint-disable-next-line no-console
    console.log(`   password:  ${password}`);
    // eslint-disable-next-line no-console
    console.log(`   role:      ${user.role}`);
    // eslint-disable-next-line no-console
    console.log(`   workspace: ${user.workspace.name}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Failed:", err);
  process.exit(1);
});
