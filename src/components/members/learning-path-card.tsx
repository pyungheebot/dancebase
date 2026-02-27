"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useLearningPath } from "@/hooks/use-learning-path";
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  RotateCcw,
  Trash2,
  Plus,
} from "lucide-react";
import type { LearningStep, LearningStepStatus } from "@/types";

// -------------------------------------------------------
// 상수
// -------------------------------------------------------

const LEVELS = ["입문", "초급", "중급", "고급", "마스터"] as const;
const GENRES = [
  "힙합",
  "팝핀",
  "락킹",
  "하우스",
  "크럼프",
  "왁킹",
  "비보잉",
  "재즈",
  "걸스힙합",
  "케이팝",
] as const;

// -------------------------------------------------------
// 단계 상태별 스타일
// -------------------------------------------------------
function stepStyle(status: LearningStepStatus) {
  if (status === "completed") {
    return {
      dot: "bg-green-500 border-green-500",
      dotIcon: <CheckCircle2 className="h-3 w-3 text-white" />,
      line: "bg-green-300",
      card: "border-green-200 bg-green-50/50",
      badge: "bg-green-100 text-green-700 border-green-200",
      badgeLabel: "완료",
      text: "text-green-800",
    };
  }
  if (status === "in_progress") {
    return {
      dot: "bg-blue-500 border-blue-500 animate-pulse",
      dotIcon: <PlayCircle className="h-3 w-3 text-white" />,
      line: "bg-muted",
      card: "border-blue-200 bg-blue-50/50",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      badgeLabel: "진행 중",
      text: "text-blue-800",
    };
  }
  return {
    dot: "bg-muted border-muted-foreground/30",
    dotIcon: <Lock className="h-3 w-3 text-muted-foreground" />,
    line: "bg-muted",
    card: "border-border bg-muted/20",
    badge: "bg-muted text-muted-foreground border-muted",
    badgeLabel: "잠금",
    text: "text-muted-foreground",
  };
}

// -------------------------------------------------------
// 단계 카드
// -------------------------------------------------------
function StepCard({
  step,
  isLast,
  onComplete,
  onReset,
}: {
  step: LearningStep;
  isLast: boolean;
  onComplete: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = stepStyle(step.status);

  return (
    <div className="flex gap-3">
      {/* 타임라인 라인 + 점 */}
      <div className="flex flex-col items-center">
        <div
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${style.dot}`}
        >
          {style.dotIcon}
        </div>
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-[20px] mt-1 ${style.line}`} />
        )}
      </div>

      {/* 단계 내용 */}
      <div className="flex-1 pb-4">
        <div
          className={`rounded-lg border p-3 cursor-pointer ${style.card}`}
          onClick={() =>
            step.status !== "locked" && setExpanded((v) => !v)
          }
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-semibold ${
                    step.status === "locked"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {step.order}단계 · {step.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${style.badge}`}
                >
                  {style.badgeLabel}
                </Badge>
              </div>
              {step.status === "completed" && step.completedAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(step.completedAt).toLocaleDateString("ko-KR")} 완료
                </p>
              )}
            </div>
            {step.status !== "locked" && (
              <ChevronRight
                className={`h-3 w-3 flex-shrink-0 text-muted-foreground transition-transform ${
                  expanded ? "rotate-90" : ""
                }`}
              />
            )}
          </div>

          {/* 펼쳐진 상세 */}
          {expanded && step.status !== "locked" && (
            <div className="mt-2 pt-2 border-t border-border/60 space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.description}
              </p>
              {step.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {step.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {step.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete(step.id);
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    완료
                  </Button>
                )}
                {step.status === "completed" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReset(step.id);
                    }}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    되돌리기
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 경로 설정 폼
// -------------------------------------------------------
function SetupForm({
  onSubmit,
}: {
  onSubmit: (v: {
    currentLevel: string;
    targetLevel: string;
    genre: string;
  }) => void;
}) {
  const [currentLevel, setCurrentLevel] = useState<string>("입문");
  const [targetLevel, setTargetLevel] = useState<string>("중급");
  const [genre, setGenre] = useState<string>("힙합");

  function handleSubmit() {
    onSubmit({ currentLevel, targetLevel, genre });
  }

  return (
    <div className="space-y-4 py-2">
      <p className="text-xs text-muted-foreground">
        현재 레벨과 목표 레벨, 장르를 선택하면 맞춤 학습 단계가 자동으로 생성됩니다.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">현재 레벨</Label>
          <Select value={currentLevel} onValueChange={setCurrentLevel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">목표 레벨</Label>
          <Select value={targetLevel} onValueChange={setTargetLevel}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVELS.map((l) => (
                <SelectItem key={l} value={l} className="text-xs">
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">장르</Label>
        <Select value={genre} onValueChange={setGenre}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GENRES.map((g) => (
              <SelectItem key={g} value={g} className="text-xs">
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button size="sm" className="w-full h-8 text-xs" onClick={handleSubmit}>
        <Plus className="h-3 w-3 mr-1" />
        학습 경로 생성
      </Button>
    </div>
  );
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------
interface LearningPathCardProps {
  groupId: string;
  userId: string;
}

export function LearningPathCard({ groupId, userId }: LearningPathCardProps) {
  const { path, createPath, deletePath, completeStep, resetStep, getProgress } =
    useLearningPath(groupId, userId);

  const [open, setOpen] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const progress = getProgress();

  function handleCreate(input: {
    currentLevel: string;
    targetLevel: string;
    genre: string;
  }) {
    createPath(input);
    setShowSetup(false);
  }

  function handleDeleteClick() {
    if (deleteConfirm) {
      deletePath();
      setDeleteConfirm(false);
    } else {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <CardTitle className="text-sm font-semibold">
                  개인 학습 경로
                </CardTitle>
                {path && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-blue-700 border-blue-200 bg-blue-50"
                  >
                    {path.genre}
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* 경로 없음: 설정 폼 또는 생성 버튼 */}
            {!path && !showSetup && (
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-xs text-muted-foreground text-center">
                  아직 학습 경로가 없습니다.
                  <br />
                  현재 레벨과 목표를 설정해 맞춤 경로를 만들어보세요.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowSetup(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  학습 경로 설정
                </Button>
              </div>
            )}

            {!path && showSetup && (
              <>
                <SetupForm onSubmit={handleCreate} />
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-7 text-xs text-muted-foreground"
                  onClick={() => setShowSetup(false)}
                >
                  취소
                </Button>
              </>
            )}

            {/* 경로 있음 */}
            {path && (
              <>
                {/* 경로 메타 + 진행률 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {path.currentLevel} → {path.targetLevel}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {progress}%
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 text-[10px] px-1.5 ${
                          deleteConfirm
                            ? "text-red-600 hover:text-red-700"
                            : "text-muted-foreground"
                        }`}
                        onClick={handleDeleteClick}
                      >
                        {deleteConfirm ? (
                          "삭제 확인"
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* 세로 타임라인 */}
                <div className="pt-1">
                  {path.steps.map((step, idx) => (
                    <StepCard
                      key={step.id}
                      step={step}
                      isLast={idx === path.steps.length - 1}
                      onComplete={completeStep}
                      onReset={resetStep}
                    />
                  ))}
                </div>

                {/* 완료 메시지 */}
                {progress === 100 && (
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-center space-y-1">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                    <p className="text-xs font-semibold text-green-700">
                      모든 단계를 완료했습니다!
                    </p>
                    <p className="text-[10px] text-green-600">
                      {path.genre} {path.targetLevel} 달성을 축하합니다.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
