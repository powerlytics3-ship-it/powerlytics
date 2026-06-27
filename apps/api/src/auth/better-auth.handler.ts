import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: process.env.ALLOWED_ORIGINS?.split(',') ?? [],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'noreply@powerlytic.app',
        to: user.email,
        subject: 'Reset your Powerlytic password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      sendInvitationEmail: async (data) => {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const inviteUrl = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'noreply@powerlytic.app',
          to: data.email,
          subject: `You've been invited to join ${data.organization.name} on Powerlytic`,
          html: `<p>${data.inviter.user.name} invited you to join <b>${data.organization.name}</b>. <a href="${inviteUrl}">Accept Invitation</a></p>`,
        });
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-create personal workspace after signup
          await prisma.workspace.create({
            data: {
              type: 'PERSONAL',
              name: `${user.name}'s Workspace`,
              slug: `personal-${user.id}`,
              memberships: {
                create: {
                  userId: user.id,
                  role: 'OWNER',
                },
              },
            },
          });
        },
      },
    },
  },

  session: {
    cookieCache: { enabled: true, maxAge: 60 * 60 },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: 'memory',
  },
});
