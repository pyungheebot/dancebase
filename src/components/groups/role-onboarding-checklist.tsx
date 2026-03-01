"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChevronDown, ChevronUp, ListChecks } from "lucide-react";

// ============================================
// 체크리스트 항목 타입
// ============================================

type ChecklistItem = {
  id: string;
  label: string;
  href?: string;
};

// ============================================
// 역할별 체크리스트 항목 정의
// ============================================

const LEADER_ITEMS: ChecklistItem[] = [
  { id: "profile", label: "그룹 프로필 설정 (이름, 설명, 이미지)", href: "settings" },
  { id: "invite", label: "초대 링크 공유하기" },
  { id: "board-category", label: "게시판 카테고리 설정", href: "settings" },
  { id: "finance-category", label: "회비 카테고리 설정", href: "settings" },
  { id: "schedule", label: "첫 번째 일정 생성", href: "schedule" },
  { id: "welcome", label: "멤버에게 환영 메시지 보내기", href: "members" },
];

const SUB_LEADER_ITEMS: ChecklistItem[] = [
  { id: "rules", label: "그룹 규칙 확인하기", href: "settings" },
  { id: "members", label: "멤버 목록 확인하기", href: "members" },
  { id: "board", label: "게시판 살펴보기", href: "board" },
  { id: "schedule", label: "일정 확인하기", href: "schedule" },
];

// ============================================
// localStorage 키 헬퍼
// ============================================

function getStorageKey(groupId: string, role: "leader" | "sub_leader") {
  return `role-onboarding-${groupId}-${role}`;
}

function getHiddenKey(groupId: string, role: "leader" | "sub_leader") {
  return `role-onboarding-${groupId}-${role}-hidden`;
}

// ============================================
// Props
// ============================================

type RoleOnboardingChecklistProps = {
  groupId: string;
  role: "leader" | "sub_leader" | "member";
};

// ============================================
// 컴포넌트
// ============================================

export function RoleOnboardingChecklist({ groupId, role }: RoleOnboardingChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [hidden, setHidden] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 리더/서브리더에게만 표시
  const isEligible = role === "leader" || role === "sub_leader";

  const items = role === "leader" ? LEADER_ITEMS : SUB_LEADER_ITEMS;
  const checkedCount = items.filter((item) => checked[item.id]).length;
  const totalCount = items.length;
  const isAllCompleted = checkedCount === totalCount;
  const progressPct = Math.round((checkedCount / totalCount) * 100);

  // SSR 호환: useEffect에서 localStorage 읽기
  useEffect(() => {
    if (!isEligible) return;

    const hiddenKey = getHiddenKey(groupId, role as "leader" | "sub_leader");
    const storageKey = getStorageKey(groupId, role as "leader" | "sub_leader");

    const isHidden = localStorage.getItem(hiddenKey) === "true";
    let storedChecked: Record<string, boolean> | null = null;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) storedChecked = JSON.parse(stored);
    } catch {
      // 파싱 오류 무시
    }

    startTransition(() => {
      setHidden(isHidden);
      if (storedChecked) setChecked(storedChecked);
      setMounted(true);
    });
  }, [groupId, role, isEligible]);

  // 체크 상태 변경 시 localStorage 저장
  const handleCheck = (itemId: string, value: boolean) => {
    const newChecked = { ...checked, [itemId]: value };
    setChecked(newChecked);
    try {
      localStorage.setItem(
        getStorageKey(groupId, role as "leader" | "sub_leader"),
        JSON.stringify(newChecked)
      );
    } catch {
      // 저장 실패 무시
    }
  };

  // 체크리스트 숨기기
  const handleHide = () => {
    try {
      localStorage.setItem(getHiddenKey(groupId, role as "leader" | "sub_leader"), "true");
    } catch {
      // 저장 실패 무시
    }
    setHidden(true);
  };

  // 렌더링 조건: 비대상 역할, 숨김, 마운트 전
  if (!isEligible || !mounted || hidden) return null;

  const roleLabel = role === "leader" ? "리더" : "서브리더";

  return (
    <Card className="mb-3 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
      <CardHeader className="pb-0 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              {roleLabel} 온보딩 체크리스트
            </CardTitle>
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                isAllCompleted
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
              }`}
              variant="outline"
            >
              {checkedCount}/{totalCount}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* 프로그레스 바 */}
        {!collapsed && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-blue-100 dark:bg-blue-900 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-2">
          {/* 전체 완료 축하 메시지 */}
          {isAllCompleted ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">모든 항목을 완료했습니다!</span>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {roleLabel}로서 기본 설정이 모두 완료되었습니다.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs mt-1 border-green-300 text-green-700 hover:bg-green-50"
                onClick={handleHide}
              >
                체크리스트 숨기기
              </Button>
            </div>
          ) : (
            <>
              {/* 체크리스트 항목 목록 */}
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`onboarding-${item.id}`}
                      checked={!!checked[item.id]}
                      onCheckedChange={(val) => handleCheck(item.id, !!val)}
                      className="h-3.5 w-3.5 shrink-0"
                    />
                    <label
                      htmlFor={`onboarding-${item.id}`}
                      className={`text-xs flex-1 cursor-pointer leading-snug ${
                        checked[item.id]
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </label>
                    {item.href && !checked[item.id] && (
                      <Link
                        href={`/groups/${groupId}/${item.href}`}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                      >
                        바로가기
                      </Link>
                    )}
                  </li>
                ))}
              </ul>

              {/* 하단 안내 문구 */}
              <p className="text-[10px] text-muted-foreground mt-2">
                완료한 항목을 체크하며 초기 설정을 진행하세요.
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
