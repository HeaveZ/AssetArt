import "server-only";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export type ActiveSession = {
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  workspaceId: string;
};

export async function getActiveSession(): Promise<ActiveSession | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
  };
}

export async function requireSession(): Promise<ActiveSession> {
  const session = await getActiveSession();
  if (!session) throw new SessionRequiredError();
  return session;
}

export class SessionRequiredError extends Error {
  constructor() {
    super("You must be signed in");
    this.name = "SessionRequiredError";
  }
}

export class NotFoundError extends Error {
  constructor(resource = "Resource") {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  fieldErrors?: Record<string, string[]>;
  constructor(message = "Validation failed", fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}
