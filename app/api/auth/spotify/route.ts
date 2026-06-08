import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "SPOTIFY_CLIENT_ID not configured" }, { status: 500 });
  }
  const state = crypto.randomUUID();
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/spotify/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "playlist-read-private playlist-read-collaborative",
    state,
  });

  const response = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
  response.cookies.set("spotify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return response;
}
