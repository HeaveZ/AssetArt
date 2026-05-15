"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/backend/db";
import { signInSchema, signUpSchema } from "@/shared/schemas/auth";
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
