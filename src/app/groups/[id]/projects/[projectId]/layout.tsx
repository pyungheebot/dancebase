import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}): Promise<Metadata> {
  const { id, projectId } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: group }] = await Promise.all([
    supabase
      .from("projects")
      .select("name, description, type")
      .eq("id", projectId)
      .single(),
    supabase.from("groups").select("name").eq("id", id).single(),
  ]);

  const projectName = project?.name ?? "프로젝트";
  const groupName = group?.name ?? "그룹";
  const description = project?.description
    ? project.description
    : `${groupName}의 ${projectName} 프로젝트`;

  return {
    title: `${projectName} - ${groupName} - Groop`,
    description,
    openGraph: {
      title: `${projectName} - ${groupName} - Groop`,
      description,
      siteName: "Groop",
      locale: "ko_KR",
    },
  };
}

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
