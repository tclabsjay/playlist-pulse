import Image from "next/image";
import Link from "next/link";
import type { SpotifyPlaylist } from "@/lib/spotify";

export default function PlaylistCard({ playlist }: { playlist: SpotifyPlaylist }) {
  const imageUrl = playlist.images?.[0]?.url;
  const description = playlist.description
    ? playlist.description.replace(/<[^>]*>/g, "").slice(0, 80)
    : "";

  return (
    <Link href={`/playlist/${playlist.id}`} className="group block">
      <div className="bg-[#181818] hover:bg-[#282828] transition-colors duration-200 rounded-lg p-4 cursor-pointer">
        <div className="relative aspect-square w-full mb-4 rounded-md overflow-hidden shadow-lg">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={playlist.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-[#282828] flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="#555">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 bg-[#1DB954] rounded-full flex items-center justify-center shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
        <h3 className="text-white font-semibold text-sm truncate mb-1">{playlist.name}</h3>
        {description ? (
          <p className="text-white/50 text-xs line-clamp-2 leading-relaxed">{description}</p>
        ) : (
          <p className="text-white/50 text-xs">{playlist.tracks?.total ?? 0} tracks</p>
        )}
      </div>
    </Link>
  );
}
