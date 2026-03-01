"use client";

import { useState, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  BookOpen,
  PenLine,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  X,
  Plus,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  usePracticeJournalEntry,
  CONDITION_EMOJI,
  CONDITION_LABEL,
  CONDITION_ORDER,
} from "@/hooks/use-practice-journal-entry";
import type { JournalCondition, PracticeJournalEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 날짜 포맷 유틸
// ============================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================
// 컨디션 이모지 선택 버튼
// ============================================

function ConditionPicker({
  value,
  onChange,
}: {
  value: JournalCondition;
  onChange: (v: JournalCondition) => void;
}) {
  return (
    <div className="flex gap-1">
      {CONDITION_ORDER.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all text-center",
            value === c
              ? "bg-primary/10 ring-2 ring-primary scale-110"
              : "hover:bg-muted"
          )}
          title={CONDITION_LABEL[c]}
        >
          <span className="text-xl leading-none">{CONDITION_EMOJI[c]}</span>
          <span
            className={cn(
              "text-[10px]",
              value === c
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            )}
          >
            {CONDITION_LABEL[c]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// 태그 입력 컴포넌트
// ============================================

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [inputVal, setInputVal] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      const newTag = inputVal.trim().replace(/,/g, "");
      if (newTag && !tags.includes(newTag) && tags.length < 10) {
        onChange([...tags, newTag]);
      }
      setInputVal("");
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap gap-1 items-center min-h-[32px] border rounded-md px-2 py-1 bg-background focus-within:ring-2 focus-within:ring-ring">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-[10px] px-1.5 py-0 gap-0.5 cursor-pointer"
          onClick={() => removeTag(tag)}
        >
          {tag}
          <X className="h-2.5 w-2.5 ml-0.5" />
        </Badge>
      ))}
      <input
        className="flex-1 min-w-[80px] text-xs outline-none bg-transparent placeholder:text-muted-foreground"
        placeholder={tags.length === 0 ? "태그 입력 후 Enter" : ""}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={20}
      />
    </div>
  );
}

// ============================================
// 일지 작성/수정 폼
// ============================================

type FormValues = {
  date: string;
  title: string;
  learned: string;
  improvement: string;
  feeling: string;
  condition: JournalCondition;
  tags: string[];
};

function emptyForm(): FormValues {
  return {
    date: getTodayStr(),
    title: "",
    learned: "",
    improvement: "",
    feeling: "",
    condition: "normal",
    tags: [],
  };
}

function fromEntry(entry: PracticeJournalEntry): FormValues {
  return {
    date: entry.date,
    title: entry.title,
    learned: entry.learned,
    improvement: entry.improvement,
    feeling: entry.feeling,
    condition: entry.condition,
    tags: [...entry.tags],
  };
}

interface JournalFormProps {
  initial?: PracticeJournalEntry;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  submitting: boolean;
}

function JournalForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: JournalFormProps) {
  const [form, setForm] = useState<FormValues>(
    initial ? fromEntry(initial) : emptyForm()
  );

  const set = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!form.learned.trim() && !form.improvement.trim() && !form.feeling.trim()) {
      toast.error("배운 점, 개선할 점, 느낀 점 중 하나 이상 작성해주세요.");
      return;
    }
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* 날짜 + 제목 */}
      <div className="flex gap-2">
        <div className="flex-shrink-0">
          <label className="text-[10px] text-muted-foreground block mb-1">날짜</label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            className="h-8 text-xs w-36"
            max={getTodayStr()}
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground block mb-1">제목</label>
          <Input
            placeholder="오늘의 연습 제목"
            value={form.title}
            onChange={(e) => set("title", e.target.value.slice(0, 50))}
            className="h-8 text-xs"
            maxLength={50}
          />
        </div>
      </div>

      {/* 컨디션 */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">컨디션</label>
        <ConditionPicker
          value={form.condition}
          onChange={(v) => set("condition", v)}
        />
      </div>

      {/* 배운 점 */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">배운 점</label>
        <Textarea
          placeholder="오늘 새롭게 배운 동작이나 개념을 적어보세요."
          value={form.learned}
          onChange={(e) => set("learned", e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          maxLength={500}
        />
      </div>

      {/* 개선할 점 */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">개선할 점</label>
        <Textarea
          placeholder="더 연습이 필요한 부분을 적어보세요."
          value={form.improvement}
          onChange={(e) => set("improvement", e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          maxLength={500}
        />
      </div>

      {/* 느낀 점 */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">느낀 점</label>
        <Textarea
          placeholder="연습하면서 느낀 감정이나 생각을 자유롭게 적어보세요."
          value={form.feeling}
          onChange={(e) => set("feeling", e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          maxLength={500}
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="text-[10px] text-muted-foreground block mb-1">
          <Tag className="inline h-3 w-3 mr-0.5" />
          태그 (최대 10개)
        </label>
        <TagInput tags={form.tags} onChange={(tags) => set("tags", tags)} />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          size="sm"
          className="h-7 text-xs flex-1"
          disabled={submitting}
        >
          {submitting ? "저장 중..." : initial ? "수정 완료" : "일지 저장"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </form>
  );
}

// ============================================
// 일지 카드 (단일)
// ============================================

interface EntryCardProps {
  entry: PracticeJournalEntry;
  onEdit: (entry: PracticeJournalEntry) => void;
  onDelete: (id: string) => void;
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      {/* 상단: 날짜 + 컨디션 + 제목 + 액션 */}
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5 flex-shrink-0">
          {CONDITION_EMOJI[entry.condition]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              {formatYearMonthDay(entry.date)}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0"
            >
              {CONDITION_LABEL[entry.condition]}
            </Badge>
          </div>
          <p className="text-xs font-medium mt-0.5 truncate">{entry.title}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title={expanded ? "접기" : "펼치기"}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
            title="수정"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="p-1 rounded hover:bg-muted text-red-500 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 태그 */}
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* 상세 내용 (펼치기) */}
      {expanded && (
        <div className="space-y-2 pt-1 border-t">
          {entry.learned && (
            <div>
              <p className="text-[10px] font-medium text-blue-600 mb-0.5">배운 점</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {entry.learned}
              </p>
            </div>
          )}
          {entry.improvement && (
            <div>
              <p className="text-[10px] font-medium text-orange-600 mb-0.5">개선할 점</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {entry.improvement}
              </p>
            </div>
          )}
          {entry.feeling && (
            <div>
              <p className="text-[10px] font-medium text-green-600 mb-0.5">느낀 점</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {entry.feeling}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// 통계 패널
// ============================================

interface StatsPanelProps {
  stats: {
    total: number;
    recentWeekCount: number;
    topTags: { tag: string; count: number }[];
  };
}

function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
      <p className="text-xs font-medium flex items-center gap-1.5">
        <BarChart2 className="h-3 w-3 text-muted-foreground" />
        통계
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-background border px-3 py-2 text-center">
          <p className="text-lg font-bold">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">총 일지 수</p>
        </div>
        <div className="rounded-md bg-background border px-3 py-2 text-center">
          <p className="text-lg font-bold">{stats.recentWeekCount}</p>
          <p className="text-[10px] text-muted-foreground">최근 7일</p>
        </div>
      </div>
      {stats.topTags.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">자주 사용한 태그 TOP 5</p>
          <div className="flex flex-wrap gap-1">
            {stats.topTags.map(({ tag, count }) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 gap-1"
              >
                {tag}
                <span className="text-muted-foreground">({count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface PracticeJournalCardProps {
  groupId: string;
  userId: string;
}

export function PracticeJournalCard({
  groupId,
  userId,
}: PracticeJournalCardProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "write" | "edit">("list");
  const [editTarget, setEditTarget] = useState<PracticeJournalEntry | null>(
    null
  );
  const { pending: submitting, execute } = useAsyncAction();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState("");

  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    search,
    filterByTag,
    getStats,
    getAllTags,
  } = usePracticeJournalEntry(groupId, userId);

  const stats = getStats();
  const allTags = getAllTags();

  // 검색 + 태그 필터 결합
  const displayed = (() => {
    let result = entries;
    if (activeTag) result = filterByTag(activeTag);
    if (searchQuery.trim()) result = search(searchQuery).filter((e) =>
      activeTag ? e.tags.includes(activeTag) : true
    );
    return result;
  })();

  // 일지 저장 (신규)
  async function handleAdd(values: FormValues) {
    await execute(async () => {
      addEntry(values);
      toast.success("일지가 저장되었습니다.");
      setMode("list");
    });
  }

  // 일지 수정
  async function handleUpdate(values: FormValues) {
    if (!editTarget) return;
    await execute(async () => {
      updateEntry(editTarget.id, values);
      toast.success("일지가 수정되었습니다.");
      setMode("list");
      setEditTarget(null);
    });
  }

  // 일지 삭제
  function handleDelete(id: string) {
    deleteEntry(id);
    toast.success("일지가 삭제되었습니다.");
  }

  // 수정 모드 전환
  function handleEdit(entry: PracticeJournalEntry) {
    setEditTarget(entry);
    setMode("edit");
  }

  // 작성/수정 폼 취소
  function handleCancel() {
    setMode("list");
    setEditTarget(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setMode("list");
      setEditTarget(null);
      setSearchQuery("");
      setActiveTag("");
    }
  }

  return (
    <Collapsible open={open} onOpenChange={handleOpenChange}>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">연습 일지</span>
              {stats.total > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0"
                >
                  {stats.total}개
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t pt-3 space-y-3">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : mode === "write" ? (
              /* 작성 폼 */
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <PenLine className="h-3 w-3" />
                  새 일지 작성
                </p>
                <JournalForm
                  onSubmit={handleAdd}
                  onCancel={handleCancel}
                  submitting={submitting}
                />
              </div>
            ) : mode === "edit" && editTarget ? (
              /* 수정 폼 */
              <div className="space-y-2">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <PenLine className="h-3 w-3" />
                  일지 수정
                </p>
                <JournalForm
                  initial={editTarget}
                  onSubmit={handleUpdate}
                  onCancel={handleCancel}
                  submitting={submitting}
                />
              </div>
            ) : (
              /* 목록 모드 */
              <div className="space-y-3">
                {/* 통계 */}
                {stats.total > 0 && <StatsPanel stats={stats} />}

                {/* 작성 버튼 */}
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => setMode("write")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  새 일지 작성
                </Button>

                {/* 검색 */}
                {entries.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="일지 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-7 text-xs pl-7"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* 태그 필터 */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      variant={activeTag === "" ? "default" : "outline"}
                      className="text-[10px] px-1.5 py-0 cursor-pointer"
                      onClick={() => setActiveTag("")}
                    >
                      전체
                    </Badge>
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={activeTag === tag ? "default" : "outline"}
                        className="text-[10px] px-1.5 py-0 cursor-pointer"
                        onClick={() =>
                          setActiveTag((prev) => (prev === tag ? "" : tag))
                        }
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 일지 목록 */}
                {displayed.length === 0 ? (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {entries.length === 0
                        ? "아직 작성한 일지가 없습니다."
                        : "검색 결과가 없습니다."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {displayed.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
