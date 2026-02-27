"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Rocket, X, Loader2 } from "lucide-react";
import { useOnboardingStatus } from "@/hooks/use-onboarding-status";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "onboarding-dismissed";

type Step = {
  key: "profileComplete" | "hasGroup" | "hasActivity";
  label: string;
  description: string;
  href: string;
};

const STEPS: Step[] = [
  {
    key: "profileComplete",
    label: "프로필 완성",
    description: "아바타 또는 자기소개를 등록하세요",
    href: "/profile",
  },
  {
    key: "hasGroup",
    label: "그룹 참여",
    description: "그룹에 가입하거나 새 그룹을 만들어보세요",
    href: "/explore",
  },
  {
    key: "hasActivity",
    label: "첫 활동",
    description: "게시글 또는 댓글을 작성해보세요",
    href: "#",
  },
];

export function OnboardingGuide() {
  const { user } = useAuth();
  const { status, loading } = useOnboardingStatus();
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  // localStorage 읽기 (클라이언트 사이드)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === "true");
  }, []);

  const allDone =
    status.profileComplete && status.hasGroup && status.hasActivity;

  const completedCount = [
    status.profileComplete,
    status.hasGroup,
    status.hasActivity,
  ].filter(Boolean).length;

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  }

  // 로그인하지 않은 경우 렌더링 안 함
  if (!user) return null;

  // localStorage 초기화 전(null)이거나 이미 닫은 경우 렌더링 안 함
  if (dismissed === null || dismissed) return null;

  return (
    <section aria-label="시작 가이드">
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-blue-700">
              <Rocket className="h-4 w-4" aria-hidden="true" />
              시작하기
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
              aria-label="온보딩 가이드 닫기"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* 진행 상황 */}
          {!loading && (
            <p className="text-[11px] text-blue-600 mt-0.5">
              {allDone
                ? "모든 단계를 완료했어요!"
                : `${completedCount}/3 단계 완료`}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-2" aria-busy="true">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">불러오는 중...</span>
            </div>
          ) : allDone ? (
            /* 모든 단계 완료 */
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-green-500 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium text-green-700">
                  DanceBase 준비 완료! 즐거운 활동을 시작해보세요.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleDismiss}
              >
                닫기
              </Button>
            </div>
          ) : (
            /* 단계 체크리스트 */
            <ul className="space-y-2" aria-label="온보딩 단계 목록">
              {STEPS.map((step) => {
                const done = status[step.key];
                return (
                  <li key={step.key}>
                    {done ? (
                      /* 완료된 단계 */
                      <div
                        className="flex items-center gap-2 px-1 py-0.5"
                        aria-label={`완료: ${step.label}`}
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-green-500 shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-xs text-muted-foreground line-through">
                          {step.label}
                        </span>
                      </div>
                    ) : (
                      /* 미완료 단계 */
                      <Link
                        href={step.href}
                        className="flex items-center justify-between gap-2 rounded-md hover:bg-blue-100/60 transition-colors px-1 py-1 group"
                        aria-label={`미완료: ${step.label} - ${step.description}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3.5 w-3.5 rounded-full border-2 border-blue-300 shrink-0"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-blue-800 truncate">
                              {step.label}
                            </p>
                            <p className="text-[10px] text-blue-600/80 truncate">
                              {step.description}
                            </p>
                          </div>
                        </div>
                        <ArrowRight
                          className="h-3 w-3 text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform"
                          aria-hidden="true"
                        />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
