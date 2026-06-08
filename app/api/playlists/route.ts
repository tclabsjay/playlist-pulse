import { NextRequest, NextResponse } from "next/server";
import { getPlaylist, SpotifyError } from "@/lib/spotify";
import { addPlaylist, getPlaylists, playlistExists } from "@/lib/storage";

export const dynamic = "force-dynamic";

function extractPlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname === "open.spotify.com") {
      const m = url.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
      return m?.[1] ?? null;
    }
  } catch {
    // not a URL — try URI
  }
  return input.match(/spotify:playlist:([a-zA-Z0-9]+)/)?.[1] ?? null;
}

export async function GET() {
  try {
    const playlists = await getPlaylists();
    return NextResponse.json(playlists);
  } catch (e) {
    console.error("[GET /api/playlists]", e);
    return NextResponse.json({ message: "Failed to load playlists." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: { spotifyUrl?: string; curatorName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const { spotifyUrl = "", curatorName = "" } = body;

  if (!spotifyUrl.trim()) {
    return NextResponse.json({ message: "Spotify URL is required." }, { status: 400 });
  }
  if (!curatorName.trim()) {
    return NextResponse.json({ message: "Curator name is required." }, { status: 400 });
  }
  if (spotifyUrl.includes("spotify.link")) {
    return NextResponse.json(
      { message: "Short spotify.link URLs are not supported. Open it in Spotify, tap ··· → Share → Copy link to get the full URL." },
      { status: 400 }
    );
  }

  const playlistId = extractPlaylistId(spotifyUrl);
  if (!playlistId) {
    return NextResponse.json(
      { message: "Invalid Spotify URL. Paste a full https://open.spotify.com/playlist/... link." },
      { status: 400 }
    );
  }

  if (await playlistExists(playlistId)) {
    return NextResponse.json({ message: "This playlist has already been added." }, { status: 409 });
  }

  let spotifyData: Awaited<ReturnType<typeof getPlaylist>>;
  try {
    spotifyData = await getPlaylist(playlistId);
  } catch (err) {
    if (err instanceof SpotifyError) {
      if (err.status === 401) {
        return NextResponse.json(
          { message: "Spotify credentials are invalid. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel → Settings → Environment Variables, then redeploy." },
          { status: 500 }
        );
      }
      if (err.status === 404) {
        return NextResponse.json(
          { message: "Playlist not found. Make sure the playlist is set to Public in Spotify." },
          { status: 404 }
        );
      }
      if (err.status === 403) {
        return NextResponse.json(
          { message: "This playlist is private. Only public Spotify playlists can be imported." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { message: `Spotify returned an error (${err.status}). The playlist may be unavailable.` },
        { status: 502 }
      );
    }
    if (err instanceof Error && err.message.includes("configured")) {
      return NextResponse.json(
        { message: "Spotify credentials are not set. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel → Settings → Environment Variables." },
        { status: 500 }
      );
    }
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[POST /api/playlists] Unexpected error:", detail);
    return NextResponse.json({ message: `Unexpected error: ${detail}` }, { status: 500 });
  }

  let entry;
  try {
    entry = {
      id: spotifyData.id,
      spotifyUrl: spotifyUrl.trim(),
      name: spotifyData.name,
      description: (spotifyData.description ?? "").replace(/<[^>]*>/g, ""),
      imageUrl: spotifyData.images?.[0]?.url ?? "",
      trackCount: spotifyData.items?.total ?? spotifyData.tracks?.total ?? 0,
      curatorName: curatorName.trim(),
      addedAt: new Date().toISOString(),
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[POST /api/playlists] Entry build error:", detail);
    return NextResponse.json({ message: `Unexpected error building playlist entry: ${detail}` }, { status: 500 });
  }

  try {
    await addPlaylist(entry);
  } catch (e) {
    console.error("[POST /api/playlists] Storage error:", e);
    return NextResponse.json({ message: "Playlist validated but could not be saved." }, { status: 500 });
  }

  return NextResponse.json(entry, { status: 201 });
}
