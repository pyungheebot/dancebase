import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SettingsProvider } from "@/hooks/use-settings";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SWRProvider } from "@/lib/swr/provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groop - 댄서를 위한 그룹 관리 서비스",
  description: "그룹을 만들고, 멤버를 관리하고, 연습 일정과 출석을 한 곳에서 관리하세요.",
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
        <AuthProvider>
          <SWRProvider>
            <SettingsProvider>
              <TooltipProvider>
                {children}
                <Toaster richColors position="top-center" />
              </TooltipProvider>
            </SettingsProvider>
          </SWRProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
