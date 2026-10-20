import { NextResponse } from "next/server";
import { requireRole } from "@/lib/guard";
import { ROOMS, TAGS, URGENCIES } from "@/lib/taxonomy";

export async function GET() {
  const auth = await requireRole();
  if (auth.response) return auth.response;
  return NextResponse.json({ rooms: ROOMS, tags: TAGS, urgencies: URGENCIES });
}
