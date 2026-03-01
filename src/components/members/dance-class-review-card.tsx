"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Star,
  User,
  Calendar,
  Banknote,
  Filter,
  BarChart2,
  Pencil,
  X,
  ThumbsUp,
  ThumbsDown,
  Music,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useDanceClassReview,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  DIFFICULTY_COLORS,
  SUGGESTED_GENRES,
} from "@/hooks/use-dance-class-review";
import type { DanceClassReview, DanceClassDifficulty } from "@/types";

// ============================================================
// 별점 컴포넌트
// ============================================================

function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = readOnly ? n <= value : n <= (hovered || value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHovered(n)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            className={`p-0 leading-none transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <Star
              className={`${iconClass} transition-colors ${filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
            />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// 폼 상태 타입
// ============================================================

type FormState = {
  className: string;
  instructorName: string;
  date: string;
  rating: number;
  difficulty: DanceClassDifficulty | "";
  genre: string;
  customGenre: string;
  takeaways: string;
  wouldRepeat: boolean;
  cost: string;
};

const defaultForm: FormState = {
  className: "",
  instructorName: "",
  date: "",
  rating: 0,
  difficulty: "",
  genre: "",
  customGenre: "",
  takeaways: "",
  wouldRepeat: false,
  cost: "",
};

// ============================================================
// Props
// ============================================================

interface DanceClassReviewCardProps {
  memberId: string;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DanceClassReviewCard({ memberId }: DanceClassReviewCardProps) {
  const {
    reviews,
    loading,
    genres,
    totalReviews,
    averageRating,
    difficultyDistribution,
    topInstructors,
    wouldRepeatCount,
    addReview,
    updateReview,
    deleteReview,
  } = useDanceClassReview(memberId);

  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { pending: submitting, execute } = useAsyncAction();
  const [form, setForm] = useState<FormState>(defaultForm);

  // 편집 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(defaultForm);

  // 필터
  const [filterDifficulty, setFilterDifficulty] = useState<DanceClassDifficulty | "all">("all");
  const [filterGenre, setFilterGenre] = useState("all");

  // ──────────────────────────────────────
  // 필터된 목록 (날짜 내림차순)
  // ──────────────────────────────────────

  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (filterDifficulty !== "all") {
      result = result.filter((r) => r.difficulty === filterDifficulty);
    }
    if (filterGenre !== "all") {
      result = result.filter((r) => r.genre === filterGenre);
    }
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [reviews, filterDifficulty, filterGenre]);

  const maxDiffCount = Math.max(...Object.values(difficultyDistribution), 1);

  // ──────────────────────────────────────
  // 유효성 검사
  // ──────────────────────────────────────

  function validateForm(f: FormState): string | null {
    if (!f.className.trim()) return "수업명을 입력하세요.";
    if (!f.date) return "수강 날짜를 선택하세요.";
    if (f.rating === 0) return "별점을 선택하세요.";
    if (!f.difficulty) return "난이도를 선택하세요.";
    if (!f.takeaways.trim()) return "배운 점을 입력하세요.";
    return null;
  }

  // ──────────────────────────────────────
  // 추가 핸들러
  // ──────────────────────────────────────

  function resetForm() {
    setForm(defaultForm);
  }

  async function handleSubmit() {
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }
    const finalGenre = form.genre === "__custom__" ? form.customGenre.trim() : form.genre;

    await execute(async () => {
      addReview({
        className: form.className.trim(),
        instructorName: form.instructorName.trim() || null,
        date: form.date,
        rating: form.rating,
        difficulty: form.difficulty as DanceClassDifficulty,
        genre: finalGenre || null,
        takeaways: form.takeaways.trim(),
        wouldRepeat: form.wouldRepeat,
        cost: form.cost !== "" ? Number(form.cost) : null,
      });
      toast.success(`'${form.className.trim()}' 수업 평가가 추가되었습니다.`);
      resetForm();
      setFormOpen(false);
    });
  }

  // ──────────────────────────────────────
  // 편집 핸들러
  // ──────────────────────────────────────

  function startEdit(review: DanceClassReview) {
    setEditingId(review.id);
    setEditForm({
      className: review.className,
      instructorName: review.instructorName ?? "",
      date: review.date,
      rating: review.rating,
      difficulty: review.difficulty,
      genre: review.genre ?? "",
      customGenre: "",
      takeaways: review.takeaways,
      wouldRepeat: review.wouldRepeat,
      cost: review.cost != null ? String(review.cost) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(defaultForm);
  }

  async function handleUpdate(reviewId: string) {
    const error = validateForm(editForm);
    if (error) {
      toast.error(error);
      return;
    }
    const finalGenre =
      editForm.genre === "__custom__" ? editForm.customGenre.trim() : editForm.genre;
    try {
      updateReview(reviewId, {
        className: editForm.className.trim(),
        instructorName: editForm.instructorName.trim() || null,
        date: editForm.date,
        rating: editForm.rating,
        difficulty: editForm.difficulty as DanceClassDifficulty,
        genre: finalGenre || null,
        takeaways: editForm.takeaways.trim(),
        wouldRepeat: editForm.wouldRepeat,
        cost: editForm.cost !== "" ? Number(editForm.cost) : null,
      });
      toast.success("수업 평가가 수정되었습니다.");
      cancelEdit();
    } catch {
      toast.error("수업 평가 수정 중 오류가 발생했습니다.");
    }
  }

  // ──────────────────────────────────────
  // 삭제 핸들러
  // ──────────────────────────────────────

  function handleDelete(reviewId: string, name: string) {
    try {
      deleteReview(reviewId);
      toast.success(`'${name}' 평가가 삭제되었습니다.`);
    } catch {
      toast.error("수업 평가 삭제 중 오류가 발생했습니다.");
    }
  }

  // ──────────────────────────────────────
  // 포맷 헬퍼
  // ──────────────────────────────────────

  function formatDate(iso: string) {
    return iso.replace(/-/g, ".");
  }

  function formatCost(cost: number | null) {
    if (cost === null) return null;
    if (cost === 0) return "무료";
    return cost.toLocaleString("ko-KR") + "원";
  }

  // ──────────────────────────────────────
  // JSX
  // ──────────────────────────────────────

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-500" />
                <CardTitle className="text-sm font-semibold">
                  댄스 수업 평가 노트
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 border-violet-300">
                  {totalReviews}건
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!open) setOpen(true);
                    setFormOpen((prev) => !prev);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  평가 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">

            {/* 추가 폼 */}
            {formOpen && (
              <ReviewForm
                form={form}
                setForm={setForm}
                onSubmit={handleSubmit}
                onCancel={() => {
                  resetForm();
                  setFormOpen(false);
                }}
                submitting={submitting}
                title="신규 수업 평가 등록"
                submitLabel="등록"
              />
            )}

            {/* 통계 요약 */}
            {totalReviews > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatBadge
                  icon={<BookOpen className="h-3 w-3 text-violet-500" />}
                  label="총 수업"
                  value={`${totalReviews}건`}
                  colorClass="bg-violet-50 border-violet-200"
                />
                <StatBadge
                  icon={<Star className="h-3 w-3 text-yellow-500" />}
                  label="평균 별점"
                  value={`${averageRating} / 5`}
                  colorClass="bg-yellow-50 border-yellow-200"
                />
                <StatBadge
                  icon={<ThumbsUp className="h-3 w-3 text-emerald-500" />}
                  label="재수강 의향"
                  value={`${wouldRepeatCount}건`}
                  colorClass="bg-emerald-50 border-emerald-200"
                />
              </div>
            )}

            {/* 난이도 분포 */}
            {totalReviews > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  <BarChart2 className="h-3 w-3" />
                  난이도 분포
                </div>
                <div className="space-y-1.5">
                  {DIFFICULTY_ORDER.map((d) => {
                    const count = difficultyDistribution[d];
                    const pct = Math.round((count / maxDiffCount) * 100);
                    return (
                      <div key={d} className="flex items-center gap-2">
                        <span className={`text-[10px] w-10 shrink-0 font-medium ${DIFFICULTY_COLORS[d].text}`}>
                          {DIFFICULTY_LABELS[d]}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${DIFFICULTY_COLORS[d].bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] w-4 text-right text-muted-foreground shrink-0">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 상위 강사 */}
            {topInstructors.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  <TrendingUp className="h-3 w-3" />
                  자주 수강한 강사
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topInstructors.map((ins) => (
                    <div
                      key={ins.name}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border text-[11px]"
                    >
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{ins.name}</span>
                      <span className="text-muted-foreground">{ins.count}회</span>
                      <span className="text-yellow-500">★{ins.avgRating}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 필터 */}
            {totalReviews > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                {/* 난이도 필터 */}
                <button
                  type="button"
                  onClick={() => setFilterDifficulty("all")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterDifficulty === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent"
                  }`}
                >
                  전체 난이도
                </button>
                {DIFFICULTY_ORDER.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setFilterDifficulty(d === filterDifficulty ? "all" : d)
                    }
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterDifficulty === d
                        ? `${DIFFICULTY_COLORS[d].badge} border-current`
                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                    }`}
                  >
                    {DIFFICULTY_LABELS[d]}
                  </button>
                ))}
                {/* 장르 필터 */}
                {genres.length > 0 && (
                  <>
                    <span className="text-[10px] text-muted-foreground mx-0.5">|</span>
                    <button
                      type="button"
                      onClick={() => setFilterGenre("all")}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        filterGenre === "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      전체 장르
                    </button>
                    {genres.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFilterGenre(g === filterGenre ? "all" : g)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          filterGenre === g
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : totalReviews === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 수업 평가가 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 첫 수업 평가를 등록하세요.</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-xs">필터에 맞는 수업 평가가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReviews.map((review) =>
                  editingId === review.id ? (
                    <div key={review.id} className="rounded-lg border bg-muted/20 p-3">
                      <ReviewForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={() => handleUpdate(review.id)}
                        onCancel={cancelEdit}
                        submitting={false}
                        title="수업 평가 수정"
                        submitLabel="저장"
                      />
                    </div>
                  ) : (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      onEdit={() => startEdit(review)}
                      onDelete={() => handleDelete(review.id, review.className)}
                      formatDate={formatDate}
                      formatCost={formatCost}
                    />
                  )
                )}
              </div>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================
// 통계 배지 서브컴포넌트
// ============================================================

function StatBadge({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${colorClass}`}>
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ============================================================
// 리뷰 행 서브컴포넌트
// ============================================================

interface ReviewRowProps {
  review: DanceClassReview;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
  formatCost: (cost: number | null) => string | null;
}

function ReviewRow({ review, onEdit, onDelete, formatDate, formatCost }: ReviewRowProps) {
  const colors = DIFFICULTY_COLORS[review.difficulty];
  const costStr = formatCost(review.cost);

  return (
    <div className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">{review.className}</span>
          <Badge className={`text-[10px] px-1.5 py-0 border shrink-0 ${colors.badge}`}>
            {DIFFICULTY_LABELS[review.difficulty]}
          </Badge>
          {review.genre && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              <Music className="h-2.5 w-2.5 mr-0.5" />
              {review.genre}
            </Badge>
          )}
          {review.wouldRepeat ? (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium shrink-0">
              <ThumbsUp className="h-3 w-3" />
              재수강
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
              <ThumbsDown className="h-3 w-3" />
              재수강 안함
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarRating value={review.rating} readOnly size="sm" />
        {review.instructorName && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <User className="h-3 w-3" />
            {review.instructorName}
          </span>
        )}
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(review.date)}
        </span>
        {costStr && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Banknote className="h-3 w-3" />
            {costStr}
          </span>
        )}
      </div>

      {/* 배운 점 */}
      {review.takeaways && (
        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 leading-relaxed">
          {review.takeaways}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 폼 서브컴포넌트
// ============================================================

interface ReviewFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  title: string;
  submitLabel: string;
}

function ReviewForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting,
  title,
  submitLabel,
}: ReviewFormProps) {
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 수업명 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">수업명 *</label>
        <Input
          placeholder="수업 또는 워크숍 이름"
          value={form.className}
          onChange={(e) => setField("className", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 강사 / 날짜 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">강사명</label>
          <Input
            placeholder="강사 이름 (선택)"
            value={form.instructorName}
            onChange={(e) => setField("instructorName", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">수강 날짜 *</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* 비용 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">수업료 (원)</label>
        <Input
          type="number"
          min={0}
          placeholder="0 (무료) 또는 비워두기"
          value={form.cost}
          onChange={(e) => setField("cost", e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      {/* 난이도 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">난이도 *</label>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setField("difficulty", d)}
              className={`text-[11px] px-2.5 py-1 rounded-md border font-medium transition-colors ${
                form.difficulty === d
                  ? `${DIFFICULTY_COLORS[d].badge} border-current`
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* 장르 선택 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">장르 (선택)</label>
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                setField("genre", g);
                setField("customGenre", "");
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                form.genre === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setField("genre", "__custom__")}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              form.genre === "__custom__"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            직접 입력
          </button>
        </div>
        {form.genre === "__custom__" && (
          <Input
            placeholder="장르 직접 입력"
            value={form.customGenre}
            onChange={(e) => setField("customGenre", e.target.value)}
            className="h-8 text-xs mt-1"
          />
        )}
      </div>

      {/* 별점 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">별점 *</label>
        <div className="flex items-center gap-2">
          <StarRating
            value={form.rating}
            onChange={(v) => setField("rating", v)}
          />
          {form.rating > 0 && (
            <span className="text-xs text-muted-foreground">{form.rating} / 5</span>
          )}
        </div>
      </div>

      {/* 재수강 의향 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setField("wouldRepeat", !form.wouldRepeat)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${
            form.wouldRepeat
              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
              : "bg-background text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          {form.wouldRepeat ? (
            <ThumbsUp className="h-3 w-3" />
          ) : (
            <ThumbsDown className="h-3 w-3" />
          )}
          {form.wouldRepeat ? "재수강 의향 있음" : "재수강 의향 없음"}
        </button>
      </div>

      {/* 배운 점 */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">배운 점 / 핵심 메모 *</label>
        <Textarea
          placeholder="수업에서 배운 핵심 내용, 느낀 점, 개선할 점 등을 기록하세요."
          value={form.takeaways}
          onChange={(e) => setField("takeaways", e.target.value)}
          className="min-h-[70px] text-xs resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 justify-end pt-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={onSubmit}
          disabled={submitting}
        >
          <BookOpen className="h-3 w-3 mr-1" />
          {submitting ? "처리 중..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
