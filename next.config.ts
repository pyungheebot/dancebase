import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js 인라인 스크립트 + SW 등록 인라인 + 카카오 우편번호 API
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://t1.daumcdn.net",
  // 인라인 스타일 + Google Fonts (출석 증명서)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // 이미지: Supabase 스토리지, QR 코드, YouTube 썸네일, OpenStreetMap 타일
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://api.qrserver.com https://img.youtube.com https://*.tile.openstreetmap.org https://*.openstreetmap.org",
  // API + Supabase Realtime WebSocket
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
  // iframe 임베드: Spotify / YouTube / OpenStreetMap
  "frame-src https://open.spotify.com https://www.youtube.com https://www.youtube-nocookie.com https://www.openstreetmap.org",
  // Google Fonts 웹폰트 파일
  "font-src 'self' https://fonts.gstatic.com",
  // 오디오(메트로놈 Web Audio API)
  "media-src 'self' blob:",
  // Service Worker
  "worker-src 'self'",
  // 플러그인 객체 금지
  "object-src 'none'",
  // base 태그 제한
  "base-uri 'self'",
  // 폼 제출 제한
  "form-action 'self'",
  // 다른 사이트에서 iframe 삽입 금지 (X-Frame-Options: DENY 와 동일)
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "api.qrserver.com" },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
