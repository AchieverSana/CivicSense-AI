/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained .next/standalone folder with only the deps
  // actually used at runtime — keeps the Cloud Run container image small.
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
