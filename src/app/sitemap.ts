import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://dancebase.app", lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: "https://dancebase.app/login", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://dancebase.app/signup", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://dancebase.app/explore", lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const supabase = await createClient();
    const { data: groups } = await supabase
      .from("groups")
      .select("id, updated_at")
      .limit(500);

    if (groups) {
      const groupPages = groups.map((g) => ({
        url: `https://dancebase.app/groups/${g.id}`,
        lastModified: g.updated_at ? new Date(g.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
      return [...staticPages, ...groupPages];
    }
  } catch {
    // 서버 사이드 조회 실패 시 정적 페이지만 반환
  }

  return staticPages;
}
