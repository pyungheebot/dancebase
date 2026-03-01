"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  ThumbsUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDanceClassReview } from "@/hooks/use-dance-class-review";
import type { DanceClassReview, DanceClassDifficulty } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

import {
  type FormState,
  defaultForm,
  StatBadge,
  DifficultyChart,
  TopInstructors,
  ReviewFilters,
  ReviewForm,
  ReviewRow,
} from "./dance-class-review";

// ============================================================
// Props
// ============================================================

interface DanceClassReviewCardProps {
  memberId: string;
}

// ============================================================
// 메인 카드 컨테이너
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
      toast.success(TOAST.MEMBERS.CLASS_REVIEW_UPDATED);
      cancelEdit();
    } catch {
      toast.error(TOAST.MEMBERS.CLASS_REVIEW_EDIT_ERROR);
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
      toast.error(TOAST.MEMBERS.CLASS_REVIEW_DELETE_ERROR);
    }
  }

  // ──────────────────────────────────────
  // 포맷 헬퍼
  // ──────────────────────────────────────

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
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              role="button"
              aria-expanded={open}
              aria-controls="dance-class-review-content"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-500" aria-hidden="true" />
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
                  aria-label="수업 평가 추가"
                  aria-expanded={formOpen}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  평가 추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent id="dance-class-review-content">
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
              <div
                className="grid grid-cols-3 gap-2"
                role="region"
                aria-label="수업 평가 통계"
              >
                <StatBadge
                  icon={<BookOpen className="h-3 w-3 text-violet-500" aria-hidden="true" />}
                  label="총 수업"
                  value={`${totalReviews}건`}
                  colorClass="bg-violet-50 border-violet-200"
                />
                <StatBadge
                  icon={<Star className="h-3 w-3 text-yellow-500" aria-hidden="true" />}
                  label="평균 별점"
                  value={`${averageRating} / 5`}
                  colorClass="bg-yellow-50 border-yellow-200"
                />
                <StatBadge
                  icon={<ThumbsUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />}
                  label="재수강 의향"
                  value={`${wouldRepeatCount}건`}
                  colorClass="bg-emerald-50 border-emerald-200"
                />
              </div>
            )}

            {/* 난이도 분포 */}
            {totalReviews > 0 && (
              <DifficultyChart
                difficultyDistribution={difficultyDistribution}
                maxDiffCount={maxDiffCount}
              />
            )}

            {/* 상위 강사 */}
            <TopInstructors topInstructors={topInstructors} />

            {/* 필터 */}
            {totalReviews > 0 && (
              <ReviewFilters
                filterDifficulty={filterDifficulty}
                setFilterDifficulty={setFilterDifficulty}
                filterGenre={filterGenre}
                setFilterGenre={setFilterGenre}
                genres={genres}
              />
            )}

            {/* 목록 */}
            {loading ? (
              <div
                className="space-y-2"
                role="status"
                aria-label="수업 평가 로딩 중"
                aria-live="polite"
              >
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-md" />
                ))}
              </div>
            ) : totalReviews === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                <p className="text-xs">등록된 수업 평가가 없습니다.</p>
                <p className="text-[11px] mt-0.5">위 버튼으로 첫 수업 평가를 등록하세요.</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div
                className="text-center py-6 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs">필터에 맞는 수업 평가가 없습니다.</p>
              </div>
            ) : (
              <ul
                className="space-y-2"
                role="list"
                aria-label="수업 평가 목록"
              >
                {filteredReviews.map((review) =>
                  editingId === review.id ? (
                    <li key={review.id} className="rounded-lg border bg-muted/20 p-3" role="listitem">
                      <ReviewForm
                        form={editForm}
                        setForm={setEditForm}
                        onSubmit={() => handleUpdate(review.id)}
                        onCancel={cancelEdit}
                        submitting={false}
                        title="수업 평가 수정"
                        submitLabel="저장"
                      />
                    </li>
                  ) : (
                    <li key={review.id} role="listitem">
                      <ReviewRow
                        review={review}
                        onEdit={() => startEdit(review)}
                        onDelete={() => handleDelete(review.id, review.className)}
                        formatYearMonthDay={formatYearMonthDay}
                        formatCost={formatCost}
                      />
                    </li>
                  )
                )}
              </ul>
            )}

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
