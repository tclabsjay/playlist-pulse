/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Covers all Spotify CDN hostnames (i.scdn.co, mosaic.scdn.co, etc.)
      { protocol: 'https', hostname: '*.scdn.co' },
      { protocol: 'https', hostname: '*.spotifycdn.com' },
    ],
  },
};

module.exports = nextConfig;
