"use client";

import { useState } from "react";
import {
  Music,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Clock,
  BarChart2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDanceRoutineBuilder } from "@/hooks/use-dance-routine-builder";
import type { DanceRoutine, RoutineStep, RoutineStepCategory } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<RoutineStepCategory, string> = {
  warmup: "워밍업",
  stretching: "스트레칭",
  technique: "테크닉",
  choreography: "안무 연습",
  cooldown: "쿨다운",
};

const CATEGORY_COLORS: Record<RoutineStepCategory, string> = {
  warmup: "bg-orange-100 text-orange-700",
  stretching: "bg-teal-100 text-teal-700",
  technique: "bg-violet-100 text-violet-700",
  choreography: "bg-pink-100 text-pink-700",
  cooldown: "bg-cyan-100 text-cyan-700",
};

const CATEGORIES: RoutineStepCategory[] = [
  "warmup",
  "stretching",
  "technique",
  "choreography",
  "cooldown",
];

// ─── 루틴 추가 폼 ────────────────────────────────────────────

interface AddRoutineFormProps {
  onAdd: (params: {
    title: string;
    purpose?: string;
    estimatedMinutes: number;
  }) => void;
  onClose: () => void;
}

function AddRoutineForm({ onAdd, onClose }: AddRoutineFormProps) {
  const [form, setForm] = useState({
    title: "",
    purpose: "",
    estimatedMinutes: 60,
  });

  function handleSubmit() {
    if (!form.title.trim()) return;
    onAdd({
      title: form.title,
      purpose: form.purpose || undefined,
      estimatedMinutes: Number(form.estimatedMinutes) || 60,
    });
    onClose();
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-700">새 루틴 추가</p>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label className="text-xs">루틴 제목 *</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예: 공연 전 준비 루틴"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">목적 (선택)</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예: 공연 준비, 일상 연습..."
            value={form.purpose}
            onChange={(e) =>
              setForm((f) => ({ ...f, purpose: e.target.value }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">예상 소요시간 (분)</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={5}
            max={300}
            value={form.estimatedMinutes}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                estimatedMinutes: parseInt(e.target.value, 10) || 60,
              }))
            }
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={handleSubmit}
          disabled={!form.title.trim()}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 추가 폼 ────────────────────────────────────────────

interface AddStepFormProps {
  routineId: string;
  onAdd: (
    routineId: string,
    params: {
      name: string;
      category: RoutineStepCategory;
      sets: number;
      reps: number;
      repUnit: "reps" | "seconds";
      memo?: string;
    }
  ) => boolean;
  onClose: () => void;
}

function AddStepForm({ routineId, onAdd, onClose }: AddStepFormProps) {
  const [form, setForm] = useState({
    name: "",
    category: "warmup" as RoutineStepCategory,
    sets: 3,
    reps: 8,
    repUnit: "reps" as "reps" | "seconds",
    memo: "",
  });

  function handleSubmit() {
    if (!form.name.trim()) return;
    const ok = onAdd(routineId, {
      name: form.name,
      category: form.category,
      sets: Number(form.sets),
      reps: Number(form.reps),
      repUnit: form.repUnit,
      memo: form.memo || undefined,
    });
    if (ok) onClose();
  }

  return (
    <div className="rounded-lg border border-pink-200 bg-pink-50/50 p-3 space-y-2 mt-2">
      <p className="text-xs font-semibold text-pink-700">스텝 추가</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">동작/운동 이름 *</Label>
          <Input
            className="h-7 text-xs"
            placeholder="예: 숄더 롤, 바디웨이브..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">카테고리</Label>
          <Select
            value={form.category}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, category: v as RoutineStepCategory }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">세트 수</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            max={20}
            value={form.sets}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sets: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">반복</Label>
          <Input
            type="number"
            className="h-7 text-xs"
            min={1}
            max={999}
            value={form.reps}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                reps: parseInt(e.target.value, 10) || 1,
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">단위</Label>
          <Select
            value={form.repUnit}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, repUnit: v as "reps" | "seconds" }))
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reps" className="text-xs">
                횟수
              </SelectItem>
              <SelectItem value="seconds" className="text-xs">
                초
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">메모 (선택)</Label>
          <Textarea
            className="min-h-[36px] text-xs resize-none"
            placeholder="자세 설명, 주의사항..."
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs bg-pink-600 hover:bg-pink-700 text-white"
          onClick={handleSubmit}
          disabled={!form.name.trim()}
        >
          추가
        </Button>
      </div>
    </div>
  );
}

// ─── 스텝 아이템 ─────────────────────────────────────────────

interface StepItemProps {
  step: RoutineStep;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function StepItem({
  step,
  isFirst,
  isLast,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StepItemProps) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted/30 px-2 py-1.5">
      {/* 순서 번호 */}
      <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground mt-0.5">
        {step.order}
      </span>
      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{step.name}</span>
          <span
            className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${CATEGORY_COLORS[step.category]}`}
          >
            {CATEGORY_LABELS[step.category]}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {step.sets}세트 x {step.reps}
          {step.repUnit === "reps" ? "회" : "초"}
          {step.memo && (
            <span className="ml-1 text-muted-foreground/70">— {step.memo}</span>
          )}
        </p>
      </div>
      {/* 순서 이동 + 삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
          onClick={onDelete}
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── 루틴 상세 뷰 ────────────────────────────────────────────

interface RoutineDetailProps {
  routine: DanceRoutine;
  onAddStep: AddStepFormProps["onAdd"];
  onDeleteStep: (routineId: string, stepId: string) => boolean;
  onMoveStep: (
    routineId: string,
    stepId: string,
    direction: "up" | "down"
  ) => boolean;
  onDeleteRoutine: (routineId: string) => boolean;
  onToggleFavorite: (routineId: string) => boolean;
}

function RoutineDetail({
  routine,
  onAddStep,
  onDeleteStep,
  onMoveStep,
  onDeleteRoutine,
  onToggleFavorite,
}: RoutineDetailProps) {
  const [showStepForm, setShowStepForm] = useState(false);

  return (
    <div className="space-y-2">
      {/* 메타 정보 */}
      <div className="flex items-center gap-2 flex-wrap">
        {routine.purpose && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {routine.purpose}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          예상 {routine.estimatedMinutes}분
        </span>
        <button
          className="ml-auto flex items-center gap-0.5 text-[10px] hover:text-yellow-500 transition-colors"
          onClick={() => onToggleFavorite(routine.id)}
        >
          <Star
            className={`h-3 w-3 ${routine.favorited ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
          <span
            className={routine.favorited ? "text-yellow-500" : "text-muted-foreground"}
          >
            {routine.favorited ? "즐겨찾기됨" : "즐겨찾기"}
          </span>
        </button>
      </div>

      {/* 스텝 목록 */}
      {routine.steps.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          아직 스텝이 없습니다.
        </p>
      ) : (
        <div className="space-y-1">
          {routine.steps.map((step, idx) => (
            <StepItem
              key={step.id}
              step={step}
              isFirst={idx === 0}
              isLast={idx === routine.steps.length - 1}
              onDelete={() => onDeleteStep(routine.id, step.id)}
              onMoveUp={() => onMoveStep(routine.id, step.id, "up")}
              onMoveDown={() => onMoveStep(routine.id, step.id, "down")}
            />
          ))}
        </div>
      )}

      {/* 스텝 추가 폼 */}
      {showStepForm ? (
        <AddStepForm
          routineId={routine.id}
          onAdd={onAddStep}
          onClose={() => setShowStepForm(false)}
        />
      ) : (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] flex-1 border-dashed border-pink-300 text-pink-600 hover:bg-pink-50"
            onClick={() => setShowStepForm(true)}
          >
            <Plus className="h-2.5 w-2.5 mr-0.5" />
            스텝 추가
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => onDeleteRoutine(routine.id)}
          >
            <Trash2 className="h-2.5 w-2.5 mr-0.5" />
            루틴 삭제
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export function RoutineBuilderCard({ memberId }: { memberId: string }) {
  const {
    routines,
    stats,
    addRoutine,
    deleteRoutine,
    toggleFavorite,
    addStep,
    deleteStep,
    moveStep,
  } = useDanceRoutineBuilder(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showRoutineForm, setShowRoutineForm] = useState(false);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "favorited">("all");

  const displayRoutines =
    filter === "favorited" ? routines.filter((r) => r.favorited) : routines;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold">댄스 루틴 빌더</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
              {stats.totalRoutines}개 루틴
            </Badge>
            {stats.favoritedCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-0 flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-yellow-500" />
                {stats.favoritedCount}개 즐겨찾기
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                <Zap className="h-2.5 w-2.5" />총 루틴
              </p>
              <p className="text-sm font-bold text-indigo-600">
                {stats.totalRoutines}개
              </p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                <Star className="h-2.5 w-2.5" />
                즐겨찾기
              </p>
              <p className="text-sm font-bold text-yellow-600">
                {stats.favoritedCount}개
              </p>
            </div>
            <div className="rounded-lg bg-teal-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                평균 시간
              </p>
              <p className="text-sm font-bold text-teal-600">
                {stats.avgMinutes > 0 ? `${stats.avgMinutes}분` : "-"}
              </p>
            </div>
          </div>

          {/* 카테고리 분포 */}
          {stats.categoryDistribution.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-1">
                <BarChart2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  카테고리 분포
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.categoryDistribution.map(({ category, count }) => (
                  <span
                    key={category}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category]}`}
                  >
                    {CATEGORY_LABELS[category]} {count}개
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 필터 탭 */}
          <div className="flex rounded-md border border-gray-200 p-0.5 bg-muted/30">
            <button
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-background shadow-sm text-indigo-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setFilter("all")}
            >
              전체 루틴
            </button>
            <button
              className={`flex-1 rounded py-1 text-xs font-medium transition-colors ${
                filter === "favorited"
                  ? "bg-background shadow-sm text-yellow-700"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setFilter("favorited")}
            >
              <Star className="h-2.5 w-2.5 inline mr-0.5" />
              즐겨찾기
            </button>
          </div>

          {/* 루틴 목록 */}
          <div className="space-y-2">
            {displayRoutines.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {filter === "favorited"
                  ? "즐겨찾기한 루틴이 없습니다."
                  : "등록된 루틴이 없습니다."}
              </p>
            ) : (
              displayRoutines.map((routine) => {
                const isExpanded = expandedRoutineId === routine.id;
                return (
                  <div
                    key={routine.id}
                    className="rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <button
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-muted/30 transition-colors"
                      onClick={() =>
                        setExpandedRoutineId(isExpanded ? null : routine.id)
                      }
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {routine.title}
                        </span>
                        {routine.favorited && (
                          <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {routine.estimatedMinutes}분
                        </span>
                        <Badge className="text-[10px] px-1 py-0 bg-gray-100 text-gray-600 border-0">
                          {routine.steps.length}스텝
                        </Badge>
                        <ChevronRight
                          className={`h-3 w-3 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/50">
                        <RoutineDetail
                          routine={routine}
                          onAddStep={addStep}
                          onDeleteStep={deleteStep}
                          onMoveStep={moveStep}
                          onDeleteRoutine={deleteRoutine}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* 루틴 추가 버튼 / 폼 */}
            {showRoutineForm ? (
              <AddRoutineForm
                onAdd={addRoutine}
                onClose={() => setShowRoutineForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                onClick={() => {
                  setFilter("all");
                  setShowRoutineForm(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                루틴 추가
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
