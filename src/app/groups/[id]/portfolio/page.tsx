import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GroupPortfolioPage } from "@/components/groups/group-portfolio-page";

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

  return {
    title: group ? `${group.name} 포트폴리오 | Groop` : "포트폴리오 | Groop",
    description: group?.description ?? "댄스 그룹 포트폴리오",
    openGraph: {
      title: group ? `${group.name} 포트폴리오` : "그룹 포트폴리오",
      description: group?.description ?? "댄스 그룹 포트폴리오",
    },
  };
}

export default async function GroupPortfolioRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 그룹 visibility 확인 (공개 여부)
  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, visibility")
    .eq("id", id)
    .single();

  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-base font-medium">그룹을 찾을 수 없습니다.</p>
          <p className="text-sm text-muted-foreground">
            URL을 확인하거나 그룹 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    );
  }

  if (group.visibility === "private") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-base font-medium">비공개 그룹입니다.</p>
          <p className="text-sm text-muted-foreground">
            이 그룹의 포트폴리오는 공개되어 있지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  return <GroupPortfolioPage groupId={id} />;
}
