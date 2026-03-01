import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; projectId: string; postId: string }>;
}): Promise<Metadata> {
  const { id, projectId, postId } = await params;
  const supabase = await createClient();

  const [{ data: post }, { data: group }, { data: project }] = await Promise.all([
    supabase
      .from("board_posts")
      .select("title, content")
      .eq("id", postId)
      .is("deleted_at", null)
      .single(),
    supabase.from("groups").select("name").eq("id", id).single(),
    supabase.from("projects").select("name").eq("id", projectId).single(),
  ]);

  const postTitle = post?.title ?? "게시글";
  const groupName = group?.name ?? "그룹";
  const projectName = project?.name ?? "프로젝트";
  const description = post?.content
    ? post.content.slice(0, 120).replace(/\n/g, " ")
    : `${groupName} - ${projectName} 게시판`;

  return {
    title: `${postTitle} - ${projectName} - ${groupName} - Groop`,
    description,
    openGraph: {
      title: `${postTitle} - ${projectName} - ${groupName} - Groop`,
      description,
      siteName: "Groop",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title: `${postTitle} - ${projectName} - Groop`,
      description,
    },
  };
}

export default function ProjectBoardPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
