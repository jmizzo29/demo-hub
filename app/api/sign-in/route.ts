import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { displayNameFor, isApproved } from "@/lib/access";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";

function withCookies(body: unknown, source: Headers, status = 200) {
  const response = NextResponse.json(body, { status });
  for (const cookie of source.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return NextResponse.json(
      { error: "Enter the approved email and a password of at least 8 characters." },
      { status: 400 },
    );
  }
  if (!(await isApproved(email))) {
    return NextResponse.json(
      {
        error:
          "This email does not have access yet. Request access and wait for approval.",
      },
      { status: 403 },
    );
  }

  const existing = await pool.query(`SELECT id FROM "user" WHERE lower(email) = $1`, [
    email,
  ]);

  try {
    if (existing.rowCount) {
      const result = await auth.api.signInEmail({
        body: { email, password },
        headers: request.headers,
        returnHeaders: true,
      });
      const step = "twoFactorRedirect" in result.response ? "mfa" : "enroll";
      return withCookies({ step }, result.headers);
    }
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: await displayNameFor(email),
      },
      headers: request.headers,
      returnHeaders: true,
    });
    return withCookies({ step: "enroll" }, result.headers);
  } catch (error) {
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message || "Sign-in failed." },
        { status: error.statusCode || 400 },
      );
    }
    throw error;
  }
}
