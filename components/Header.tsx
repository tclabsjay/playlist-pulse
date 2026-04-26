import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#121212]/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.543-1.79c3.533-1.072 9.404-.865 13.115 1.338a.936.936 0 01-1.954.608z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight group-hover:text-[#1DB954] transition-colors">
            Playlist<span className="text-[#1DB954]">Pulse</span>
          </span>
        </Link>
        <a
          href="https://open.spotify.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Open Spotify
        </a>
      </div>
    </header>
  );
}
