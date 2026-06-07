import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import TrackList from "@/components/TrackList";
import { getPlaylist, SpotifyError } from "@/lib/spotify";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const playlist = await getPlaylist(params.id);
    return {
      title: `${playlist.name} — Playlist Pulse`,
      description: playlist.description?.replace(/<[^>]*>/g, "") || `${playlist.tracks.total} tracks`,
    };
  } catch {
    return { title: "Playlist — Playlist Pulse" };
  }
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mt-6 mb-8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold mb-3">{title}</h1>
          <p className="text-white/50 text-sm max-w-md mb-8">{message}</p>
          <Link
            href="/"
            className="bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-6 py-3 rounded-full transition-colors"
          >
            Browse Playlists
          </Link>
        </div>
      </main>
    </div>
  );
}

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  let playlist: Awaited<ReturnType<typeof getPlaylist>>;

  try {
    playlist = await getPlaylist(params.id);
  } catch (err) {
    if (err instanceof SpotifyError) {
      if (err.status === 404) notFound();
      if (err.status === 403) {
        return (
          <ErrorState
            title="Playlist not accessible"
            message="This playlist is private or restricted. Only public Spotify playlists can be viewed here."
          />
        );
      }
      return (
        <ErrorState
          title="Couldn't load playlist"
          message={`Spotify returned an error (${err.status}). The playlist may have been deleted or is unavailable in your region.`}
        />
      );
    }
    // Missing credentials or network error
    return (
      <ErrorState
        title="Spotify not connected"
        message="Spotify API credentials are not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your Vercel environment variables."
      />
    );
  }

  const imageUrl = playlist.images?.[0]?.url;
  const description = playlist.description?.replace(/<[^>]*>/g, "");
  const trackItems = playlist.tracks.items ?? [];

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mt-6 mb-8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </Link>

        <div className="flex flex-col sm:flex-row gap-6 mb-10">
          <div className="shrink-0">
            {imageUrl ? (
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src={imageUrl}
                  alt={playlist.name}
                  fill
                  sizes="224px"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-[#282828] rounded-lg flex items-center justify-center">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="#555">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-end min-w-0">
            <p className="text-white/50 text-xs uppercase tracking-widest mb-2">Playlist</p>
            <h1 className="text-white text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
              {playlist.name}
            </h1>
            {description && (
              <p className="text-white/50 text-sm mb-3 max-w-prose line-clamp-3">{description}</p>
            )}
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <span className="font-semibold text-white">{playlist.owner.display_name}</span>
              <span>·</span>
              <span>{playlist.tracks.total.toLocaleString()} tracks</span>
              {playlist.followers && (
                <>
                  <span>·</span>
                  <span>{playlist.followers.total.toLocaleString()} followers</span>
                </>
              )}
            </div>
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-sm px-6 py-3 rounded-full transition-colors w-fit"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="black">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.543-1.79c3.533-1.072 9.404-.865 13.115 1.338a.936.936 0 01-1.954.608z" />
              </svg>
              Open in Spotify
            </a>
          </div>
        </div>

        <div className="bg-[#181818] rounded-xl p-2">
          <TrackList tracks={trackItems} />
        </div>
      </main>
    </div>
  );
}
