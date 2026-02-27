"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from "lucide-react";
import { useOnboardingTasks } from "@/hooks/use-onboarding-tasks";
import type { OnboardingTaskItem } from "@/types";

// ============================================
// Props
// ============================================

type OnboardingTaskChecklistCardProps = {
  groupId: string;
  userId: string;
};

// ============================================
// 과제 항목 행
// ============================================

function TaskRow({
  task,
  onToggle,
}: {
  task: OnboardingTaskItem;
  onToggle: (id: string) => void;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Checkbox
        id={`onboarding-task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5 shrink-0"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={`onboarding-task-${task.id}`}
          className={`text-xs font-medium cursor-pointer leading-snug block ${
            task.completed
              ? "line-through text-muted-foreground"
              : "text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            {task.completed ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 text-muted-foreground/40" />
            )}
            {task.title}
          </span>
        </label>
        {!task.completed && (
          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 pl-4">
            {task.description}
          </p>
        )}
      </div>
    </li>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function OnboardingTaskChecklistCard({
  groupId,
  userId,
}: OnboardingTaskChecklistCardProps) {
  const {
    tasks,
    completedCount,
    totalCount,
    completionRate,
    isAllDone,
    isDismissed,
    mounted,
    toggleTask,
    dismiss,
  } = useOnboardingTasks(groupId, userId);

  // 전체 완료 시 카드 자동 접힘
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (isAllDone) {
      setOpen(false);
    }
  }, [isAllDone]);

  // 마운트 전 또는 건너뛰기 상태이면 렌더링 안함
  if (!mounted || isDismissed) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="mb-3 border-primary/20 bg-primary/5">
        {/* 카드 헤더 */}
        <CardHeader className="pb-0 pt-3 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                신규 멤버 온보딩
              </span>
            </div>
            <CollapsibleTrigger asChild>
              <button
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                aria-label={open ? "온보딩 접기" : "온보딩 펼치기"}
              >
                <span>
                  {completedCount}/{totalCount}
                </span>
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </CollapsibleTrigger>
          </div>

          {/* 프로그레스 바 */}
          <div className="mt-2 space-y-1">
            <Progress value={completionRate} className="h-1.5" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {completedCount}/{totalCount} 완료
              </span>
              <span className="text-[10px] font-medium text-primary">
                {completionRate}%
              </span>
            </div>
          </div>
        </CardHeader>

        {/* 접히는 콘텐츠 영역 */}
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-2">
            {/* 전체 완료 축하 배너 */}
            {isAllDone ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2.5 mt-1">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                    온보딩 완료!
                  </p>
                  <p className="text-[10px] text-green-600/80 dark:text-green-500/80 mt-0.5">
                    모든 과제를 완료했습니다. 즐거운 활동 되세요!
                  </p>
                </div>
              </div>
            ) : null}

            {/* 과제 목록 */}
            <ul className="space-y-2.5 mt-2">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))}
            </ul>

            {/* 하단: 건너뛰기 링크 */}
            {!isAllDone && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={dismiss}
                  className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  건너뛰기
                </button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
