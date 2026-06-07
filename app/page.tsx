import { getPlaylists } from "@/lib/storage";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const playlists = await getPlaylists();

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <header className="border-b border-white/5 sticky top-0 z-10 bg-[#0f0f0f]/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-orange-400">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span className="font-bold text-base tracking-tight">Playlist Pulse</span>
          </div>
          <Link
            href="/admin"
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            Manage
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Public Listening Room</h1>
        <p className="text-white/40 text-sm mb-8">
          {playlists.length > 0
            ? `${playlists.length} curated playlist${playlists.length === 1 ? "" : "s"} — click to open in Spotify.`
            : "No playlists added yet."}
        </p>

        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {playlists.map((p) => (
              <a
                key={p.id}
                href={p.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5 flex flex-col gap-3 hover:border-white/15 hover:bg-[#1f1f1f] transition-all group"
              >
                {p.imageUrl ? (
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-[#282828] rounded-xl flex items-center justify-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#555">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-sm text-white group-hover:text-orange-400 transition-colors truncate">
                    {p.name}
                  </h2>
                  <p className="text-white/35 text-xs mt-0.5">
                    {p.trackCount} tracks · by {p.curatorName}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl py-20 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-white/10 mx-auto mb-4"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-white/30 text-sm font-medium">No playlists yet</p>
            <p className="text-white/15 text-xs mt-1.5">
              <Link href="/admin" className="underline hover:text-white/40 transition-colors">
                Add one from the admin panel
              </Link>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
