/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    missingSuspenseWithCSRBailout: false
  }
};
export default nextConfig;
