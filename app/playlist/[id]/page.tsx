import { getPlaylists, updateTrackCount } from "@/lib/storage";
import { getPlaylistFresh, getPlaylistTracks, SpotifyTrack } from "@/lib/spotify";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const playlists = await getPlaylists();
  const stored = playlists.find((p) => p.id === id);
  if (!stored) notFound();

  let tracks: SpotifyTrack[] = [];
  let followers: number | null = null;
  let credentialsMissing = false;
  let fetchError: string | null = null;

  try {
    const [meta, fetchedTracks] = await Promise.all([
      getPlaylistFresh(stored.id),
      getPlaylistTracks(stored.id),
    ]);
    followers = meta.followers?.total ?? null;
    tracks = fetchedTracks;
    // Keep stored count in sync so the home card stays accurate
    if (meta.tracks.total !== stored.trackCount) {
      updateTrackCount(stored.id, meta.tracks.total).catch(() => {});
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("credentials") || msg.includes("not configured")) {
      credentialsMissing = true;
    } else {
      fetchError = msg || "Could not load tracks from Spotify.";
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-white/5 sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-white/50 hover:text-white active:text-white/70 transition-colors text-sm py-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
            All playlists
          </Link>
          <a
            href={stored.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 active:bg-[#1DB954]/35 transition-colors px-3 py-1.5 rounded-full font-medium"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.543-1.79c3.533-1.072 9.404-.865 13.115 1.338a.936.936 0 01-1.954.608z" />
            </svg>
            Open in Spotify
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="flex flex-col sm:flex-row gap-8 mb-10">
          {stored.imageUrl ? (
            <div className="relative w-full sm:w-60 aspect-square sm:h-60 sm:aspect-auto rounded-2xl overflow-hidden shrink-0 shadow-2xl shadow-black/60">
              <Image src={stored.imageUrl} alt={stored.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 240px" />
            </div>
          ) : (
            <div className="w-full sm:w-60 h-60 bg-[#282828] rounded-2xl flex items-center justify-center shrink-0">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#555">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}

          <div className="flex flex-col justify-end gap-2 min-w-0">
            <p className="text-white/35 text-xs uppercase tracking-widest font-medium">Playlist</p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{stored.name}</h1>
            {stored.description && (
              <p className="text-white/45 text-sm leading-relaxed line-clamp-3">{stored.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/35 text-sm mt-1">
              <span className="font-semibold text-white/70">{stored.curatorName}</span>
              <span className="text-white/20">·</span>
              <span>{stored.trackCount} tracks</span>
              {followers !== null && (
                <>
                  <span className="text-white/20">·</span>
                  <span>{followers.toLocaleString()} followers</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Track list */}
        {credentialsMissing ? (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl py-16 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mx-auto mb-3">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-white/30 text-sm">Add Spotify API credentials to view tracks</p>
          </div>
        ) : fetchError ? (
          <div className="bg-red-500/5 border border-red-500/15 rounded-2xl py-12 text-center px-6">
            <p className="text-red-400/70 text-sm">Could not load tracks — {fetchError}</p>
          </div>
        ) : tracks.length > 0 ? (
          <div>
            {/* Column headers — desktop only */}
            <div className="hidden sm:grid grid-cols-[2rem_2.5rem_1fr_1fr_3.5rem] gap-3 px-3 pb-2 border-b border-white/5 text-xs text-white/20 font-medium uppercase tracking-wider">
              <span className="text-right">#</span>
              <span />
              <span>Title</span>
              <span>Album</span>
              <span className="text-right">Time</span>
            </div>

            <div>
              {tracks.map((track, i) => {
                const albumArt = track.album.images[2]?.url ?? track.album.images[1]?.url ?? track.album.images[0]?.url;
                const artists = track.artists.map((a) => a.name).join(", ");
                return (
                  <div
                    key={`${track.id}-${i}`}
                    className="grid grid-cols-[2rem_2.5rem_1fr_3.5rem] sm:grid-cols-[2rem_2.5rem_1fr_1fr_3.5rem] gap-3 px-3 py-2.5 items-center hover:bg-white/[0.04] active:bg-white/[0.06] rounded-lg group transition-colors"
                  >
                    {/* # */}
                    <span className="text-right text-white/20 text-sm tabular-nums">{i + 1}</span>

                    {/* Album art */}
                    {albumArt ? (
                      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                        <Image src={albumArt} alt={track.album.name} fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-[#282828] rounded shrink-0" />
                    )}

                    {/* Title + artist */}
                    <div className="min-w-0">
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-white group-hover:text-orange-400 transition-colors truncate block"
                      >
                        {track.name}
                      </a>
                      <p className="text-white/35 text-xs truncate mt-0.5">{artists}</p>
                    </div>

                    {/* Album — desktop only */}
                    <p className="hidden sm:block text-white/25 text-xs truncate">{track.album.name}</p>

                    {/* Duration */}
                    <span className="text-right text-white/30 text-xs tabular-nums">{formatMs(track.duration_ms)}</span>
                  </div>
                );
              })}
            </div>

            {stored.trackCount > tracks.length && (
              <p className="text-center text-white/20 text-xs mt-6">
                Showing {tracks.length} of {stored.trackCount} tracks
              </p>
            )}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl py-16 text-center px-6">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mx-auto mb-3">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-white/30 text-sm font-medium">No tracks in this playlist</p>
            <p className="text-white/15 text-xs mt-1.5">Add songs to this playlist in Spotify, then come back.</p>
          </div>
        )}
      </main>
    </div>
  );
}
