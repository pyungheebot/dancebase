import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "탐색 - Groop",
  description:
    "공개 댄스 그룹과 프로젝트를 탐색하고 새로운 팀에 합류해보세요.",
  openGraph: {
    title: "탐색 - Groop",
    description:
      "공개 댄스 그룹과 프로젝트를 탐색하고 새로운 팀에 합류해보세요.",
    siteName: "Groop",
    locale: "ko_KR",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
