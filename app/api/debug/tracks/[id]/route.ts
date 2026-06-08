import { NextRequest, NextResponse } from "next/server";
import { getSpotifyRefreshToken, getSpotifyUserName } from "@/lib/storage";
import { refreshUserToken } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const refreshToken = await getSpotifyRefreshToken();
  const displayName = await getSpotifyUserName();

  if (!refreshToken) {
    return NextResponse.json({ step: "no_refresh_token", displayName, message: "No refresh token stored in KV. OAuth did not complete." });
  }

  let accessToken: string;
  try {
    accessToken = await refreshUserToken(refreshToken);
  } catch (err) {
    return NextResponse.json({ step: "refresh_failed", displayName, error: String(err) });
  }

  // Try GET /playlists/{id} with user token
  const playlistRes = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const playlistBody = await playlistRes.json();

  // Try GET /playlists/{id}/items with user token
  const itemsRes = await fetch(`https://api.spotify.com/v1/playlists/${id}/items?limit=5`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const itemsBody = await itemsRes.json();

  return NextResponse.json({
    step: "done",
    displayName,
    playlist_status: playlistRes.status,
    playlist_name: playlistBody.name,
    // new field name (Feb 2026)
    items_field_exists: !!playlistBody.items,
    items_items_length: playlistBody.items?.items?.length,
    items_total: playlistBody.items?.total,
    // old field name (pre Feb 2026)
    tracks_field_exists: !!playlistBody.tracks,
    tracks_items_length: playlistBody.tracks?.items?.length,
    tracks_total: playlistBody.tracks?.total,
    // separate /items endpoint
    items_endpoint_status: itemsRes.status,
    items_endpoint_count: itemsBody.items?.length,
    items_endpoint_total: itemsBody.total,
    first_track: itemsBody.items?.[0]?.item?.name ?? itemsBody.items?.[0]?.track?.name ?? null,
  });
}
