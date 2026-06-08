import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json({ error: "No Spotify credentials configured" }, { status: 500 });
  }

  try {
    // Get token
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    const { access_token } = await tokenRes.json();

    // Fetch playlist meta
    const metaRes = await fetch(`https://api.spotify.com/v1/playlists/${id}?fields=id,name,public,tracks(total)`, {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });
    const meta = metaRes.ok ? await metaRes.json() : { error: metaRes.status, text: await metaRes.text() };

    // Fetch first page of tracks
    const tracksRes = await fetch(`https://api.spotify.com/v1/playlists/${id}/tracks?limit=10`, {
      headers: { Authorization: `Bearer ${access_token}` },
      cache: "no-store",
    });
    const tracksData = tracksRes.ok ? await tracksRes.json() : { error: tracksRes.status, text: await tracksRes.text() };

    return NextResponse.json({
      playlistId: id,
      meta: metaRes.ok ? { name: meta.name, public: meta.public, trackTotal: meta.tracks?.total } : meta,
      tracks: tracksRes.ok
        ? { total: tracksData.total, count: tracksData.items?.length, names: tracksData.items?.map((i: { track: { name: string } | null }) => i.track?.name ?? "(null)") }
        : tracksData,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
