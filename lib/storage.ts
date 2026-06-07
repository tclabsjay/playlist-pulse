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

export type PublicPlaylist = Omit<StoredPlaylist, "pinHash">;

// In-memory fallback — works within one serverless instance.
// Add a Vercel KV store (dashboard → Storage → Create KV) for full persistence.
const mem: StoredPlaylist[] = [];

const KV_KEY = "pp:playlists";

async function getKV() {
  if (!process.env.KV_REST_API_URL) return null;
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

async function readAll(): Promise<StoredPlaylist[]> {
  const kv = await getKV();
  if (kv) return (await kv.get<StoredPlaylist[]>(KV_KEY)) ?? [];
  return [...mem];
}

async function writeAll(list: StoredPlaylist[]): Promise<void> {
  const kv = await getKV();
  if (kv) {
    await kv.set(KV_KEY, list);
  } else {
    mem.length = 0;
    mem.push(...list);
  }
}

export async function getPlaylists(): Promise<PublicPlaylist[]> {
  const all = await readAll();
  return all.map(({ pinHash: _, ...p }) => p);
}

export async function findById(id: string): Promise<StoredPlaylist | null> {
  const all = await readAll();
  return all.find((p) => p.id === id) ?? null;
}

export async function playlistExists(id: string): Promise<boolean> {
  const all = await readAll();
  return all.some((p) => p.id === id);
}

export async function addPlaylist(entry: StoredPlaylist): Promise<void> {
  const all = await readAll();
  await writeAll([entry, ...all]);
}

export async function removePlaylist(id: string): Promise<boolean> {
  const all = await readAll();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return false;
  await writeAll(next);
  return true;
}
