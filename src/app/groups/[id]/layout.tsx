import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("name, description, group_type, dance_genre")
    .eq("id", id)
    .single();

  const groupName = group?.name ?? "그룹";

  const descParts: string[] = [];
  if (group?.group_type) descParts.push(group.group_type);
  if (group?.dance_genre && group.dance_genre.length > 0) {
    descParts.push(group.dance_genre.join(", "));
  }
  if (group?.description) descParts.push(group.description);

  const description =
    descParts.length > 0
      ? descParts.join(" · ")
      : `${groupName} 그룹 관리 페이지`;

  return {
    title: `${groupName} - Groop`,
    description,
    openGraph: {
      title: `${groupName} - Groop`,
      description,
      siteName: "Groop",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: `${groupName} - Groop`,
      description,
    },
  };
}

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
