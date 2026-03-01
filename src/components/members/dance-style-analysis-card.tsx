"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  BarChart2,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDanceStyleAnalysis,
  TRAIT_LABELS,
  TRAIT_COLORS,
  TRAIT_TEXT_COLORS,
  ALL_TRAITS,
  DEFAULT_TRAIT_SCORES,
  GENRE_SUGGESTIONS,
  STRENGTH_TAGS,
  WEAKNESS_TAGS,
  getScoreBarColor,
  getScoreTextStyle,
  toDateStr,
} from "@/hooks/use-dance-style-analysis";
import type {
  DanceStyleSnapshot,
  DanceStyleTrait,
  DanceStyleTraitScores,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 날짜 유틸
// ============================================================

// ============================================================
// CSS 레이더 차트 (div 기반 육각형)
// ============================================================

function RadarChart({
  scores,
  size = 160,
}: {
  scores: DanceStyleTraitScores;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;

  // 6개 꼭짓점 각도 (위에서 시작, 시계방향)
  const angles = ALL_TRAITS.map((_, i) => (Math.PI / 2) * -1 + (2 * Math.PI * i) / 6);

  // 점수 → 반지름
  function scoreToRadius(score: number): number {
    return (score / 10) * maxRadius;
  }

  // 꼭짓점 좌표
  function getPoint(angle: number, radius: number): { x: number; y: number } {
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  }

  // 배경 육각형 (5단계)
  const bgLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 점수 폴리곤 경로
  const scorePath = ALL_TRAITS.map((trait, i) => {
    const pt = getPoint(angles[i], scoreToRadius(scores[trait]));
    return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
  }).join(" ") + " Z";

  // 배경 육각형 경로
  function hexPath(fraction: number): string {
    return (
      angles
        .map((angle, i) => {
          const pt = getPoint(angle, maxRadius * fraction);
          return `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
        })
        .join(" ") + " Z"
    );
  }

  // 레이블 위치 (약간 바깥쪽)
  const labelOffset = maxRadius * 1.35;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* 배경 육각형 */}
        {bgLevels.map((level, i) => (
          <path
            key={i}
            d={hexPath(level)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* 축선 */}
        {angles.map((angle, i) => {
          const outer = getPoint(angle, maxRadius);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x.toFixed(2)}
              y2={outer.y.toFixed(2)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          );
        })}

        {/* 점수 영역 */}
        <path
          d={scorePath}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="rgb(99, 102, 241)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* 점수 꼭짓점 점 */}
        {ALL_TRAITS.map((trait, i) => {
          const pt = getPoint(angles[i], scoreToRadius(scores[trait]));
          return (
            <circle
              key={trait}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="rgb(99, 102, 241)"
            />
          );
        })}

        {/* 레이블 */}
        {ALL_TRAITS.map((trait, i) => {
          const pt = getPoint(angles[i], labelOffset);
          const isLeft = pt.x < cx - 2;
          const isRight = pt.x > cx + 2;
          const anchor = isLeft ? "end" : isRight ? "start" : "middle";
          return (
            <text
              key={trait}
              x={pt.x.toFixed(2)}
              y={(pt.y + 4).toFixed(2)}
              textAnchor={anchor}
              fontSize={9}
              fill="currentColor"
              opacity={0.65}
              fontWeight={500}
            >
              {TRAIT_LABELS[trait]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================
// 점수 슬라이더 (1-10)
// ============================================================

function TraitSlider({
  trait,
  value,
  onChange,
}: {
  trait: DanceStyleTrait;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", TRAIT_TEXT_COLORS[trait])}>
          {TRAIT_LABELS[trait]}
        </span>
        <span className={cn("text-xs", getScoreTextStyle(value))}>
          {value} / 10
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex-1 h-4 rounded-sm transition-colors",
              n <= value ? TRAIT_COLORS[trait] : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 점수 바 (표시용)
// ============================================================

function TraitBar({
  trait,
  value,
}: {
  trait: DanceStyleTrait;
  value: number;
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {TRAIT_LABELS[trait]}
        </span>
        <span className={cn("text-[11px]", getScoreTextStyle(value))}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", getScoreBarColor(value))}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// 태그 입력 컴포넌트
// ============================================================

function TagInput({
  label,
  tags,
  suggestions,
  onAdd,
  onRemove,
  placeholder,
}: {
  label: string;
  tags: string[];
  suggestions: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      toast.error("이미 추가된 항목입니다.");
      return;
    }
    onAdd(trimmed);
    setInputValue("");
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1.5">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder ?? "입력 후 Enter"}
          className="h-7 text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs px-2"
          onClick={handleAdd}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {/* 추천 태그 */}
      <div className="flex flex-wrap gap-1">
        {suggestions
          .filter((s) => !tags.includes(s))
          .slice(0, 6)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onAdd(s)}
              className="text-[10px] px-1.5 py-0.5 rounded border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
      </div>
      {/* 선택된 태그 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-1"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-destructive"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 스냅샷 폼 (추가/수정 공용)
// ============================================================

type SnapshotFormState = {
  date: string;
  primaryGenres: string[];
  secondaryGenres: string[];
  strengths: string[];
  weaknesses: string[];
  traitScores: DanceStyleTraitScores;
  notes: string;
};

function makeDefaultForm(): SnapshotFormState {
  return {
    date: toDateStr(new Date()),
    primaryGenres: [],
    secondaryGenres: [],
    strengths: [],
    weaknesses: [],
    traitScores: { ...DEFAULT_TRAIT_SCORES },
    notes: "",
  };
}

function snapshotToForm(snap: DanceStyleSnapshot): SnapshotFormState {
  return {
    date: snap.date,
    primaryGenres: [...snap.primaryGenres],
    secondaryGenres: [...snap.secondaryGenres],
    strengths: [...snap.strengths],
    weaknesses: [...snap.weaknesses],
    traitScores: { ...snap.traitScores },
    notes: snap.notes,
  };
}

function SnapshotDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: SnapshotFormState) => void;
  initialData?: SnapshotFormState;
  title: string;
}) {
  const [form, setForm] = useState<SnapshotFormState>(
    initialData ?? makeDefaultForm()
  );

  // initialData 변경 시 폼 리셋
  const resetForm = useCallback(() => {
    setForm(initialData ?? makeDefaultForm());
  }, [initialData]);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
      resetForm();
    }
  }

  function handleSubmit() {
    if (form.primaryGenres.length === 0) {
      toast.error("주력 장르를 1개 이상 입력하세요.");
      return;
    }
    onSubmit(form);
    onClose();
    setForm(makeDefaultForm());
  }

  function setTrait(trait: DanceStyleTrait, score: number) {
    setForm((prev) => ({
      ...prev,
      traitScores: { ...prev.traitScores, [trait]: score },
    }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">분석 날짜</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="h-7 text-xs"
            />
          </div>

          {/* 주력 장르 */}
          <TagInput
            label="주력 장르"
            tags={form.primaryGenres}
            suggestions={GENRE_SUGGESTIONS.filter(
              (g) => !form.secondaryGenres.includes(g)
            )}
            onAdd={(g) =>
              setForm((prev) => ({
                ...prev,
                primaryGenres: [...prev.primaryGenres, g],
              }))
            }
            onRemove={(g) =>
              setForm((prev) => ({
                ...prev,
                primaryGenres: prev.primaryGenres.filter((x) => x !== g),
              }))
            }
            placeholder="예: 힙합, 팝핑..."
          />

          {/* 부력 장르 */}
          <TagInput
            label="부력 장르"
            tags={form.secondaryGenres}
            suggestions={GENRE_SUGGESTIONS.filter(
              (g) => !form.primaryGenres.includes(g)
            )}
            onAdd={(g) =>
              setForm((prev) => ({
                ...prev,
                secondaryGenres: [...prev.secondaryGenres, g],
              }))
            }
            onRemove={(g) =>
              setForm((prev) => ({
                ...prev,
                secondaryGenres: prev.secondaryGenres.filter((x) => x !== g),
              }))
            }
            placeholder="예: 왁킹, 하우스..."
          />

          {/* 강점 */}
          <TagInput
            label="강점"
            tags={form.strengths}
            suggestions={STRENGTH_TAGS}
            onAdd={(t) =>
              setForm((prev) => ({
                ...prev,
                strengths: [...prev.strengths, t],
              }))
            }
            onRemove={(t) =>
              setForm((prev) => ({
                ...prev,
                strengths: prev.strengths.filter((x) => x !== t),
              }))
            }
            placeholder="강점 입력..."
          />

          {/* 약점 */}
          <TagInput
            label="약점"
            tags={form.weaknesses}
            suggestions={WEAKNESS_TAGS}
            onAdd={(t) =>
              setForm((prev) => ({
                ...prev,
                weaknesses: [...prev.weaknesses, t],
              }))
            }
            onRemove={(t) =>
              setForm((prev) => ({
                ...prev,
                weaknesses: prev.weaknesses.filter((x) => x !== t),
              }))
            }
            placeholder="약점 입력..."
          />

          {/* 특성 점수 + 미리보기 레이더 */}
          <div className="space-y-2">
            <Label className="text-xs">특성 점수 (1-10)</Label>
            <div className="flex gap-4">
              {/* 슬라이더 */}
              <div className="flex-1 space-y-2">
                {ALL_TRAITS.map((trait) => (
                  <TraitSlider
                    key={trait}
                    trait={trait}
                    value={form.traitScores[trait]}
                    onChange={(v) => setTrait(trait, v)}
                  />
                ))}
              </div>
              {/* 레이더 미리보기 */}
              <div className="flex items-center justify-center">
                <RadarChart scores={form.traitScores} size={140} />
              </div>
            </div>
          </div>

          {/* 노트 */}
          <div className="space-y-1">
            <Label className="text-xs">스타일 노트 / 코멘트</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="현재 댄스 스타일, 개선 방향, 특이사항 등을 자유롭게 작성하세요..."
              className="text-xs min-h-[72px] resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onClose();
                setForm(makeDefaultForm());
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
            >
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 스냅샷 상세 행
// ============================================================

function SnapshotRow({
  snapshot,
  onEdit,
  onDelete,
}: {
  snapshot: DanceStyleSnapshot;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const avgScore =
    Math.round(
      (ALL_TRAITS.reduce((s, t) => s + snapshot.traitScores[t], 0) /
        ALL_TRAITS.length) *
        10
    ) / 10;

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 헤더 행 */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <Activity className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
        <span className="text-xs font-medium flex-1">
          {formatYearMonthDay(snapshot.date)}
        </span>
        <Badge
          className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200"
          variant="outline"
        >
          평균 {avgScore}
        </Badge>
        {/* 주력 장르 배지 */}
        {snapshot.primaryGenres.slice(0, 2).map((g) => (
          <Badge
            key={g}
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {g}
          </Badge>
        ))}
        {snapshot.primaryGenres.length > 2 && (
          <span className="text-[10px] text-muted-foreground">
            +{snapshot.primaryGenres.length - 2}
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
      </div>

      {/* 상세 내용 */}
      {expanded && (
        <div className="px-3 py-3 space-y-3 border-t bg-background">
          <div className="flex gap-4">
            {/* 레이더 차트 */}
            <div className="flex-shrink-0">
              <RadarChart scores={snapshot.traitScores} size={150} />
            </div>

            {/* 특성 바 */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {ALL_TRAITS.map((trait) => (
                <TraitBar
                  key={trait}
                  trait={trait}
                  value={snapshot.traitScores[trait]}
                />
              ))}
            </div>
          </div>

          {/* 장르 및 태그 */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {snapshot.primaryGenres.length > 0 && (
              <div>
                <span className="text-muted-foreground">주력 장르</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {snapshot.primaryGenres.map((g) => (
                    <Badge
                      key={g}
                      className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
                      variant="outline"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {snapshot.secondaryGenres.length > 0 && (
              <div>
                <span className="text-muted-foreground">부력 장르</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {snapshot.secondaryGenres.map((g) => (
                    <Badge
                      key={g}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {snapshot.strengths.length > 0 && (
              <div>
                <span className="text-muted-foreground">강점</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {snapshot.strengths.map((s) => (
                    <Badge
                      key={s}
                      className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
                      variant="outline"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {snapshot.weaknesses.length > 0 && (
              <div>
                <span className="text-muted-foreground">약점</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {snapshot.weaknesses.map((w) => (
                    <Badge
                      key={w}
                      className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
                      variant="outline"
                    >
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 노트 */}
          {snapshot.notes && (
            <div className="bg-muted/40 rounded p-2">
              <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                {snapshot.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 통계 요약 카드
// ============================================================

function StatsSummary({
  stats,
}: {
  stats: ReturnType<ReturnType<typeof useDanceStyleAnalysis>["getStats"]>;
}) {
  if (stats.totalSnapshots === 0) {
    return (
      <div className="text-center py-6 text-xs text-muted-foreground">
        아직 분석 기록이 없습니다. 첫 분석을 시작해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 요약 배지 행 */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1">
          <BarChart2 className="h-3 w-3" />
          <span>전체 평균 {stats.overallAverage}</span>
        </div>
        {stats.topTrait && (
          <div className="flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-2 py-1">
            <TrendingUp className="h-3 w-3" />
            <span>
              최고: {TRAIT_LABELS[stats.topTrait]} (
              {stats.traitScores[stats.topTrait]})
            </span>
          </div>
        )}
        {stats.bottomTrait && (
          <div className="flex items-center gap-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-1">
            <TrendingDown className="h-3 w-3" />
            <span>
              약점: {TRAIT_LABELS[stats.bottomTrait]} (
              {stats.traitScores[stats.bottomTrait]})
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground border rounded px-2 py-1">
          <Star className="h-3 w-3" />
          <span>총 {stats.totalSnapshots}회 분석</span>
        </div>
      </div>

      {/* 레이더 + 바 */}
      <div className="flex gap-4 items-center">
        <RadarChart scores={stats.traitScores} size={160} />
        <div className="flex-1 space-y-1.5 min-w-0">
          {ALL_TRAITS.map((trait) => (
            <TraitBar
              key={trait}
              trait={trait}
              value={stats.traitScores[trait]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================

export function DanceStyleAnalysisCard({ memberId }: { memberId: string }) {
  const {
    snapshots,

    addSnapshot,
    updateSnapshot,
    deleteSnapshot,
    getStats,
  } = useDanceStyleAnalysis(memberId);

  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] =
    useState<DanceStyleSnapshot | null>(null);

  const computedStats = getStats();

  function handleAdd(form: SnapshotFormState) {
    addSnapshot({
      date: form.date,
      primaryGenres: form.primaryGenres,
      secondaryGenres: form.secondaryGenres,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      traitScores: form.traitScores,
      notes: form.notes,
    });
    toast.success("분석 기록이 추가되었습니다.");
  }

  function handleEdit(form: SnapshotFormState) {
    if (!editTarget) return;
    updateSnapshot(editTarget.id, {
      date: form.date,
      primaryGenres: form.primaryGenres,
      secondaryGenres: form.secondaryGenres,
      strengths: form.strengths,
      weaknesses: form.weaknesses,
      traitScores: form.traitScores,
      notes: form.notes,
    });
    toast.success("분석 기록이 수정되었습니다.");
    setEditTarget(null);
  }

  function handleDelete(snapId: string) {
    deleteSnapshot(snapId);
    toast.success("분석 기록이 삭제되었습니다.");
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger className="w-full" asChild>
            <div className="flex items-center justify-between cursor-pointer select-none group">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 스타일 분석
                </CardTitle>
                {snapshots.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {snapshots.length}회
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  분석 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            <StatsSummary stats={computedStats} />

            {/* 기록 목록 */}
            {snapshots.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                  <Activity className="h-3 w-3" />
                  <span>분석 기록 ({snapshots.length})</span>
                </div>
                <div className="space-y-1.5">
                  {snapshots.map((snap) => (
                    <SnapshotRow
                      key={snap.id}
                      snapshot={snap}
                      onEdit={() => setEditTarget(snap)}
                      onDelete={() => handleDelete(snap.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <SnapshotDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="댄스 스타일 분석 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <SnapshotDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initialData={snapshotToForm(editTarget)}
          title="댄스 스타일 분석 수정"
        />
      )}
    </Card>
  );
}
