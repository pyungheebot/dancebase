"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRolePromotionCandidates } from "@/hooks/use-role-promotion-candidates";
import { invalidateRolePromotionCandidates } from "@/lib/swr/invalidate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import type { EntityMember } from "@/types/entity-context";
import type { PromotionCandidate } from "@/hooks/use-role-promotion-candidates";

type RolePromotionSectionProps = {
  groupId: string;
  members: EntityMember[];
  onUpdate: () => void;
};

const DISMISSED_STORAGE_KEY = (groupId: string) =>
  `promotion-dismissed-${groupId}`;

function loadDismissed(groupId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY(groupId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {
    // JSON 파싱 실패 시 무시
  }
  return new Set();
}

function saveDismissed(groupId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DISMISSED_STORAGE_KEY(groupId),
      JSON.stringify(Array.from(ids))
    );
  } catch {
    // localStorage 쓰기 실패 시 무시
  }
}

export function RolePromotionSection({
  groupId,
  members,
  onUpdate,
}: RolePromotionSectionProps) {
  const { candidates, loading } = useRolePromotionCandidates(groupId, members);

  // 무시 목록 (localStorage에서 초기화)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // 클라이언트에서만 localStorage 읽기
  useEffect(() => {
    setDismissedIds(loadDismissed(groupId));
    setHydrated(true);
  }, [groupId]);

  // 승격 확인 다이얼로그 상태
  const [promoteTarget, setPromoteTarget] = useState<PromotionCandidate | null>(null);
  const [promoting, setPromoting] = useState(false);

  // 표시할 후보 (무시 목록 제외)
  const visibleCandidates = hydrated
    ? candidates.filter((c) => !dismissedIds.has(c.userId))
    : [];

  // 로딩 중이거나 후보가 없으면 렌더링하지 않음
  if (loading || !hydrated || visibleCandidates.length === 0) return null;

  const handleDismiss = (userId: string) => {
    const next = new Set(dismissedIds).add(userId);
    setDismissedIds(next);
    saveDismissed(groupId, next);
  };

  const handlePromoteConfirm = async () => {
    if (!promoteTarget) return;
    setPromoting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("group_members")
      .update({ role: "sub_leader" })
      .eq("id", promoteTarget.memberId);

    setPromoting(false);

    if (error) {
      toast.error("역할 승격에 실패했습니다");
      setPromoteTarget(null);
      return;
    }

    toast.success(`${promoteTarget.name}님이 부리더로 승격되었습니다`);

    // 무시 목록에서도 제거 (승격됐으니 불필요)
    const next = new Set(dismissedIds);
    next.delete(promoteTarget.userId);
    setDismissedIds(next);
    saveDismissed(groupId, next);

    setPromoteTarget(null);
    invalidateRolePromotionCandidates(groupId);
    onUpdate();
  };

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-green-600" />
              승격 후보 멤버
              <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                {visibleCandidates.length}명
              </Badge>
            </CardTitle>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            최근 3개월 출석률 80% 이상, 게시글 5건 이상, 가입 3개월 이상인 멤버입니다.
          </p>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="rounded-lg border divide-y">
            {visibleCandidates.map((candidate) => (
              <CandidateRow
                key={candidate.userId}
                candidate={candidate}
                onPromote={() => setPromoteTarget(candidate)}
                onDismiss={() => handleDismiss(candidate.userId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 승격 확인 다이얼로그 */}
      <AlertDialog
        open={!!promoteTarget}
        onOpenChange={(open) => {
          if (!open) setPromoteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>부리더로 승격</AlertDialogTitle>
            <AlertDialogDescription>
              {promoteTarget?.name}님을 부리더로 승격하시겠습니까?
              부리더는 멤버 관리 및 일부 그룹 설정 권한을 갖게 됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={promoting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteConfirm}
              disabled={promoting}
            >
              {promoting ? "승격 중..." : "승격하기"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ============================================================
// 개별 후보 행 컴포넌트
// ============================================================

type CandidateRowProps = {
  candidate: PromotionCandidate;
  onPromote: () => void;
  onDismiss: () => void;
};

function CandidateRow({ candidate, onPromote, onDismiss }: CandidateRowProps) {
  const joinedDate = new Date(candidate.joinedAt);
  const joinedLabel = joinedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const attendancePct = Math.round(candidate.attendanceRate * 100);

  return (
    <div className="flex items-center justify-between px-3 py-2.5 gap-2">
      {/* 아바타 + 이름/스탯 */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-xs">
            {candidate.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{candidate.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <span className="text-[10px] text-muted-foreground">
              출석률{" "}
              <span className="font-medium text-green-600">{attendancePct}%</span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              게시글{" "}
              <span className="font-medium text-blue-600">
                {candidate.postCount}건
              </span>
            </span>
            <span className="text-[10px] text-muted-foreground">
              가입일 {joinedLabel}
            </span>
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200">
              점수 {candidate.score}
            </Badge>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 border-green-300 text-green-700 hover:bg-green-50"
          onClick={onPromote}
        >
          부리더로 승격
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
          title="무시"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
