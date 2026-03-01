"use client";

import { useState } from "react";
import NextImage from "next/image";
import {
  Trophy,
  Star,
  Users,
  Smile,
  Heart,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  ThumbsUp,
  BarChart2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMonthlyHighlight,
  type HighlightStats,
} from "@/hooks/use-monthly-highlight";
import type { MonthlyHighlight, HighlightCategory } from "@/types";

// ============================================================
// 상수
// ============================================================

const CATEGORY_META: Record<
  HighlightCategory,
  { label: string; color: string; icon: React.ReactNode }
> = {
  best_practice: {
    label: "최고의 연습",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Star className="h-3 w-3" />,
  },
  best_performance: {
    label: "베스트 공연",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: <Trophy className="h-3 w-3" />,
  },
  mvp: {
    label: "MVP 멤버",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    icon: <Trophy className="h-3 w-3" />,
  },
  growth: {
    label: "성장상",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  teamwork: {
    label: "팀워크상",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <Users className="h-3 w-3" />,
  },
  fun_moment: {
    label: "재미있는 순간",
    color: "bg-pink-50 text-pink-700 border-pink-200",
    icon: <Smile className="h-3 w-3" />,
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as HighlightCategory[];

// ============================================================
// 헬퍼
// ============================================================

function formatYearMonth(ym: string): string {
  const [year, month] = ym.split("-");
  return `${year}년 ${Number(month)}월`;
}

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function prevMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  if (month === 1) return `${year - 1}-12`;
  return `${year}-${String(month - 1).padStart(2, "0")}`;
}

function nextMonth(ym: string): string {
  const [year, month] = ym.split("-").map(Number);
  if (month === 12) return `${year + 1}-01`;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

// ============================================================
// 서브 컴포넌트: 카테고리 배지
// ============================================================

function CategoryBadge({ category }: { category: HighlightCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 flex items-center gap-1 ${meta.color}`}
    >
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

// ============================================================
// 서브 컴포넌트: 하이라이트 항목 카드
// ============================================================

function HighlightItem({
  highlight,
  onDelete,
  onToggleLike,
  currentUser,
}: {
  highlight: MonthlyHighlight;
  onDelete: (id: string) => void;
  onToggleLike: (id: string, name: string) => void;
  currentUser: string;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [likeInput, setLikeInput] = useState("");
  const [showLikeInput, setShowLikeInput] = useState(false);

  const isLiked = currentUser
    ? highlight.likes.includes(currentUser)
    : false;

  function handleLike() {
    const name = currentUser.trim() || likeInput.trim();
    if (!name) {
      setShowLikeInput(true);
      return;
    }
    onToggleLike(highlight.id, name);
    setShowLikeInput(false);
    setLikeInput("");
  }

  function handleLikeWithInput() {
    if (!likeInput.trim()) return;
    onToggleLike(highlight.id, likeInput.trim());
    setShowLikeInput(false);
    setLikeInput("");
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-medium text-sm truncate">{highlight.title}</span>
          <CategoryBadge category={highlight.category} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 shrink-0 ${confirmDelete ? "text-red-500" : "text-muted-foreground"}`}
          onClick={() => {
            if (confirmDelete) {
              onDelete(highlight.id);
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 2500);
            }
          }}
          aria-label="하이라이트 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* 설명 */}
      {highlight.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {highlight.description}
        </p>
      )}

      {/* 사진 */}
      {highlight.photoUrl && (
        <div className="rounded overflow-hidden relative h-32">
          <NextImage
            src={highlight.photoUrl}
            alt={highlight.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}

      {/* 관련 멤버 */}
      {highlight.relatedMembers.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Users className="h-3 w-3 text-muted-foreground shrink-0" />
          {highlight.relatedMembers.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {name}
            </Badge>
          ))}
        </div>
      )}

      {/* 좋아요 */}
      <div className="flex items-center gap-2 pt-1 border-t border-dashed">
        <Button
          variant={isLiked ? "default" : "ghost"}
          size="sm"
          className="h-6 text-xs px-2"
          onClick={handleLike}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          {highlight.likes.length > 0 ? highlight.likes.length : ""}
          {highlight.likes.length === 0 ? "좋아요" : ""}
        </Button>

        {showLikeInput && !currentUser && (
          <div className="flex items-center gap-1">
            <Input
              value={likeInput}
              onChange={(e) => setLikeInput(e.target.value)}
              placeholder="이름 입력"
              className="h-6 text-xs w-24"
              onKeyDown={(e) => e.key === "Enter" && handleLikeWithInput()}
            />
            <Button
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleLikeWithInput}
            >
              확인
            </Button>
          </div>
        )}

        {highlight.likes.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {highlight.likes.slice(0, 3).join(", ")}
            {highlight.likes.length > 3
              ? ` 외 ${highlight.likes.length - 3}명`
              : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 통계 섹션
// ============================================================

function StatsSection({ stats }: { stats: HighlightStats }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs w-full justify-between px-2"
        >
          <span className="flex items-center gap-1">
            <BarChart2 className="h-3 w-3" />
            통계 보기
          </span>
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border rounded-lg p-3 mt-1 space-y-3 bg-muted/30">
          {/* 요약 수치 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-[10px] text-muted-foreground">이번 달</p>
              <p className="text-lg font-bold text-blue-600">
                {stats.thisMonthCount}
              </p>
            </div>
            <div className="text-center p-2 bg-white rounded border">
              <p className="text-[10px] text-muted-foreground">전체</p>
              <p className="text-lg font-bold">{stats.totalCount}</p>
            </div>
          </div>

          {/* 많이 선정된 멤버 */}
          {stats.topMembers.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                가장 많이 선정된 멤버
              </p>
              <div className="space-y-1">
                {stats.topMembers.map((m, i) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground w-4">
                        {i + 1}.
                      </span>
                      {m.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {m.count}회
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 카테고리 분포 */}
          {stats.totalCount > 0 && (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                카테고리별 분포
              </p>
              <div className="flex flex-wrap gap-1">
                {ALL_CATEGORIES.filter(
                  (c) => (stats.categoryBreakdown[c] ?? 0) > 0
                ).map((c) => (
                  <div
                    key={c}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${CATEGORY_META[c].color}`}
                  >
                    {CATEGORY_META[c].label}
                    <span className="font-semibold">
                      {stats.categoryBreakdown[c]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ============================================================
// 서브 컴포넌트: 추가 다이얼로그
// ============================================================

function AddHighlightDialog({
  selectedMonth,
  onAdd,
}: {
  selectedMonth: string;
  onAdd: (input: {
    yearMonth: string;
    title: string;
    category: HighlightCategory;
    description: string;
    relatedMembers: string[];
    photoUrl?: string;
  }) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HighlightCategory>("best_practice");
  const [description, setDescription] = useState("");
  const [membersInput, setMembersInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  function handleSubmit() {
    if (!title.trim()) return;
    const relatedMembers = membersInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    const success = onAdd({
      yearMonth: selectedMonth,
      title: title.trim(),
      category,
      description: description.trim(),
      relatedMembers,
      photoUrl: photoUrl.trim() || undefined,
    });
    if (success) {
      setTitle("");
      setCategory("best_practice");
      setDescription("");
      setMembersInput("");
      setPhotoUrl("");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          하이라이트 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            월간 하이라이트 추가
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {formatYearMonth(selectedMonth)}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div>
            <Label className="text-xs">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="하이라이트 제목"
              className="h-8 text-sm mt-1"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <Label className="text-xs">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as HighlightCategory)}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    <span className="flex items-center gap-2">
                      {CATEGORY_META[c].icon}
                      {CATEGORY_META[c].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-xs">설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이번 달 가장 빛났던 순간을 기록해 보세요"
              className="text-xs mt-1 min-h-[80px] resize-none"
            />
          </div>

          {/* 관련 멤버 */}
          <div>
            <Label className="text-xs">관련 멤버 (쉼표로 구분)</Label>
            <Input
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
              placeholder="홍길동, 김철수"
              className="h-8 text-xs mt-1"
            />
          </div>

          {/* 사진 URL */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <ImageIcon className="h-3 w-3" aria-hidden="true" />
              사진 URL (선택)
            </Label>
            <Input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs mt-1"
            />
          </div>

          <Button
            className="w-full h-8 text-sm"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            등록
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function MonthlyHighlightCard({ groupId }: { groupId: string }) {
  const {
    availableMonths,
    stats,
    addHighlight,
    deleteHighlight,
    toggleLike,
    getHighlightsByMonth,
  } = useMonthlyHighlight(groupId);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    getCurrentYearMonth()
  );
  const [isOpen, setIsOpen] = useState(true);
  const [currentUserName, setCurrentUserName] = useState("");

  const monthHighlights = getHighlightsByMonth(selectedMonth);

  // 이전/다음 달로 이동 (기록이 있는 월만 탐색, 없으면 날짜 기준)
  function handlePrev() {
    setSelectedMonth((m) => prevMonth(m));
  }

  function handleNext() {
    const next = nextMonth(selectedMonth);
    const current = getCurrentYearMonth();
    if (next <= current) setSelectedMonth(next);
  }

  const canGoNext = nextMonth(selectedMonth) <= getCurrentYearMonth();

  return (
    <div className="border rounded-xl shadow-sm overflow-hidden">
      {/* 카드 헤더 */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <span className="font-semibold text-sm">월간 하이라이트</span>
            {stats.thisMonthCount > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-yellow-500">
                {stats.thisMonthCount}
              </Badge>
            )}
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={isOpen ? "접기" : "펼치기"}>
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="p-3 space-y-3">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handlePrev}
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {formatYearMonth(selectedMonth)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleNext}
                disabled={!canGoNext}
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 사용자 이름 입력 (좋아요용) */}
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground shrink-0">
                내 이름
              </Label>
              <Input
                value={currentUserName}
                onChange={(e) => setCurrentUserName(e.target.value)}
                placeholder="이름 입력 (좋아요용)"
                className="h-6 text-xs"
              />
            </div>

            {/* 통계 */}
            <StatsSection stats={stats} />

            {/* 추가 버튼 */}
            <div className="flex justify-end">
              <AddHighlightDialog
                selectedMonth={selectedMonth}
                onAdd={addHighlight}
              />
            </div>

            {/* 하이라이트 목록 */}
            {monthHighlights.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">
                  {formatYearMonth(selectedMonth)}의 하이라이트가 없습니다.
                </p>
                <p className="text-[10px] mt-1 opacity-70">
                  이 달의 특별한 순간을 기록해 보세요!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {monthHighlights.map((h) => (
                  <HighlightItem
                    key={h.id}
                    highlight={h}
                    onDelete={deleteHighlight}
                    onToggleLike={toggleLike}
                    currentUser={currentUserName}
                  />
                ))}
              </div>
            )}

            {/* 기록된 월 목록 (드롭다운) */}
            {availableMonths.length > 0 && (
              <div className="pt-1 border-t">
                <p className="text-[10px] text-muted-foreground mb-1">
                  기록된 월
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableMonths.map((m) => (
                    <Button
                      key={m}
                      variant={m === selectedMonth ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setSelectedMonth(m)}
                    >
                      {formatYearMonth(m)}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
