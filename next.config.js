/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dvtdjyxhiqucvzadluhv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true,
  },
}

module.exports = nextConfig
