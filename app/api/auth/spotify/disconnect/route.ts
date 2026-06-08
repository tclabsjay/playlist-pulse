import { NextResponse } from "next/server";
import { clearSpotifyToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearSpotifyToken();
  return NextResponse.json({ ok: true });
}
