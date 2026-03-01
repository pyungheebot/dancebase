"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMemberPairing } from "@/hooks/use-member-pairing";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Users, Heart, MessageSquare, X, Star, RotateCcw } from "lucide-react";
import type { EntityMember } from "@/types/entity-context";
import type { PairingRecommendation } from "@/types";

// ============================================
// 호환성 점수 → 별 표시
// ============================================

function CompatibilityStars({ score }: { score: number }) {
  // 0~100 점수를 0~5 별로 변환
  const starCount = Math.round((score / 100) * 5);
  return (
    <div className="flex items-center gap-0.5" title={`${score}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < starCount
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted-foreground"
          }`}
        />
      ))}
      <span className="ml-1 text-[10px] text-muted-foreground">{score}%</span>
    </div>
  );
}

// ============================================
// 유사 항목 배지
// ============================================

const SIMILARITY_TAG_STYLES: Record<string, string> = {
  "출석률 유사": "bg-blue-100 text-blue-700",
  "활동 유사": "bg-green-100 text-green-700",
  "가입 시기 유사": "bg-purple-100 text-purple-700",
};

// ============================================
// 추천 카드
// ============================================

function RecommendationCard({
  rec,
  onDismiss,
}: {
  rec: PairingRecommendation;
  onDismiss: (userId: string) => void;
}) {
  const router = useRouter();
  const initials = rec.name.charAt(0).toUpperCase();

  const handleDm = () => {
    router.push(`/messages/${rec.userId}`);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      {/* 상단: 아바타 + 이름 + 닫기 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{rec.name}</p>
            <CompatibilityStars score={rec.score} />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          title="관심 없음"
          aria-label="관심 없음"
          onClick={() => onDismiss(rec.userId)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 유사 항목 배지 */}
      {rec.similarityTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rec.similarityTags.map((tag) => (
            <Badge
              key={tag}
              className={`text-[10px] px-1.5 py-0 font-normal hover:opacity-80 ${
                SIMILARITY_TAG_STYLES[tag] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleDm}
        >
          <MessageSquare className="h-3 w-3 mr-1" />
          DM 보내기
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 빈 상태
// ============================================

function EmptyPairingState({ memberCount }: { memberCount: number }) {
  if (memberCount < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Users className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            멤버가 부족합니다
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            학습 파트너 추천을 위해 최소 2명의 멤버가 필요합니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
      <Heart className="h-10 w-10 text-muted-foreground/40" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          추천 파트너가 없습니다
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          모든 추천을 숨겼거나 데이터가 부족합니다.
        </p>
      </div>
    </div>
  );
}

// ============================================
// MemberPairingPanel (메인 컴포넌트)
// ============================================

type MemberPairingPanelProps = {
  groupId: string;
  members: EntityMember[];
  currentUserId: string;
  /** Sheet를 외부에서 트리거할 때 사용 (children으로 SheetTrigger 포함) */
  trigger?: React.ReactNode;
};

export function MemberPairingPanel({
  groupId,
  members,
  currentUserId,
  trigger,
}: MemberPairingPanelProps) {
  const [open, setOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  const {
    visibleRecommendations,
    dismissedRecommendations,
    loading,
    dismiss,
    restore,
    restoreAll,
  } = useMemberPairing(groupId, members, currentUserId);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Users className="h-3 w-3 mr-1" />
            학습 파트너 찾기
          </Button>
        </SheetTrigger>
      )}

      <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0">
        {/* 헤더 */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500 shrink-0" />
            <SheetTitle className="text-sm font-semibold">
              학습 파트너 추천
            </SheetTitle>
            {visibleRecommendations.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700 hover:bg-pink-100 ml-auto">
                {visibleRecommendations.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            출석 패턴과 활동 수준이 비슷한 멤버를 추천합니다.
          </p>
        </SheetHeader>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : visibleRecommendations.length === 0 ? (
            <EmptyPairingState memberCount={members.length} />
          ) : (
            visibleRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.userId}
                rec={rec}
                onDismiss={dismiss}
              />
            ))
          )}

          {/* 숨긴 추천 섹션 */}
          {dismissedRecommendations.length > 0 && (
            <div className="pt-1">
              <Separator className="mb-3" />
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setShowDismissed((v) => !v)}
                  className="text-[11px] text-muted-foreground hover:text-foreground underline"
                >
                  {showDismissed
                    ? "숨긴 추천 접기"
                    : `숨긴 추천 보기 (${dismissedRecommendations.length})`}
                </button>
                {showDismissed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
                    onClick={restoreAll}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    전체 복원
                  </Button>
                )}
              </div>

              {showDismissed && (
                <div className="space-y-2 opacity-60">
                  {dismissedRecommendations.map((rec) => (
                    <div
                      key={rec.userId}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border bg-muted/20"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarFallback className="text-[10px]">
                            {rec.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate">{rec.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {rec.score}%
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[11px] px-2 shrink-0"
                        onClick={() => restore(rec.userId)}
                      >
                        복원
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
