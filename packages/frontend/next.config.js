/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['pica.zhimg.com', 'picx.zhimg.com', 'pic1.zhimg.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:8080/socket.io/:path*',
      },
    ];
  },
}

module.exports = nextConfig
