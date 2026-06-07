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
  tracks: { total: number };
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

export interface SpotifyCategory {
  id: string;
  name: string;
  icons: SpotifyImage[];
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

async function spotifyFetch<T>(path: string, revalidate = 300): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new SpotifyError(res.status, `Spotify API returned ${res.status} for ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function getCategories(): Promise<SpotifyCategory[]> {
  const data = await spotifyFetch<{ categories: { items: SpotifyCategory[] } }>(
    "/browse/categories?limit=12&country=US",
    86400
  );
  return data.categories.items;
}

export async function getCategoryPlaylists(categoryId: string): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{ playlists: { items: SpotifyPlaylist[] } }>(
    `/browse/categories/${categoryId}/playlists?limit=20&country=US`,
    3600
  );
  return data.playlists.items.filter(Boolean);
}

export async function searchPlaylists(query: string): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{ playlists: { items: SpotifyPlaylist[] } }>(
    `/search?q=${encodeURIComponent(query)}&type=playlist&limit=20`,
    60
  );
  return data.playlists.items.filter(Boolean);
}

export async function getPlaylist(id: string): Promise<SpotifyPlaylist & { tracks: { items: { track: SpotifyTrack }[]; total: number } }> {
  return spotifyFetch(`/playlists/${id}`, 300);
}
