"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useMemberOnboarding } from "@/hooks/use-member-onboarding";

// ============================================
// Props
// ============================================

type MemberOnboardingChecklistProps = {
  groupId: string;
  userId: string;
  joinedAt: string | null;
};

// ============================================
// 컴포넌트
// ============================================

export function MemberOnboardingChecklist({
  groupId,
  userId,
  joinedAt,
}: MemberOnboardingChecklistProps) {
  const {
    items,
    toggleItem,
    dismissOnboarding,
    isNewMember,
    completionRate,
    isAllDone,
    isDismissed,
    mounted,
  } = useMemberOnboarding(groupId, userId, joinedAt);

  // 마운트 전, 신규 멤버 아님, 또는 숨김 상태면 렌더링 안함
  if (!mounted || !isNewMember || isDismissed) return null;

  return (
    <Card className="mb-3 border-primary/20 bg-primary/5">
      <CardHeader className="pb-0 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              환영합니다! 🎉
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${
                isAllDone
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              {completionRate}%
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={dismissOnboarding}
            aria-label="온보딩 닫기"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* 프로그레스 바 */}
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-primary/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 pb-3 pt-2">
        {isAllDone ? (
          /* 전체 완료 축하 메시지 */
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                모든 온보딩을 완료했습니다!
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              그룹에 완전히 합류했습니다. 즐거운 활동 되세요!
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs mt-1 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
              onClick={dismissOnboarding}
            >
              체크리스트 닫기
            </Button>
          </div>
        ) : (
          <>
            {/* 체크리스트 항목 목록 */}
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`member-onboarding-${item.id}`}
                    checked={item.isDone}
                    onCheckedChange={() => toggleItem(item.id)}
                    className="h-3.5 w-3.5 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`member-onboarding-${item.id}`}
                      className={`text-xs font-medium cursor-pointer leading-snug block ${
                        item.isDone
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.title}
                    </label>
                    {!item.isDone && (
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  {item.link && !item.isDone && (
                    <Link
                      href={`/groups/${groupId}/${item.link}`}
                      className="shrink-0"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px] text-primary hover:bg-primary/10"
                        tabIndex={-1}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* 하단 안내 문구 */}
            <p className="text-[10px] text-muted-foreground mt-2.5">
              완료한 항목을 체크하며 그룹 활동을 시작해보세요.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
