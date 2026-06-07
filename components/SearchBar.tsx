"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

function extractSpotifyPlaylistId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname === "open.spotify.com") {
      const match = url.pathname.match(/\/playlist\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }
  } catch {
    // not a URL
  }
  // also handle bare IDs like "spotify:playlist:3bkkoObW3FnXTVtnyAaTgv"
  const uriMatch = value.match(/spotify:playlist:([a-zA-Z0-9]+)/);
  return uriMatch ? uriMatch[1] : null;
}

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const query = searchParams.get("q") ?? "";

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const input = form.elements.namedItem("q") as HTMLInputElement;
      const value = input.value.trim();
      startTransition(() => {
        if (!value) {
          router.push("/");
          return;
        }
        const playlistId = extractSpotifyPlaylistId(value);
        if (playlistId) {
          router.push(`/playlist/${playlistId}`);
        } else {
          router.push(`/?q=${encodeURIComponent(value)}`);
        }
      });
    },
    [router]
  );

  const handleClear = useCallback(() => {
    startTransition(() => router.push("/"));
  }, [router]);

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isPending ? (
            <svg className="animate-spin h-5 w-5 text-white/40" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search or paste a Spotify playlist URL…"
          autoComplete="off"
          className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/15 text-white placeholder-white/40 rounded-full py-3 pl-12 pr-12 text-base outline-none focus:ring-2 focus:ring-[#1DB954] transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-white/30 text-xs mt-2 text-center">
        Paste a Spotify playlist link to import it directly
      </p>
    </form>
  );
}
