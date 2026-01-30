/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config acknowledges Turbopack as default bundler in Next.js 16+
  // This prevents the build warning about using Turbopack without explicit config
  turbopack: {},
}

module.exports = nextConfig
