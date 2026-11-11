/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendApiUrl =
      process.env.BACKEND_API_URL ||
      (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.startsWith('/')
        ? process.env.NEXT_PUBLIC_API_URL
        : 'http://localhost:5000/api/v1');

    const backendBaseUrl =
      process.env.BACKEND_URL ||
      backendApiUrl.replace(/\/api\/v1\/?$/, '');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendApiUrl.replace(/\/$/, '')}/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendBaseUrl.replace(/\/$/, '')}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;

