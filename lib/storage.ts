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

// In-memory store — persists within one serverless instance lifetime.
// Playlists reset on cold start. Add Vercel KV later for full persistence.
const store: StoredPlaylist[] = [];

export async function getPlaylists(): Promise<StoredPlaylist[]> {
  return [...store];
}

export async function findById(id: string): Promise<StoredPlaylist | null> {
  return store.find((p) => p.id === id) ?? null;
}

export async function playlistExists(id: string): Promise<boolean> {
  return store.some((p) => p.id === id);
}

export async function addPlaylist(entry: StoredPlaylist): Promise<void> {
  store.unshift(entry);
}

export async function removePlaylist(id: string): Promise<void> {
  const i = store.findIndex((p) => p.id === id);
  if (i !== -1) store.splice(i, 1);
}
