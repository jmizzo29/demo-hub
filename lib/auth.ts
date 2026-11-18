import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { generateRandomString } from "better-auth/crypto";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { Pool } from "pg";
import { isAdminEmail } from "@/lib/access";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
const databaseUrl = process.env.DATABASE_URL;

if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is not set.");
}
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const auth = betterAuth({
  appName: "Demo hub",
  secret,
  baseURL,
  database: new Pool({ connectionString: databaseUrl }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders:
    googleId && googleSecret
      ? {
          google: {
            clientId: googleId,
            clientSecret: googleSecret,
          },
        }
      : undefined,
  plugins: [
    twoFactor({
      allowPasswordless: true,
      issuer: "Demo hub",
    }),
    nextCookies(),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-up/email") return;
      const email = String(ctx.body?.email ?? "");
      if (!isAdminEmail(email)) {
        throw new APIError("FORBIDDEN", {
          message: "This sign-in is for the admin only.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (!ctx.path?.startsWith("/callback/")) return;
      const data = ctx.context.newSession;
      if (!data) return;
      if (!isAdminEmail(data.user.email)) {
        deleteSessionCookie(ctx, true);
        await ctx.context.internalAdapter.deleteSession(data.session.token);
        throw ctx.redirect(new URL("/", ctx.context.baseURL).toString() + "?error=access");
      }
      if (!data.user.twoFactorEnabled) return;
      deleteSessionCookie(ctx, true);
      await ctx.context.internalAdapter.deleteSession(data.session.token);
      ctx.context.setNewSession(null);
      const maxAge = 600;
      const twoFactorCookie = ctx.context.createAuthCookie("two_factor", { maxAge });
      const identifier = `2fa-${generateRandomString(20)}`;
      const expiresAt = new Date(Date.now() + maxAge * 1000);
      await ctx.context.internalAdapter.createVerificationValue({
        value: data.user.id,
        identifier,
        expiresAt,
      });
      await ctx.context.internalAdapter.createVerificationValue({
        value: "0",
        identifier: `2fa-attempts-${identifier}`,
        expiresAt,
      });
      await ctx.setSignedCookie(
        twoFactorCookie.name,
        identifier,
        ctx.context.secret,
        twoFactorCookie.attributes,
      );
      throw ctx.redirect(new URL("/?mfa=1", ctx.context.baseURL).toString());
    }),
  },
});

export function googleSignInEnabled() {
  return Boolean(googleId && googleSecret);
}
