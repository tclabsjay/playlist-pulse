"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SpotifyCategory } from "@/lib/spotify";

export default function CategoryTabs({ categories }: { categories: SpotifyCategory[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? categories[0]?.id ?? "";

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => router.push(`/?category=${cat.id}`)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === cat.id
              ? "bg-[#1DB954] text-black"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
