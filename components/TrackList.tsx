import type { SpotifyTrack } from "@/lib/spotify";

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function TrackList({
  tracks,
}: {
  tracks: { track: SpotifyTrack | null }[];
}) {
  const validTracks = tracks.filter((t) => t.track !== null) as { track: SpotifyTrack }[];

  if (validTracks.length === 0) {
    return <p className="text-white/40 text-sm py-8 text-center">No tracks available.</p>;
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-4 px-4 py-2 text-xs text-white/40 uppercase tracking-wide border-b border-white/10 mb-2">
        <span className="w-6 text-center">#</span>
        <span>Title</span>
        <span className="hidden sm:block">Album</span>
        <span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
          </svg>
        </span>
      </div>
      {validTracks.map(({ track }, i) => (
        <a
          key={track.id}
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-4 px-4 py-2 rounded-md hover:bg-white/5 group items-center transition-colors"
        >
          <span className="w-6 text-center text-sm text-white/40 group-hover:text-white/60">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate group-hover:text-[#1DB954] transition-colors">
              {track.name}
            </p>
            <p className="text-white/50 text-xs truncate">
              {track.artists.map((a) => a.name).join(", ")}
            </p>
          </div>
          <p className="text-white/40 text-xs truncate hidden sm:block">{track.album.name}</p>
          <span className="text-white/40 text-xs tabular-nums">
            {formatDuration(track.duration_ms)}
          </span>
        </a>
      ))}
    </div>
  );
}
