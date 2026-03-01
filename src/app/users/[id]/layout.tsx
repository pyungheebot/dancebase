import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, bio, dance_genre, active_region")
    .eq("id", id)
    .single();

  const userName = profile?.name ?? "사용자";

  const descParts: string[] = [];
  if (profile?.dance_genre && profile.dance_genre.length > 0) {
    descParts.push(profile.dance_genre.join(", "));
  }
  if (profile?.active_region) {
    descParts.push(profile.active_region);
  }
  if (profile?.bio) {
    descParts.push(profile.bio.slice(0, 80));
  }

  const description =
    descParts.length > 0
      ? descParts.join(" · ")
      : `${userName}의 Groop 프로필`;

  return {
    title: `${userName} - Groop`,
    description,
    openGraph: {
      title: `${userName} - Groop`,
      description,
      siteName: "Groop",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: `${userName} - Groop`,
      description,
    },
  };
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
