import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: process.env.NEXT_PUBLIC_APP_URL || 'https://carrot-market-reloaded.vercel.app' 
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  logging: {
    fetches: {
      fullUrl: true,
    }
  },
  // 추후에 다시 설정할 것
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
    ],
  },
  // preload 경고 해결을 위한 설정
  experimental: {
    optimizeCss: true,
    optimisticClientCache: true,
  },
  // 이미지 최적화 방지를 위한 설정
  reactStrictMode: true,
  // 클라우드플레어 API 요청에 대한 리디렉션 처리
  async redirects() {
    return [
      {
        source: '/api/cloudflare-upload',
        destination: '/api/image/cloudflare-upload',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
