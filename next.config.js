/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Lint runs in CI separately; don't let it block production builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.scdn.co' },
      { protocol: 'https', hostname: '*.spotifycdn.com' },
    ],
  },
};

module.exports = nextConfig;
