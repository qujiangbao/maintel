import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { technicians, toPublicUser } from "@/lib/users";

export async function GET() {
  const auth = await requireRole("admin");
  if (auth.response) return auth.response;
  return NextResponse.json({ technicians: technicians().map(toPublicUser) });
}
