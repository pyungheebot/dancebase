"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ClipboardCheck,
  UserPlus,
  CheckCircle2,
  Circle,
  Award,
} from "lucide-react";
import { useOnboardingProgressTracker } from "@/hooks/use-onboarding-progress-tracker";
import type { MemberOnboardingProgress, OnboardingItemStatus } from "@/types";

// ============================================
// Props
// ============================================

type OnboardingProgressPanelProps = {
  groupId: string;
};

// ============================================
// 가입일 → N일 전 포맷
// ============================================

function formatDaysAgo(joinedAt: string): string {
  const joined = new Date(joinedAt);
  const now = new Date();
  const diffMs = now.getTime() - joined.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "오늘 가입";
  if (diffDays === 1) return "1일 전 가입";
  return `${diffDays}일 전 가입`;
}

// ============================================
// 체크리스트 항목 행
// ============================================

function ChecklistItem({ item }: { item: OnboardingItemStatus }) {
  return (
    <li className="flex items-center gap-1.5">
      {item.isDone ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      ) : (
        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
      )}
      <span
        className={`text-xs leading-snug ${
          item.isDone ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
        }`}
      >
        {item.label}
      </span>
    </li>
  );
}

// ============================================
// 멤버 카드
// ============================================

function MemberProgressCard({ member }: { member: MemberOnboardingProgress }) {
  const initial = member.name?.charAt(0)?.toUpperCase() ?? "U";
  const daysAgo = formatDaysAgo(member.joinedAt);

  return (
    <div className="rounded-lg border p-3 space-y-2.5">
      {/* 헤더: 아바타 + 이름 + 가입일 + 축하 배지 */}
      <div className="flex items-center gap-2.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs font-medium">{initial}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-medium truncate">{member.name}</p>
            {member.isAllDone && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 flex items-center gap-0.5">
                <Award className="h-2.5 w-2.5" />
                완료
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{daysAgo}</p>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 shrink-0 ${
            member.isAllDone
              ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              : member.completionRate >= 60
              ? "bg-blue-100 text-blue-700 border-blue-200"
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}
        >
          {member.completionRate}%
        </Badge>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            member.isAllDone
              ? "bg-green-500"
              : member.completionRate >= 60
              ? "bg-blue-500"
              : "bg-gray-400"
          }`}
          style={{ width: `${member.completionRate}%` }}
        />
      </div>

      {/* 체크리스트 */}
      <ul className="space-y-1">
        {member.items.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

// ============================================
// 메인 패널 컴포넌트
// ============================================

export function OnboardingProgressPanel({ groupId }: OnboardingProgressPanelProps) {
  const [open, setOpen] = useState(false);
  const { data, loading } = useOnboardingProgressTracker(groupId);

  const totalCount = data?.totalCount ?? 0;
  const averageRate = data?.averageCompletionRate ?? 0;
  const allDoneCount = data?.allDoneCount ?? 0;
  const members = data?.members ?? [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          온보딩 추적
          {totalCount > 0 && (
            <Badge className="text-[10px] px-1 py-0 ml-0.5 bg-blue-100 text-blue-700 border-blue-200">
              {totalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-80 sm:max-w-sm flex flex-col gap-0 p-0">
        {/* 시트 헤더 */}
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            멤버 온보딩 추적
          </SheetTitle>

          {/* 전체 요약 */}
          {!loading && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <UserPlus className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  신규 멤버{" "}
                  <span className="font-medium text-foreground">{totalCount}명</span>
                </span>
              </div>
              <span className="text-muted-foreground/40 text-xs">·</span>
              <span className="text-xs text-muted-foreground">
                평균{" "}
                <span className="font-medium text-foreground">{averageRate}%</span>{" "}
                완료
              </span>
              {allDoneCount > 0 && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">
                    완료{" "}
                    <span className="font-medium text-green-600">{allDoneCount}명</span>
                  </span>
                </>
              )}
            </div>
          )}

          {/* 전체 평균 프로그레스 바 */}
          {!loading && totalCount > 0 && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${averageRate}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                최근 30일 내 가입한 신규 멤버 기준
              </p>
            </div>
          )}
        </SheetHeader>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading ? (
            /* 로딩 스켈레톤 */
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 space-y-2.5 animate-pulse"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-muted" />
                      <div className="h-2.5 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-4 w-8 rounded bg-muted" />
                  </div>
                  <div className="h-1.5 rounded-full bg-muted" />
                  <div className="space-y-1">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <div key={j} className="h-3 w-full rounded bg-muted" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            /* 빈 상태 */
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  신규 멤버가 없습니다
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  최근 30일 내 가입한 멤버가 없습니다.
                </p>
              </div>
            </div>
          ) : (
            /* 멤버 카드 목록 */
            members.map((member) => (
              <MemberProgressCard key={member.userId} member={member} />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
