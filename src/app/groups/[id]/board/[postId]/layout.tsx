import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}): Promise<Metadata> {
  const { id, postId } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: group }] = await Promise.all([
    supabase
      .from("board_posts")
      .select("title, content")
      .eq("id", postId)
      .is("deleted_at", null)
      .single(),
    supabase.from("groups").select("name").eq("id", id).single(),
  ]);

  const postTitle = post?.title ?? "게시글";
  const groupName = group?.name ?? "그룹";
  const description = post?.content
    ? post.content.slice(0, 120).replace(/\n/g, " ")
    : `${groupName} 게시판`;

  return {
    title: `${postTitle} - ${groupName} - Groop`,
    description,
    openGraph: {
      title: `${postTitle} - ${groupName} - Groop`,
      description,
      siteName: "Groop",
      locale: "ko_KR",
    },
  };
}

export default function BoardPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
