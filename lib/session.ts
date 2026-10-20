import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { findUser, toPublicUser } from "./users";
import type { PublicUser } from "./types";

export const SESSION_COOKIE = "lab_session";

function secret(): string {
  return process.env.SESSION_SECRET || "dev-only-session-secret";
}

export function signSession(userId: string): string {
  const body = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 12 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readSession(token: string | undefined): { userId: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actual = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      userId?: unknown;
      exp?: unknown;
    };
    if (typeof data.userId !== "string" || typeof data.exp !== "number") return null;
    if (data.exp < Date.now()) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function currentUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const session = readSession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = findUser(session.userId);
  return user ? toPublicUser(user) : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
