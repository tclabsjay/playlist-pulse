import { NextResponse } from "next/server";
import { getSpotifyRefreshToken, getSpotifyUserName } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const [token, displayName] = await Promise.all([getSpotifyRefreshToken(), getSpotifyUserName()]);
  return NextResponse.json({ connected: !!token, displayName: displayName ?? null });
}
