/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['pica.zhimg.com', 'picx.zhimg.com', 'pic1.zhimg.com'],
  },
}

module.exports = nextConfig
