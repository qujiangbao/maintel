import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const auth = await requireRole();
  if (auth.response) return auth.response;
  return NextResponse.json({ user: auth.user });
}
