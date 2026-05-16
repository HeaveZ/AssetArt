"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/backend/db";
import { requireSession } from "@/backend/session";
import {
  changePasswordSchema,
  signInSchema,
  signUpSchema,
  updateProfileSchema,
} from "@/shared/schemas/auth";
import type { ActionResult } from "@/shared/types";

export async function signInWithCredentials(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const raw = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: issue?.path?.[0]?.toString(),
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" };
    }
    throw error;
  }

  return { ok: true, data: { redirectTo: "/dashboard" } };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  if (process.env.AUTH_ALLOW_SIGNUP !== "true") {
    return { ok: false, error: "Open registration is disabled. Ask an admin to invite you." };
  }

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    workspaceName: String(formData.get("workspaceName") ?? "").trim(),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: issue?.path?.[0]?.toString(),
    };
  }

  const { name, email, password, workspaceName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  await prisma.workspace.create({
    data: {
      name: workspaceName,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      users: {
        create: {
          email,
          name,
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // Ignore — they can sign in manually
  }

  return { ok: true, data: { redirectTo: "/dashboard" } };
}

/**
 * Change the signed-in user's password.
 *
 * Security:
 * - Re-verifies the current password using bcrypt.compare before re-hashing.
 * - Returns a generic "incorrect" error instead of leaking which field failed
 *   (prevents enumeration / oracle attacks).
 * - Hashes with cost 12 (matches registration).
 * - Bumps updatedAt to nudge session refresh on next read.
 */
export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: issue?.path?.[0]?.toString(),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true, deletedAt: true },
  });

  if (!user || user.deletedAt || !user.passwordHash) {
    return { ok: false, error: "Could not verify account" };
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Current password is incorrect", field: "currentPassword" };
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, updatedAt: new Date() },
  });

  return { ok: true, data: undefined };
}

/**
 * Update the signed-in user's display name / avatar URL.
 *
 * Security:
 * - Always operates on session.userId; the caller cannot pass an id.
 * - Avatar URL is validated to be a valid URL with a length cap, defending
 *   against payloads that try to break the rendering layer.
 */
export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireSession();

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    image: String(formData.get("image") ?? "").trim(),
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Invalid input",
      field: issue?.path?.[0]?.toString(),
    };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: parsed.data.name,
      image: parsed.data.image ? parsed.data.image : null,
    },
  });

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
