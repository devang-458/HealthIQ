/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', process.env.NEXT_PUBLIC_API_URL],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
