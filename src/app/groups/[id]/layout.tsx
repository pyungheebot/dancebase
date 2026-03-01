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
    .select("name, description")
    .eq("id", id)
    .single();

  const groupName = group?.name ?? "그룹";
  const description = group?.description
    ? `${group.description}`
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
  };
}

export default function GroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
