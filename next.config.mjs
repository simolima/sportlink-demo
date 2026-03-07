/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warnings should not block the build (they are not errors)
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@emoji-mart/react', '@emoji-mart/data'],
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    missingSuspenseWithCSRBailout: false
  }
};
export default nextConfig;
