const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks?: { total: number };  // field name before Feb 2026
  items?: { total: number };   // renamed from tracks in Feb 2026
  owner: { display_name: string };
  external_urls: { spotify: string };
  followers?: { total: number };
  public?: boolean;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string; id: string }[];
  album: { name: string; images: SpotifyImage[] };
  external_urls: { spotify: string };
  preview_url: string | null;
}


export class SpotifyError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SpotifyError";
  }
}

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Spotify credentials are not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.");
  }

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    // Use SpotifyError so the API route can give a specific message
    throw new SpotifyError(401, `Spotify authentication failed (${res.status}). Check that SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are correct in Vercel environment variables.`);
  }

  const data = await res.json();
  return data.access_token as string;
}

async function spotifyFetch<T>(path: string, revalidate = 300, noStore = false): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    ...(noStore ? { cache: "no-store" as const } : { next: { revalidate } }),
  });

  if (!res.ok) {
    throw new SpotifyError(res.status, `Spotify API returned ${res.status} for ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function searchPlaylists(query: string): Promise<SpotifyPlaylist[]> {
  // limit capped at 10 per Feb 2026 Spotify API change (was 50)
  const data = await spotifyFetch<{ playlists: { items: SpotifyPlaylist[] } }>(
    `/search?q=${encodeURIComponent(query)}&type=playlist&limit=10`,
    60
  );
  return data.playlists.items.filter(Boolean);
}

export async function getPlaylist(id: string): Promise<SpotifyPlaylist> {
  return spotifyFetch(`/playlists/${id}`, 300);
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<{ refreshToken: string; displayName: string }> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Spotify credentials are not configured.");
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new SpotifyError(res.status, `Token exchange failed (${res.status})`);
  const tokens = await res.json();
  const accessToken = tokens.access_token as string;
  const refreshToken = tokens.refresh_token as string;

  // Fetch display name
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  let displayName = "Spotify User";
  if (meRes.ok) {
    const me = await meRes.json();
    displayName = (me.display_name || me.id || "Spotify User") as string;
  }
  return { refreshToken, displayName };
}

export async function refreshUserToken(refreshToken: string): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Spotify credentials are not configured.");
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new SpotifyError(res.status, "Failed to refresh user token");
  const data = await res.json();
  return data.access_token as string;
}

// Fetches playlist data using a user OAuth access token.
// Handles Feb 2026 field renames: tracks→items (paging object), track→item (each entry).
// Tries inline items from GET /playlists/{id}, then falls back to GET /playlists/{id}/items.
export async function getPlaylistDataAsUser(id: string, accessToken: string): Promise<{
  name: string;
  description: string;
  imageUrl: string;
  followers: number | null;
  trackTotal: number;
  tracks: SpotifyTrack[];
  tracksRestricted: boolean;
}> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new SpotifyError(res.status, `Spotify returned ${res.status} for playlist ${id}`);
  const data = await res.json() as Record<string, unknown>;

  type RawItem = { track?: SpotifyTrack | null; item?: SpotifyTrack | null; is_local?: boolean };
  type PagingObj = { items?: RawItem[]; total?: number };

  // Handle both old field name (tracks) and new (items) in the playlist object
  const pagingObj = (data.items ?? data.tracks) as PagingObj | undefined;

  const extractTracks = (items: RawItem[]): SpotifyTrack[] =>
    items
      .filter((i) => !i.is_local)
      .map((i) => (i.item ?? i.track) as SpotifyTrack | null)
      .filter((t): t is SpotifyTrack => t !== null && !!t.id);

  const images = data.images as SpotifyImage[];
  const followersObj = data.followers as { total: number } | undefined;
  const meta = {
    name: data.name as string,
    description: ((data.description as string) ?? "").replace(/<[^>]*>/g, ""),
    imageUrl: images?.[0]?.url ?? "",
    followers: followersObj?.total ?? null,
  };

  if (pagingObj?.items) {
    const tracks = extractTracks(pagingObj.items);
    return { ...meta, tracks, trackTotal: pagingObj.total ?? tracks.length, tracksRestricted: false };
  }

  // Inline items missing — try the renamed /items endpoint (was /tracks before Feb 2026)
  const itemsRes = await fetch(`https://api.spotify.com/v1/playlists/${id}/items?limit=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (itemsRes.ok) {
    const itemsData = await itemsRes.json() as PagingObj;
    if (itemsData.items) {
      const tracks = extractTracks(itemsData.items);
      return { ...meta, tracks, trackTotal: itemsData.total ?? tracks.length, tracksRestricted: false };
    }
  }

  return { ...meta, tracks: [], trackTotal: 0, tracksRestricted: true };
}

// Fetches playlist metadata + inline tracks (first 100) with no cache using client credentials.
// Handles Feb 2026 field renames: tracks→items (paging object), track→item (each entry).
export async function getPlaylistData(id: string): Promise<{
  name: string;
  description: string;
  imageUrl: string;
  followers: number | null;
  trackTotal: number;
  tracks: SpotifyTrack[];
  tracksRestricted: boolean;
}> {
  type PagingItem = { track?: SpotifyTrack | null; item?: SpotifyTrack | null; is_local: boolean };
  type PagingObject = { items?: PagingItem[]; total?: number; next?: string | null };
  type Full = SpotifyPlaylist & { followers?: { total: number }; tracks?: PagingObject; items?: PagingObject };

  const data = await spotifyFetch<Full>(`/playlists/${id}`, 300, true);

  // Handle both old (tracks) and new (items) field names per Feb 2026 rename
  const pagingObj = data.items ?? data.tracks;
  const tracksRestricted = !pagingObj?.items;

  const rawItems = pagingObj?.items ?? [];
  const tracks = rawItems
    .filter((i) => !i.is_local)
    .map((i) => i.item ?? i.track)
    .filter((t): t is SpotifyTrack => t !== null && t !== undefined && !!t.id);

  return {
    name: data.name,
    description: (data.description ?? "").replace(/<[^>]*>/g, ""),
    imageUrl: data.images?.[0]?.url ?? "",
    followers: data.followers?.total ?? null,
    trackTotal: pagingObj?.total ?? 0,
    tracks,
    tracksRestricted,
  };
}
