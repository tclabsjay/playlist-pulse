"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Playlist {
  id: string;
  spotifyUrl: string;
  name: string;
  description: string;
  imageUrl: string;
  trackCount: number;
  curatorName: string;
  addedAt: string;
}

export default function ManagePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [url, setUrl] = useState("");
  const [curatorName, setCuratorName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [topError, setTopError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  async function fetchPlaylists() {
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) setPlaylists(await res.json());
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTopError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrl: url, curatorName, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message ?? "Could not save Spotify playlist";
        setError(msg);
        setTopError(msg);
        return;
      }

      setPlaylists((prev) => [data, ...prev]);
      setUrl("");
      setCuratorName("");
      setPin("");
      setSuccess(`"${data.name}" added successfully!`);
    } catch {
      const msg = "Network error — please try again.";
      setError(msg);
      setTopError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const enteredPin = window.prompt("Enter your Admin PIN to remove this playlist:");
    if (!enteredPin) return;

    const res = await fetch(`/api/playlists/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: enteredPin }),
    });

    if (res.ok) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } else {
      const data = await res.json();
      alert(data.message ?? "Could not remove playlist.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {topError && (
        <div className="bg-[#c0392b] text-white px-5 py-3">
          <p className="font-semibold text-sm">Could not save playlist</p>
          <p className="text-sm opacity-90">{topError}</p>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-2">Manage Playlists</h1>
        <p className="text-center text-white/50 text-sm mb-8">
          Import and manage Spotify playlists for your public listening room.
        </p>

        {/* Add Playlist Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-6 border border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <span className="text-orange-500 font-bold text-base leading-none">+</span>
            </div>
            <h2 className="text-lg font-semibold">Add a Spotify Playlist</h2>
          </div>
          <p className="text-white/40 text-xs mb-5 ml-10">
            Paste a public Spotify playlist link to share it.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Spotify URL</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                required
                className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/60 transition-colors"
              />
              <p className="text-white/25 text-xs mt-1.5 leading-relaxed">
                Paste a public{" "}
                <code className="text-white/40">open.spotify.com</code> playlist link, or a{" "}
                <code className="text-white/40">spotify:playlist:...</code> URI. Short{" "}
                <code className="text-white/40">spotify.link</code> URLs need to be opened in Spotify
                and copied as the full link.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Curator Name</label>
                <input
                  type="text"
                  value={curatorName}
                  onChange={(e) => setCuratorName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Admin PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/60 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-red-400 mt-0.5 shrink-0"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <div>
                  <p className="text-red-400 text-sm font-medium">Could not save playlist</p>
                  <p className="text-red-400/60 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold py-3 rounded-lg transition-colors text-sm"
            >
              {loading ? "Saving…" : "Save Playlist"}
            </button>
          </form>
        </div>

        {/* Imported Playlists */}
        <div>
          <div className="flex items-center gap-2 text-white/50 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span className="text-sm font-medium">
              Imported Playlists ({playlists.length})
            </span>
          </div>

          {playlists.length === 0 ? (
            <p className="text-white/20 text-sm text-center py-10">
              No playlists added yet. Import one above!
            </p>
          ) : (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex gap-3 group"
                >
                  {playlist.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={playlist.imageUrl}
                        alt={playlist.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-[#282828] rounded-md shrink-0 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#555">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={playlist.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white font-medium text-sm truncate hover:text-orange-400 transition-colors block"
                    >
                      {playlist.name}
                    </a>
                    <p className="text-white/40 text-xs mt-0.5">{playlist.trackCount} tracks</p>
                    <p className="text-white/25 text-xs mt-0.5">
                      Curated by {playlist.curatorName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(playlist.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all self-start mt-1"
                    title="Remove playlist"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
