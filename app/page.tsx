import { Suspense } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import CategoryTabs from "@/components/CategoryTabs";
import PlaylistCard from "@/components/PlaylistCard";
import {
  getCategories,
  getCategoryPlaylists,
  searchPlaylists,
} from "@/lib/spotify";

async function PlaylistGrid({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const query = searchParams.q?.trim();

  if (query) {
    const playlists = await searchPlaylists(query);
    return (
      <section>
        <h2 className="text-white text-xl font-bold mb-6">
          Results for &ldquo;{query}&rdquo;
        </h2>
        {playlists.length === 0 ? (
          <p className="text-white/50 text-sm">No playlists found. Try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        )}
      </section>
    );
  }

  const categories = await getCategories();
  const activeCategoryId = searchParams.category ?? categories[0]?.id;
  const playlists = activeCategoryId ? await getCategoryPlaylists(activeCategoryId) : [];
  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <section>
      <Suspense>
        <CategoryTabs categories={categories} />
      </Suspense>
      <h2 className="text-white text-xl font-bold mt-8 mb-6">
        {activeCategory?.name ?? "Featured"} Playlists
      </h2>
      {playlists.length === 0 ? (
        <p className="text-white/50 text-sm">No playlists available for this category.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.map((p) => (
            <PlaylistCard key={p.id} playlist={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function PlaylistSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-[#181818] rounded-lg p-4 animate-pulse">
          <div className="aspect-square w-full bg-[#282828] rounded-md mb-4" />
          <div className="h-4 bg-[#282828] rounded mb-2 w-3/4" />
          <div className="h-3 bg-[#282828] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  return (
    <div className="min-h-screen bg-[#121212]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 tracking-tight">
            Discover Your Next{" "}
            <span className="text-[#1DB954]">Favourite</span> Playlist
          </h1>
          <p className="text-white/50 text-lg mb-8">
            Browse thousands of curated playlists across every genre and mood
          </p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
        <Suspense fallback={<PlaylistSkeleton />}>
          <PlaylistGrid searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
