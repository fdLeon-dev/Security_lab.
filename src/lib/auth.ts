import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/server/modules/audit/audit.service";

async function safeAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
  } catch {
    // Audit should never block authentication flow
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          await safeAuditLog({
            action: "SIGNIN_FAILED",
            resource: "auth",
            resourceId: null,
          });
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          await safeAuditLog({
            action: "SIGNIN_FAILED",
            resource: "auth",
            resourceId: credentials.email,
          });
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          await safeAuditLog({
            action: "SIGNIN_FAILED",
            resource: "auth",
            userId: user.id,
          });
          return null;
        }

        await safeAuditLog({
          action: "SIGNIN_SUCCESS",
          resource: "auth",
          userId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      await safeAuditLog({
        action: "SIGNOUT",
        resource: "auth",
        userId: typeof message.token?.userId === "string" ? message.token.userId : null,
      });
    },
  },
};
