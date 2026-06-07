import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getPlaylist, SpotifyError } from "@/lib/spotify";

export interface StoredPlaylist {
  id: string;
  spotifyUrl: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  curatorName: string;
  pinHash: string;
  addedAt: string;
}

// Module-level store — persists within a single Lambda instance.
// For cross-request persistence on Vercel, connect Vercel KV and
// replace the array operations with kv.get/kv.set calls.
const store: StoredPlaylist[] = [];

function extractPlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname === "open.spotify.com") {
      const m = url.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
      return m?.[1] ?? null;
    }
  } catch {
    // not a URL
  }
  const m = input.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  return m?.[1] ?? null;
}

export async function GET() {
  const playlists = store.map(({ pinHash: _, ...p }) => p);
  return NextResponse.json(playlists);
}

export async function POST(req: NextRequest) {
  let body: { spotifyUrl?: string; curatorName?: string; pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { spotifyUrl, curatorName, pin } = body;

  if (!spotifyUrl || !curatorName || !pin) {
    return NextResponse.json({ message: "Spotify URL, curator name, and PIN are all required." }, { status: 400 });
  }

  if (spotifyUrl.includes("spotify.link")) {
    return NextResponse.json(
      { message: "Short spotify.link URLs are not supported. Open the link in Spotify, then share it to get the full open.spotify.com URL." },
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

  if (store.some((p) => p.id === playlistId)) {
    return NextResponse.json({ message: "This playlist has already been added." }, { status: 409 });
  }

  let spotifyData: Awaited<ReturnType<typeof getPlaylist>>;
  try {
    spotifyData = await getPlaylist(playlistId);
  } catch (err) {
    if (err instanceof SpotifyError) {
      if (err.status === 401) {
        return NextResponse.json(
          { message: "Spotify credentials are invalid. Double-check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel → Project Settings → Environment Variables, then redeploy." },
          { status: 500 }
        );
      }
      if (err.status === 404) {
        return NextResponse.json(
          { message: "Playlist not found. Make sure it is set to Public in Spotify." },
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
        { message: `Spotify error ${err.status}: ${err.message}` },
        { status: 500 }
      );
    }
    if (err instanceof Error && err.message.includes("configured")) {
      return NextResponse.json(
        { message: "Spotify API credentials are missing. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Vercel → Project Settings → Environment Variables." },
        { status: 500 }
      );
    }
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[playlists POST] Unexpected error:", detail);
    return NextResponse.json({ message: `Save failed: ${detail}` }, { status: 500 });
  }

  const entry: StoredPlaylist = {
    id: spotifyData.id,
    spotifyUrl,
    name: spotifyData.name,
    description: spotifyData.description?.replace(/<[^>]*>/g, "") ?? "",
    imageUrl: spotifyData.images?.[0]?.url ?? "",
    trackCount: spotifyData.tracks.total,
    curatorName: curatorName.trim(),
    pinHash: createHash("sha256").update(pin).digest("hex"),
    addedAt: new Date().toISOString(),
  };

  store.unshift(entry);

  const { pinHash: _, ...publicEntry } = entry;
  return NextResponse.json(publicEntry, { status: 201 });
}
