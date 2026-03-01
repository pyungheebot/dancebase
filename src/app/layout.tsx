import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SettingsProvider } from "@/hooks/use-settings";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SWRProvider } from "@/lib/swr/provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaInstallPrompt } from "@/components/shared/pwa-install-prompt";
import { WebVitalsReporter } from "@/components/shared/web-vitals-reporter";
import { OfflineBanner } from "@/components/shared/offline-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: {
    default: "Groop - 댄서를 위한 그룹 관리 서비스",
    template: "%s",
  },
  description: "그룹을 만들고, 멤버를 관리하고, 연습 일정과 출석을 한 곳에서 관리하세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Groop",
  },
  icons: {
    apple: "/icons/icon-192.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Groop - 댄서를 위한 그룹 관리 서비스",
    description: "일정 관리, 출석 체크, 회비 정산, 게시판까지. 댄스 그룹 운영에 필요한 모든 것.",
    url: "https://dancebase.app",
    siteName: "Groop",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Groop - 댄서를 위한 그룹 관리 서비스",
    description: "일정 관리, 출석 체크, 회비 정산, 게시판까지. 댄스 그룹 운영에 필요한 모든 것.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:border focus:shadow-lg"
        >
          본문으로 건너뛰기
        </a>
        <OfflineBanner />
        <Script id="sw-register" strategy="afterInteractive">
          {`if("serviceWorker" in navigator){navigator.serviceWorker.register("/sw.js");}`}
        </Script>
        <AuthProvider>
          <SWRProvider>
            <SettingsProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors position="top-center" />
                <PwaInstallPrompt />
                <WebVitalsReporter />
              </TooltipProvider>
            </SettingsProvider>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
