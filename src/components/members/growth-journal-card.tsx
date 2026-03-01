"use client";

import { useState, useCallback } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Notebook,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Star,
  Target,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useGrowthJournal } from "@/hooks/use-growth-journal";
import type { GrowthJournalEntry, GrowthJournalMood } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================
// 상수
// ============================================

const MOOD_EMOJI: Record<GrowthJournalMood, string> = {
  motivated: "🔥",
  confident: "💪",
  neutral: "😐",
  struggling: "😓",
  discouraged: "😞",
};

const MOOD_LABEL: Record<GrowthJournalMood, string> = {
  motivated: "의욕충만",
  confident: "자신감",
  neutral: "평범",
  struggling: "힘듦",
  discouraged: "기운없음",
};

const MOOD_ORDER: GrowthJournalMood[] = [
  "motivated",
  "confident",
  "neutral",
  "struggling",
  "discouraged",
];

// ============================================
// 날짜 유틸
// ============================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 쉼표로 구분된 문자열을 배열로 변환
function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 배열을 쉼표로 구분된 문자열로 변환
function joinList(arr: string[]): string {
  return arr.join(", ");
}

// ============================================
// 별점 컴포넌트
// ============================================

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              (hovered ? n <= hovered : n <= value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================
// 무드 선택 컴포넌트
// ============================================

function MoodPicker({
  value,
  onChange,
}: {
  value: GrowthJournalMood;
  onChange: (v: GrowthJournalMood) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {MOOD_ORDER.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-all text-center",
            value === m
              ? "bg-primary/10 ring-2 ring-primary scale-110"
              : "hover:bg-muted"
          )}
          title={MOOD_LABEL[m]}
        >
          <span className="text-xl leading-none">{MOOD_EMOJI[m]}</span>
          <span
            className={cn(
              "text-[10px]",
              value === m
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            )}
          >
            {MOOD_LABEL[m]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ============================================
// 일지 작성/수정 폼 타입 및 초기값
// ============================================

type FormValues = {
  memberName: string;
  date: string;
  title: string;
  content: string;
  mood: GrowthJournalMood;
  skillsPracticed: string;
  achievementsToday: string;
  challengesFaced: string;
  nextGoals: string;
  selfRating: number;
};

function emptyForm(memberName: string): FormValues {
  return {
    memberName,
    date: getTodayStr(),
    title: "",
    content: "",
    mood: "neutral",
    skillsPracticed: "",
    achievementsToday: "",
    challengesFaced: "",
    nextGoals: "",
    selfRating: 3,
  };
}

function fromEntry(entry: GrowthJournalEntry): FormValues {
  return {
    memberName: entry.memberName,
    date: entry.date,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    skillsPracticed: joinList(entry.skillsPracticed),
    achievementsToday: joinList(entry.achievementsToday),
    challengesFaced: joinList(entry.challengesFaced),
    nextGoals: joinList(entry.nextGoals),
    selfRating: entry.selfRating,
  };
}

// ============================================
// 일지 작성 다이얼로그
// ============================================

interface JournalDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: GrowthJournalEntry;
  memberNames: string[];
  defaultMember?: string;
  onSubmit: (values: FormValues) => void;
  submitting: boolean;
}

function JournalDialog({
  open,
  onOpenChange,
  initial,
  memberNames,
  defaultMember,
  onSubmit,
  submitting,
}: JournalDialogProps) {
  const [form, setForm] = useState<FormValues>(() =>
    initial ? fromEntry(initial) : emptyForm(defaultMember ?? memberNames[0] ?? "")
  );

  // 다이얼로그 열릴 때마다 폼 초기화
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setForm(
          initial
            ? fromEntry(initial)
            : emptyForm(defaultMember ?? memberNames[0] ?? "")
        );
      }
      onOpenChange(next);
    },
    [initial, defaultMember, memberNames, onOpenChange]
  );

  const set = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.memberName.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_MEMBER_REQUIRED);
      return;
    }
    if (!form.title.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_TITLE_REQUIRED);
      return;
    }
    if (!form.content.trim()) {
      toast.error(TOAST.MEMBERS.GROWTH_JOURNAL_CONTENT_REQUIRED);
      return;
    }
    onSubmit(form);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Notebook className="h-4 w-4" />
            {initial ? "성장 일지 수정" : "성장 일지 작성"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 멤버 선택 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">멤버</label>
            <Select
              value={form.memberName}
              onValueChange={(v) => set("memberName", v)}
              disabled={!!initial}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="멤버 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                placeholder="오늘의 성장 일지 제목"
                value={form.title}
                onChange={(e) => set("title", e.target.value.slice(0, 60))}
                className="h-8 text-xs"
                maxLength={60}
              />
            </div>
          </div>

          {/* 무드 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">오늘의 무드</label>
            <MoodPicker
              value={form.mood}
              onChange={(v) => set("mood", v)}
            />
          </div>

          {/* 자기평가 별점 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              자기평가 (1~5점)
            </label>
            <div className="flex items-center gap-2">
              <StarRating
                value={form.selfRating}
                onChange={(v) => set("selfRating", v)}
              />
              <span className="text-xs text-muted-foreground">{form.selfRating}점</span>
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">오늘의 일지 내용</label>
            <Textarea
              placeholder="오늘 연습하면서 느낀 점, 배운 점 등을 자유롭게 적어보세요."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              className="text-xs min-h-[80px] resize-none"
              maxLength={1000}
            />
          </div>

          {/* 연습한 스킬 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              연습한 스킬 <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              placeholder="예: 웨이브, 아이솔레이션, 바디롤"
              value={form.skillsPracticed}
              onChange={(e) => set("skillsPracticed", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 오늘의 성취 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              오늘의 성취 <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              placeholder="예: 8박자 연속 성공, 팀원에게 칭찬 받음"
              value={form.achievementsToday}
              onChange={(e) => set("achievementsToday", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 도전 과제 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              도전 과제 <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              placeholder="예: 복잡한 풋워크, 템포 맞추기"
              value={form.challengesFaced}
              onChange={(e) => set("challengesFaced", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 다음 목표 */}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">
              다음 목표 <span className="text-muted-foreground/60">(쉼표로 구분)</span>
            </label>
            <Input
              placeholder="예: 안무 전체 암기, 표정 연습"
              value={form.nextGoals}
              onChange={(e) => set("nextGoals", e.target.value)}
              className="h-8 text-xs"
            />
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
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 자기평가 추이 도트 차트 (최근 10개)
// ============================================

function RatingDotChart({ entries }: { entries: GrowthJournalEntry[] }) {
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .reverse();

  if (recent.length < 2) return null;

  const avg =
    recent.reduce((sum, e) => sum + e.selfRating, 0) / recent.length;

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-2">
      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        최근 자기평가 추이 (최근 {recent.length}개)
        <span className="ml-auto text-foreground font-semibold">
          평균 {avg.toFixed(1)}점
        </span>
      </p>
      <div className="flex items-end gap-1.5 h-10">
        {recent.map((e, i) => {
          const heightPct = (e.selfRating / 5) * 100;
          const isLast = i === recent.length - 1;
          return (
            <div
              key={e.id}
              className="flex-1 flex flex-col items-center justify-end gap-0.5"
              title={`${e.date}: ${e.selfRating}점`}
            >
              <div
                className={cn(
                  "w-full rounded-sm min-h-[4px] transition-all",
                  isLast
                    ? "bg-primary"
                    : e.selfRating >= 4
                    ? "bg-green-400"
                    : e.selfRating >= 3
                    ? "bg-yellow-400"
                    : "bg-red-400"
                )}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{recent[0]?.date.slice(5)}</span>
        <span>{recent[recent.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

// ============================================
// 단일 일지 카드
// ============================================

interface EntryCardProps {
  entry: GrowthJournalEntry;
  onEdit: (entry: GrowthJournalEntry) => void;
  onDelete: (id: string) => void;
}

function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-md border bg-card p-3 space-y-2">
      {/* 상단: 날짜 + 무드 + 제목 + 액션 */}
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5 flex-shrink-0">
          {MOOD_EMOJI[entry.mood]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-muted-foreground">
              {formatYearMonthDay(entry.date)}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {MOOD_LABEL[entry.mood]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {entry.memberName}
            </span>
          </div>
          <p className="text-xs font-medium mt-0.5 truncate">{entry.title}</p>
          <StarRating value={entry.selfRating} readonly />
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

      {/* 연습한 스킬 칩 */}
      {entry.skillsPracticed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.skillsPracticed.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="text-[10px] px-1.5 py-0 gap-1"
            >
              <Dumbbell className="h-2.5 w-2.5" />
              {skill}
            </Badge>
          ))}
        </div>
      )}

      {/* 상세 내용 (펼치기) */}
      {expanded && (
        <div className="space-y-2 pt-1.5 border-t">
          {/* 본문 */}
          {entry.content && (
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          )}

          {/* 오늘의 성취 */}
          {entry.achievementsToday.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-green-600 mb-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                오늘의 성취
              </p>
              <ul className="space-y-0.5">
                {entry.achievementsToday.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-green-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 도전 과제 */}
          {entry.challengesFaced.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-orange-600 mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                도전 과제
              </p>
              <ul className="space-y-0.5">
                {entry.challengesFaced.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-orange-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 다음 목표 */}
          {entry.nextGoals.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-blue-600 mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                다음 목표
              </p>
              <ul className="space-y-0.5">
                {entry.nextGoals.map((item, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1"
                  >
                    <span className="text-blue-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
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
  groupId: string;
  entries: GrowthJournalEntry[];
  totalEntries: number;
  averageSelfRating: number;
  moodDistribution: Record<GrowthJournalMood, number>;
  topSkillsPracticed: { skill: string; count: number }[];
}

function StatsPanel({
  entries,
  totalEntries,
  averageSelfRating,
  moodDistribution,
  topSkillsPracticed,
}: StatsPanelProps) {
  const topMood = (Object.entries(moodDistribution) as [GrowthJournalMood, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="rounded-md border bg-muted/20 p-3 space-y-3">
      <p className="text-xs font-medium flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-muted-foreground" />
        성장 통계
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-background border px-2 py-2 text-center">
          <p className="text-base font-bold">{totalEntries}</p>
          <p className="text-[10px] text-muted-foreground">총 일지</p>
        </div>
        <div className="rounded-md bg-background border px-2 py-2 text-center">
          <p className="text-base font-bold">{averageSelfRating.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">평균 자기평가</p>
        </div>
        <div className="rounded-md bg-background border px-2 py-2 text-center">
          <p className="text-lg leading-none">
            {topMood ? MOOD_EMOJI[topMood[0]] : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">주요 무드</p>
        </div>
      </div>

      {/* 자기평가 추이 차트 */}
      <RatingDotChart entries={entries} />

      {/* Top 5 스킬 */}
      {topSkillsPracticed.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">
            자주 연습한 스킬 TOP 5
          </p>
          <div className="flex flex-wrap gap-1">
            {topSkillsPracticed.map(({ skill, count }, i) => (
              <Badge
                key={skill}
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0 gap-1",
                  i === 0 && "bg-primary/10 text-primary border-primary/20"
                )}
              >
                {i === 0 && <span>🏅</span>}
                {skill}
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

interface GrowthJournalCardProps {
  groupId: string;
  memberNames: string[];
}

export function GrowthJournalCard({
  groupId,
  memberNames,
}: GrowthJournalCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GrowthJournalEntry | null>(null);
  const { pending: submitting, execute } = useAsyncAction();
  const [filterMember, setFilterMember] = useState<string>("all");

  const {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
  } = useGrowthJournal(groupId);

  // 통계 직접 계산
  const totalEntries = entries.length;
  const averageSelfRating =
    entries.length > 0
      ? Math.round(
          (entries.reduce((sum, e) => sum + e.selfRating, 0) / entries.length) *
            10
        ) / 10
      : 0;
  const moodDistribution = entries.reduce<Record<string, number>>(
    (acc, e) => {
      acc[e.mood] = (acc[e.mood] ?? 0) + 1;
      return acc;
    },
    {}
  ) as Record<GrowthJournalMood, number>;
  const skillCountMap = entries
    .flatMap((e) => e.skillsPracticed)
    .reduce<Record<string, number>>((acc, skill) => {
      acc[skill] = (acc[skill] ?? 0) + 1;
      return acc;
    }, {});
  const topSkillsPracticed = Object.entries(skillCountMap)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 멤버 필터 + 날짜순 정렬
  const displayed = [...entries]
    .filter((e) => filterMember === "all" || e.memberName === filterMember)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 일지 저장 (신규)
  async function handleAdd(values: FormValues) {
    await execute(async () => {
      addEntry({
        memberName: values.memberName,
        date: values.date,
        title: values.title,
        content: values.content,
        mood: values.mood,
        skillsPracticed: parseList(values.skillsPracticed),
        achievementsToday: parseList(values.achievementsToday),
        challengesFaced: parseList(values.challengesFaced),
        nextGoals: parseList(values.nextGoals),
        selfRating: values.selfRating,
      });
      toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_SAVE_SUCCESS);
      setDialogOpen(false);
    });
  }

  // 일지 수정
  async function handleUpdate(values: FormValues) {
    if (!editTarget) return;
    await execute(async () => {
      updateEntry(editTarget.id, {
        memberName: values.memberName,
        date: values.date,
        title: values.title,
        content: values.content,
        mood: values.mood,
        skillsPracticed: parseList(values.skillsPracticed),
        achievementsToday: parseList(values.achievementsToday),
        challengesFaced: parseList(values.challengesFaced),
        nextGoals: parseList(values.nextGoals),
        selfRating: values.selfRating,
      });
      toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_UPDATED);
      setDialogOpen(false);
      setEditTarget(null);
    });
  }

  // 일지 삭제
  function handleDelete(id: string) {
    deleteEntry(id);
    toast.success(TOAST.MEMBERS.GROWTH_JOURNAL_DELETED);
  }

  // 수정 모드 전환
  function handleEdit(entry: GrowthJournalEntry) {
    setEditTarget(entry);
    setDialogOpen(true);
  }

  // 다이얼로그 닫기
  function handleDialogOpenChange(next: boolean) {
    setDialogOpen(next);
    if (!next) {
      setEditTarget(null);
    }
  }

  // 카드 접기 시 필터 초기화
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setFilterMember("all");
    }
  }

  return (
    <>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Notebook className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">멤버 성장 일지</span>
                {totalEntries > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {totalEntries}개
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
              ) : (
                <div className="space-y-3">
                  {/* 통계 */}
                  {totalEntries > 0 && (
                    <StatsPanel
                      groupId={groupId}
                      entries={entries}
                      totalEntries={totalEntries}
                      averageSelfRating={averageSelfRating}
                      moodDistribution={moodDistribution}
                      topSkillsPracticed={topSkillsPracticed}
                    />
                  )}

                  {/* 작성 버튼 */}
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => {
                      setEditTarget(null);
                      setDialogOpen(true);
                    }}
                    disabled={memberNames.length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    성장 일지 작성
                  </Button>

                  {/* 멤버 필터 */}
                  {entries.length > 0 && memberNames.length > 1 && (
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant={filterMember === "all" ? "default" : "outline"}
                        className="text-[10px] px-1.5 py-0 cursor-pointer"
                        onClick={() => setFilterMember("all")}
                      >
                        전체
                      </Badge>
                      {memberNames.map((name) => (
                        <Badge
                          key={name}
                          variant={filterMember === name ? "default" : "outline"}
                          className="text-[10px] px-1.5 py-0 cursor-pointer"
                          onClick={() =>
                            setFilterMember((prev) =>
                              prev === name ? "all" : name
                            )
                          }
                        >
                          {name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 일지 목록 */}
                  {displayed.length === 0 ? (
                    <div className="text-center py-6">
                      <Notebook className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {entries.length === 0
                          ? "아직 작성한 성장 일지가 없습니다."
                          : "해당 멤버의 일지가 없습니다."}
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

      {/* 일지 작성/수정 다이얼로그 */}
      <JournalDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        initial={editTarget ?? undefined}
        memberNames={memberNames}
        defaultMember={filterMember !== "all" ? filterMember : memberNames[0]}
        onSubmit={editTarget ? handleUpdate : handleAdd}
        submitting={submitting}
      />
    </>
  );
}
