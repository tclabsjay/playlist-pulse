import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/spotify";
import { setSpotifyToken } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const adminUrl = `${origin}/admin`;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const cookieState = req.cookies.get("spotify_oauth_state")?.value;

  if (error || !code || !state || !cookieState || state !== cookieState) {
    console.error("[spotify callback] invalid state or error:", { error, hasCode: !!code, stateMatch: state === cookieState });
    return NextResponse.redirect(`${adminUrl}?spotify=error`);
  }

  const redirectUri = `${origin}/api/auth/spotify/callback`;
  try {
    const { refreshToken, displayName } = await exchangeCodeForTokens(code, redirectUri);
    await setSpotifyToken(refreshToken, displayName);
    const response = NextResponse.redirect(`${adminUrl}?spotify=connected`);
    response.cookies.delete("spotify_oauth_state");
    return response;
  } catch (err) {
    console.error("[spotify callback] token exchange failed:", err);
    return NextResponse.redirect(`${adminUrl}?spotify=error`);
  }
}
