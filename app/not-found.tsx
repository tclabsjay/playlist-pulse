import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-[#1DB954] text-6xl font-extrabold mb-4">404</h1>
      <p className="text-white text-xl font-semibold mb-2">Page not found</p>
      <p className="text-white/50 text-sm mb-8">The playlist or page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="bg-white text-black font-bold text-sm px-6 py-3 rounded-full hover:scale-105 transition-transform"
      >
        Go Home
      </Link>
    </div>
  );
}
