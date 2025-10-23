/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable static optimization to prevent environment variable issues during build
  trailingSlash: false,
  images: {
    domains: ['localhost'],
  },
  // Skip trying to generate static pages during build
  experimental: {
    outputFileTracingExcludes: {
      '*': ['**/*'],
    },
  },

}

module.exports = nextConfig