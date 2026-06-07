"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import SpotifyStatus from "./SpotifyStatus";

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

export default function AdminPanel() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [url, setUrl] = useState("");
  const [curatorName, setCuratorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { loadPlaylists(); }, []);

  async function loadPlaylists() {
    try {
      const res = await fetch("/api/playlists");
      if (res.ok) setPlaylists(await res.json());
    } catch {}
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrl: url, curatorName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not save Spotify playlist.");
        return;
      }
      setPlaylists((prev) => [data, ...prev]);
      setUrl("");
      setCuratorName("");
      setSuccess(`"${data.name}" added successfully!`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    // Try delete without PIN first; if server requires one, prompt
    let res = await fetch(`/api/playlists/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (res.status === 403) {
      const pin = window.prompt("Enter your Admin PIN to remove this playlist:");
      if (!pin) return;
      res = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
    }

    if (res.ok) {
      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } else {
      const data = await res.json();
      alert(data.message ?? "Could not remove playlist.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Top bar */}
      <div className="border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Return to Public View
          </Link>
          <span className="text-xs text-orange-400 font-medium bg-orange-400/10 px-2.5 py-1 rounded-full">
            Admin Access
          </span>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-1">Manage Playlists</h1>
        <p className="text-white/40 text-sm mb-8">
          Import and manage Spotify playlists for your public listening room.
        </p>

        {/* Two-column layout: form left, status right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-10">
          {/* Left — Add form */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center shrink-0">
                <span className="text-orange-500 font-bold text-sm leading-none">+</span>
              </div>
              <h2 className="text-base font-semibold">Add a Spotify Playlist</h2>
            </div>
            <p className="text-white/30 text-xs mb-5 ml-9">
              Paste a public Spotify playlist link to share it.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Spotify URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  required
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
                <p className="text-white/20 text-xs mt-1.5 leading-relaxed">
                  Paste a public <code className="text-white/35">open.spotify.com</code> playlist link, or a{" "}
                  <code className="text-white/35">spotify:playlist:...</code> URI. Short{" "}
                  <code className="text-white/35">spotify.link</code> URLs need to be opened in Spotify and copied as the full link.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">Curator Name</label>
                <input
                  type="text"
                  value={curatorName}
                  onChange={(e) => setCuratorName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-[#111] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <div>
                    <p className="text-red-400 text-xs font-semibold">Could not save playlist</p>
                    <p className="text-red-400/60 text-xs mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p className="text-green-400 text-xs">{success}</p>
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

          {/* Right — Spotify status */}
          <SpotifyStatus />
        </div>

        {/* Playlist list */}
        <div>
          <div className="flex items-center gap-2 text-white/40 mb-4">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
            <span className="text-sm font-medium">Imported Playlists ({playlists.length})</span>
          </div>

          {playlists.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl py-14 text-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/10 mx-auto mb-3">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
              <p className="text-white/30 text-sm font-medium">No imported playlists</p>
              <p className="text-white/15 text-xs mt-1">Added playlists will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((p) => (
                <div key={p.id} className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex gap-3 group">
                  {p.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0">
                      <Image src={p.imageUrl} alt={p.name} fill sizes="56px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-[#282828] rounded-md shrink-0 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#555">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <a href={p.spotifyUrl} target="_blank" rel="noopener noreferrer"
                      className="text-white text-sm font-medium truncate block hover:text-orange-400 transition-colors">
                      {p.name}
                    </a>
                    <p className="text-white/35 text-xs mt-0.5">{p.trackCount} tracks · Curated by {p.curatorName}</p>
                  </div>
                  <button onClick={() => handleDelete(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all self-start pt-0.5"
                    title="Remove">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
