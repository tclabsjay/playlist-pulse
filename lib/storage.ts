export interface StoredPlaylist {
  id: string;
  spotifyUrl: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  curatorName: string;
  addedAt: string;
}

// In-memory fallback (resets on cold start; works fine locally and when KV isn't set up)
const memStore: StoredPlaylist[] = [];

const KV_KEY = "playlists";

function kvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvExec(command: (string | number)[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL!;
  const token = process.env.KV_REST_API_TOKEN!;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result ?? null;
  } catch {
    return null;
  }
}

async function kvGetPlaylists(): Promise<StoredPlaylist[]> {
  const raw = await kvExec(["GET", KV_KEY]);
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function kvSetPlaylists(playlists: StoredPlaylist[]): Promise<void> {
  await kvExec(["SET", KV_KEY, JSON.stringify(playlists)]);
}

export async function getPlaylists(): Promise<StoredPlaylist[]> {
  if (kvConfigured()) return kvGetPlaylists();
  return [...memStore];
}

export async function findById(id: string): Promise<StoredPlaylist | null> {
  const playlists = await getPlaylists();
  return playlists.find((p) => p.id === id) ?? null;
}

export async function playlistExists(id: string): Promise<boolean> {
  const playlists = await getPlaylists();
  return playlists.some((p) => p.id === id);
}

export async function addPlaylist(entry: StoredPlaylist): Promise<void> {
  if (kvConfigured()) {
    const playlists = await kvGetPlaylists();
    await kvSetPlaylists([entry, ...playlists]);
    return;
  }
  memStore.unshift(entry);
}

export async function removePlaylist(id: string): Promise<void> {
  if (kvConfigured()) {
    const playlists = await kvGetPlaylists();
    await kvSetPlaylists(playlists.filter((p) => p.id !== id));
    return;
  }
  const i = memStore.findIndex((p) => p.id === id);
  if (i !== -1) memStore.splice(i, 1);
}
