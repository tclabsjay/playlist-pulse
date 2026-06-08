"use client";

import { useEffect, useState, useCallback } from "react";

interface Status {
  hasCredentials: boolean;
  apiWorks: boolean;
  errorDetail: string;
  kvConfigured: boolean;
  checkedAt: string;
}

function Check({ ok, label, sub }: { ok: boolean; label: string; sub: string }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-white/5 last:border-0">
      <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${ok ? "bg-green-500/20" : "bg-red-500/20"}`}>
        {ok ? (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${ok ? "text-white/80" : "text-red-400"}`}>{label}</p>
        <p className="text-white/30 text-xs leading-relaxed mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function SpotifyStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spotify/status");
      if (res.ok) setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const connected = status?.hasCredentials && status?.apiWorks;
  const checkedTime = status?.checkedAt
    ? new Date(status.checkedAt).toLocaleTimeString()
    : null;

  return (
    <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-orange-400">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.809-.87 7.077-.496 9.712 1.115a.623.623 0 01.207.857zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.973-.519.781.781 0 01.519-.972c3.632-1.102 8.147-.568 11.234 1.328a.78.78 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.543-1.79c3.533-1.072 9.404-.865 13.115 1.338a.936.936 0 01-1.954.608z" />
          </svg>
          <span className="text-sm font-semibold text-white">Spotify Connection</span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? "animate-spin" : ""}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </button>
      </div>

      {!status && loading ? (
        <div className="py-4 text-center text-white/20 text-xs">Checking connection…</div>
      ) : (
        <>
          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${connected ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`} />
            {connected ? "Connected" : "Not connected"}
          </div>

          {connected && (
            <p className="text-white/40 text-xs mb-3 leading-relaxed">
              Spotify is fully connected. Playlist data, cover art, and track counts will populate automatically.
            </p>
          )}

          {!connected && status?.errorDetail && (
            <p className="text-red-400/70 text-xs mb-3 bg-red-500/10 rounded-lg px-3 py-2 leading-relaxed">
              {status.errorDetail}
            </p>
          )}

          <div className="space-y-0">
            <Check
              ok={true}
              label="Public preview (oEmbed)"
              sub="Title, cover art, and embed player. No credentials required."
            />
            <Check
              ok={!!status?.hasCredentials}
              label="Web API credentials"
              sub={
                status?.hasCredentials
                  ? `Detected SPOTIFY_CLIENT_ID & SPOTIFY_CLIENT_SECRET.`
                  : "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are not set in Vercel."
              }
            />
            <Check
              ok={!!status?.apiWorks}
              label="Track import"
              sub={
                status?.apiWorks
                  ? "Tracks, artists, and album art populate automatically."
                  : status?.hasCredentials
                  ? `Auth failed: ${status.errorDetail || "check your credentials."}`
                  : "Set credentials above to enable track import."
              }
            />
            <Check
              ok={!!status?.kvConfigured}
              label="Persistent storage"
              sub={
                status?.kvConfigured
                  ? "Upstash Redis connected — playlists persist across deploys."
                  : "Not configured. Go to vercel.com/dashboard → Storage → Connect Store → Upstash Redis, then redeploy."
              }
            />
          </div>

          {checkedTime && (
            <p className="text-white/15 text-xs mt-3">Last checked {checkedTime}</p>
          )}
        </>
      )}
    </div>
  );
}
