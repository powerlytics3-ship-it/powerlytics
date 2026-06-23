import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Role } from "@powerlytic/types";
import { sign as signJwt } from "jsonwebtoken";

const prisma = new PrismaClient();

async function loadUserAuthContext(userId: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { workspace: true },
        where: { status: "ACTIVE" }
      }
    }
  });

  if (!dbUser) return null;

  const roles = dbUser.memberships
    .map((membership) => membership.role)
    .filter((role): role is Role => Object.values(Role).includes(role as Role));

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    roles: roles.length ? Array.from(new Set(roles)) : [Role.VIEWER],
    workspaceId: dbUser.memberships[0]?.workspaceId ?? "",
    workspaceIds: dbUser.memberships.map((membership) => membership.workspaceId)
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            memberships: {
              include: { workspace: true },
              where: { status: "ACTIVE" }
            }
          }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) {
          throw new Error("Invalid credentials");
        }

        if (!user.active) {
          throw new Error("User account is inactive");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: null
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      const userId = user?.id ?? token.sub;
      if (!userId) return token;

      const context = await loadUserAuthContext(userId);
      if (!context) return token;

      const apiTokenSecret = process.env.AUTH_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "dev-auth-secret";
      const apiToken = signJwt(
        {
          sub: context.id,
          roles: context.roles,
          workspaceId: context.workspaceId,
          workspaceIds: context.workspaceIds
        },
        apiTokenSecret,
        { expiresIn: "8h" }
      );

      token.sub = context.id;
      token.email = context.email;
      token.name = context.name;
      token.roles = context.roles;
      token.workspaceId = context.workspaceId;
      token.workspaceIds = context.workspaceIds;
      token.apiToken = apiToken;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub);
        session.user.email = String(token.email ?? "");
        session.user.name = (token.name as string | null) ?? null;
        session.user.roles = (token.roles as Role[]) ?? [Role.VIEWER];
        session.user.workspaceId = String(token.workspaceId ?? "");
        session.user.workspaceIds = (token.workspaceIds as string[]) ?? [];
        session.user.apiToken = String(token.apiToken ?? "");
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // Update every 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key"
};
