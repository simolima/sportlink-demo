/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warnings should not block the build (they are not errors)
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    missingSuspenseWithCSRBailout: false
  }
};
export default nextConfig;
