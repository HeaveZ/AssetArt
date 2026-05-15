import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/backend/db";
import { authConfig } from "@/auth.config";
import { signInSchema } from "@/shared/schemas/auth";

const useResend = Boolean(process.env.RESEND_API_KEY);

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            workspaceId: true,
            passwordHash: true,
            deletedAt: true,
          },
        });

        if (!user || user.deletedAt || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // best-effort, ignore errors
        prisma.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => undefined);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          workspaceId: user.workspaceId,
        };
      },
    }),
    ...(useResend
      ? [
          Resend({
            from: process.env.EMAIL_FROM ?? "no-reply@evam.local",
            apiKey: process.env.RESEND_API_KEY,
          }),
        ]
      : []),
  ],
});
