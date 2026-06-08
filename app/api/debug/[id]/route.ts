import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d.access_token as string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  if (!token) return NextResponse.json({ error: "no token" }, { status: 500 });

  const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await res.json();

  // Return a compact summary + the tracks shape
  return NextResponse.json({
    status: res.status,
    playlist_name: body.name,
    tracks_total: body.tracks?.total,
    tracks_items_length: body.tracks?.items?.length,
    tracks_items_null: body.tracks?.items === null,
    tracks_items_undef: body.tracks?.items === undefined,
    tracks_next: body.tracks?.next,
    first_item: body.tracks?.items?.[0] ?? null,
    tracks_href: body.tracks?.href,
    public: body.public,
    collaborative: body.collaborative,
  });
}
