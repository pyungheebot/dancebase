"use client";

import { useState } from "react";
import {
  useChoreographyDifficulty,
  CATEGORY_LABELS,
  ALL_CATEGORIES,
} from "@/hooks/use-choreography-difficulty";
import type {
  ChoreographyDifficultyEntry,
  DifficultyCategory,
  DifficultyRating,
} from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Star,
  Plus,
  Trash2,
  BarChart3,
  MessageSquare,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 별점 입력 컴포넌트
// ============================================

interface StarRatingProps {
  value: number;
  onChange?: (score: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={
              readonly
                ? "cursor-default"
                : "cursor-pointer transition-transform hover:scale-110"
            }
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
          >
            <Star
              className={`${iconSize} ${
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground/40"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// SVG 레이더 차트 (오각형)
// ============================================

interface RadarChartProps {
  scores: Record<DifficultyCategory, number>; // 0~5
  size?: number;
}

function RadarChart({ scores, size = 140 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = (size / 2) * 0.72;
  const levels = 5;

  // 오각형: 꼭짓점은 -90도(위)부터 72도씩
  function polarToXY(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const angleStep = 360 / ALL_CATEGORIES.length; // 72

  // 격자 다각형
  function gridPolygon(level: number) {
    const r = (maxRadius * level) / levels;
    return ALL_CATEGORIES.map((_, i) => {
      const { x, y } = polarToXY(i * angleStep, r);
      return `${x},${y}`;
    }).join(" ");
  }

  // 데이터 다각형
  const dataPolygon = ALL_CATEGORIES.map((cat, i) => {
    const score = Math.min(Math.max(scores[cat] ?? 0, 0), 5);
    const r = (maxRadius * score) / 5;
    const { x, y } = polarToXY(i * angleStep, r);
    return `${x},${y}`;
  }).join(" ");

  // 라벨 위치 (격자 바깥쪽)
  const labelRadius = maxRadius + 14;

  const LABEL_SHORT: Record<DifficultyCategory, string> = {
    speed: "속도",
    complexity: "복잡도",
    stamina: "체력",
    expression: "표현력",
    sync: "싱크로",
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 격자선 */}
      {Array.from({ length: levels }, (_, i) => i + 1).map((level) => (
        <polygon
          key={level}
          points={gridPolygon(level)}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-muted-foreground/20"
        />
      ))}

      {/* 축선 */}
      {ALL_CATEGORIES.map((_, i) => {
        const { x, y } = polarToXY(i * angleStep, maxRadius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/20"
          />
        );
      })}

      {/* 데이터 다각형 */}
      <polygon
        points={dataPolygon}
        fill="rgba(139,92,246,0.2)"
        stroke="rgb(139,92,246)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* 데이터 꼭짓점 점 */}
      {ALL_CATEGORIES.map((cat, i) => {
        const score = Math.min(Math.max(scores[cat] ?? 0, 0), 5);
        const r = (maxRadius * score) / 5;
        const { x, y } = polarToXY(i * angleStep, r);
        return (
          <circle
            key={cat}
            cx={x}
            cy={y}
            r="2.5"
            fill="rgb(139,92,246)"
          />
        );
      })}

      {/* 라벨 */}
      {ALL_CATEGORIES.map((cat, i) => {
        const { x, y } = polarToXY(i * angleStep, labelRadius);
        return (
          <text
            key={cat}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            className="fill-muted-foreground"
            fill="currentColor"
          >
            {LABEL_SHORT[cat]}
          </text>
        );
      })}
    </svg>
  );
}

// ============================================
// 평가 추가 폼
// ============================================

interface AddEntryFormProps {
  onAdd: (payload: {
    songTitle: string;
    ratings: DifficultyRating[];
    ratedBy: string;
    comment: string;
  }) => boolean;
  onClose: () => void;
}

const DEFAULT_RATINGS: DifficultyRating[] = ALL_CATEGORIES.map((cat) => ({
  category: cat,
  score: 3,
}));

function AddEntryForm({ onAdd, onClose }: AddEntryFormProps) {
  const [songTitle, setSongTitle] = useState("");
  const [ratings, setRatings] = useState<DifficultyRating[]>(DEFAULT_RATINGS);
  const [ratedBy, setRatedBy] = useState("");
  const [comment, setComment] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  function handleScoreChange(category: DifficultyCategory, score: number) {
    setRatings((prev) =>
      prev.map((r) => (r.category === category ? { ...r, score } : r))
    );
  }

  async function handleSubmit() {
    if (!songTitle.trim()) {
      toast.error("곡명을 입력하세요.");
      return;
    }
    await execute(async () => {
      const ok = onAdd({ songTitle, ratings, ratedBy, comment });
      if (ok) {
        toast.success("난도 평가가 등록되었습니다.");
        onClose();
      } else {
        toast.error("평가는 최대 20개까지 등록할 수 있습니다.");
      }
    });
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/30 mt-2">
      <p className="text-xs font-medium text-muted-foreground">새 난도 평가 등록</p>

      {/* 곡명 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">곡명 *</Label>
        <Input
          value={songTitle}
          onChange={(e) => setSongTitle(e.target.value)}
          placeholder="예: Dynamite, 팝핑 메들리"
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      {/* 항목별 별점 */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground font-medium">항목별 난도 (1~5점)</p>
        {ALL_CATEGORIES.map((cat) => {
          const rating = ratings.find((r) => r.category === cat);
          return (
            <div key={cat} className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-foreground w-20 shrink-0">
                {CATEGORY_LABELS[cat]}
              </span>
              <div className="flex items-center gap-2">
                <StarRating
                  value={rating?.score ?? 3}
                  onChange={(score) => handleScoreChange(cat, score)}
                  size="sm"
                />
                <span className="text-[10px] text-muted-foreground w-4 text-right">
                  {rating?.score ?? 3}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 평가자 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">평가자</Label>
        <Input
          value={ratedBy}
          onChange={(e) => setRatedBy(e.target.value)}
          placeholder="이름 또는 닉네임"
          className="h-7 text-xs"
        />
      </div>

      {/* 코멘트 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">코멘트</Label>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="간단한 메모 (선택)"
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={submitting || !songTitle.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          등록
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 개별 평가 행
// ============================================

interface EntryRowProps {
  entry: ChoreographyDifficultyEntry;
  onDelete: () => void;
}

function difficultyColor(score: number): string {
  if (score >= 4.5) return "text-red-600";
  if (score >= 3.5) return "text-orange-500";
  if (score >= 2.5) return "text-yellow-500";
  return "text-green-600";
}

function difficultyLabel(score: number): string {
  if (score >= 4.5) return "최상급";
  if (score >= 3.5) return "상급";
  if (score >= 2.5) return "중급";
  if (score >= 1.5) return "초급";
  return "입문";
}

function EntryRow({ entry, onDelete }: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-sm font-medium truncate">{entry.songTitle}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 shrink-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100`}
              >
                평균 {entry.averageScore}점
              </Badge>
              <span
                className={`text-[10px] font-medium shrink-0 ${difficultyColor(entry.averageScore)}`}
              >
                {difficultyLabel(entry.averageScore)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
        </CollapsibleTrigger>

        {/* 상세 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 border-t space-y-2">
            {/* 항목별 바 */}
            <div className="space-y-1">
              {ALL_CATEGORIES.map((cat) => {
                const rating = entry.ratings.find((r) => r.category === cat);
                const score = rating?.score ?? 0;
                return (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-20 shrink-0">
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-400 transition-all"
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <StarRating value={score} readonly size="sm" />
                      <span className="text-[10px] text-muted-foreground ml-1">
                        {score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-2 pt-1">
              {entry.ratedBy && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {entry.ratedBy}
                  </span>
                </div>
              )}
              {entry.comment && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">
                    {entry.comment}
                  </span>
                </div>
              )}
              <span className="text-[10px] text-muted-foreground/60">
                {formatYearMonthDay(entry.createdAt)}
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 메인 카드
// ============================================

interface ChoreographyDifficultyCardProps {
  groupId: string;
  projectId: string;
}

export function ChoreographyDifficultyCard({
  groupId,
  projectId,
}: ChoreographyDifficultyCardProps) {
  const {
    entries,
    loading,
    canAdd,
    addEntry,
    deleteEntry,
    categoryStats,
    overallAverage,
  } = useChoreographyDifficulty(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const stats = categoryStats();
  const avg = overallAverage();

  function handleDelete(id: string, title: string) {
    deleteEntry(id);
    toast.success(`"${title}" 평가가 삭제되었습니다.`);
  }

  return (
    <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
      <div className="border rounded-lg overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left min-w-0">
              {cardExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-sm font-semibold">안무 난도 평가</span>
              {entries.length > 0 && (
                <>
                  <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
                    {entries.length}/{20}
                  </Badge>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 bg-yellow-50 border-yellow-200 hover:bg-yellow-50 ${difficultyColor(avg)}`}
                  >
                    평균 {avg}점
                  </Badge>
                </>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            {entries.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setStatsOpen((v) => !v)}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                통계
              </Button>
            )}
            {canAdd && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => setFormOpen((v) => !v)}
              >
                <Plus className="h-3 w-3 mr-1" />
                평가 추가
              </Button>
            )}
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 통계 패널 (레이더 차트) */}
            {statsOpen && entries.length > 0 && (
              <div className="border rounded-md p-3 bg-muted/20">
                <p className="text-xs font-medium mb-3">항목별 평균 난도 분포</p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* 레이더 차트 */}
                  <div className="shrink-0">
                    <RadarChart scores={stats} size={160} />
                  </div>
                  {/* 수치 목록 */}
                  <div className="flex-1 space-y-1.5 w-full">
                    {ALL_CATEGORIES.map((cat) => {
                      const score = stats[cat];
                      return (
                        <div key={cat} className="flex items-center gap-2">
                          <span className="text-[11px] text-muted-foreground w-20 shrink-0">
                            {CATEGORY_LABELS[cat]}
                          </span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-purple-400"
                              style={{ width: `${(score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8 text-right">
                            {score}점
                          </span>
                        </div>
                      );
                    })}
                    <div className="pt-1 border-t mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">전체 평균</span>
                        <span
                          className={`text-sm font-bold ${difficultyColor(avg)}`}
                        >
                          {avg}점 ({difficultyLabel(avg)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 추가 폼 */}
            {formOpen && (
              <AddEntryForm
                onAdd={addEntry}
                onClose={() => setFormOpen(false)}
              />
            )}

            {/* 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Star className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">등록된 난도 평가가 없습니다.</p>
                <p className="text-[10px] mt-0.5">
                  위 &apos;평가 추가&apos; 버튼으로 안무 난도를 평가해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onDelete={() => handleDelete(entry.id, entry.songTitle)}
                  />
                ))}
              </div>
            )}

            {!canAdd && (
              <p className="text-[11px] text-muted-foreground text-center pt-1">
                평가는 최대 20개까지 등록할 수 있습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
