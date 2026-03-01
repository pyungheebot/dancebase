import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드 - Groop",
  description: "내 그룹, 오늘의 일정, 최근 알림을 한눈에 확인하세요.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
