import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinClient } from "./join-client";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  // 초대 코드로 그룹 조회
  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, description, group_type, join_policy, dance_genre, invite_code_enabled, invite_code_expires_at")
    .eq("invite_code", code)
    .single();

  // 그룹이 없거나 오류인 경우
  if (error || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
          <p className="text-2xl">찾을 수 없음</p>
          <p className="text-sm text-muted-foreground">
            유효하지 않은 초대 링크입니다
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 초대 코드 비활성화 체크
  if (group.invite_code_enabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
          <p className="text-2xl">초대 링크 비활성화</p>
          <p className="text-sm text-muted-foreground">
            현재 이 초대 링크는 비활성화되어 있습니다
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 만료일 체크
  if (group.invite_code_expires_at) {
    const expiresAt = new Date(group.invite_code_expires_at);
    if (expiresAt < new Date()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-sidebar">
          <div className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
            <p className="text-2xl">초대 링크 만료</p>
            <p className="text-sm text-muted-foreground">
              이 초대 링크는 만료되었습니다
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      );
    }
  }

  // 로그인 여부 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 비로그인: 로그인 페이지로 리다이렉트 (code 쿼리 파라미터 포함)
  if (!user) {
    redirect(`/login?invite=${code}`);
  }

  // 이미 멤버인지 확인
  const { data: existingMember } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    redirect(`/groups/${group.id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Groop</h1>
          <p className="text-sm text-muted-foreground mt-1">그룹 참여 초대</p>
        </div>
        <div className="bg-card border rounded-xl p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">그룹에 참여하시겠습니까?</h2>
          <JoinClient group={group} inviteCode={code} />
        </div>
      </div>
    </div>
  );
}
