"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Trophy,
  Music2,
  Eye,
  Heart,
  Link2,
  CalendarDays,
  Pencil,
  X,
  Flame,
} from "lucide-react";
import { toast } from "sonner";
import { useMemberDanceChallenge } from "@/hooks/use-member-dance-challenge";
import type {
  DanceChallengeEntry,
  DanceChallengePlatform,
  DanceChallengeResult,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ============================================================
// 레이블/색상 상수
// ============================================================

const PLATFORM_LABELS: Record<DanceChallengePlatform, string> = {
  instagram: "인스타그램",
  tiktok: "틱톡",
  youtube: "유튜브",
  offline: "오프라인",
  other: "기타",
};

const PLATFORM_COLORS: Record<DanceChallengePlatform, string> = {
  instagram: "bg-pink-100 text-pink-700 border-pink-200",
  tiktok: "bg-purple-100 text-purple-700 border-purple-200",
  youtube: "bg-red-100 text-red-700 border-red-200",
  offline: "bg-green-100 text-green-700 border-green-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

const RESULT_LABELS: Record<DanceChallengeResult, string> = {
  completed: "완료",
  in_progress: "진행중",
  abandoned: "포기",
};

const RESULT_COLORS: Record<DanceChallengeResult, string> = {
  completed: "bg-green-100 text-green-700 border-green-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  abandoned: "bg-gray-100 text-gray-500 border-gray-200",
};

// ============================================================
// 유틸
// ============================================================

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}천`;
  return n.toLocaleString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 챌린지 추가/수정 다이얼로그
// ============================================================

type EntryFormValues = {
  challengeName: string;
  platform: DanceChallengePlatform;
  date: string;
  songTitle: string;
  videoUrl: string;
  viewCount: string;
  likeCount: string;
  result: DanceChallengeResult;
  notes: string;
};

const EMPTY_FORM: EntryFormValues = {
  challengeName: "",
  platform: "instagram",
  date: todayStr(),
  songTitle: "",
  videoUrl: "",
  viewCount: "",
  likeCount: "",
  result: "completed",
  notes: "",
};

function entryToForm(entry: DanceChallengeEntry): EntryFormValues {
  return {
    challengeName: entry.challengeName,
    platform: entry.platform,
    date: entry.date,
    songTitle: entry.songTitle ?? "",
    videoUrl: entry.videoUrl ?? "",
    viewCount: entry.viewCount !== undefined ? String(entry.viewCount) : "",
    likeCount: entry.likeCount !== undefined ? String(entry.likeCount) : "",
    result: entry.result,
    notes: entry.notes ?? "",
  };
}

type EntryDialogProps = {
  mode: "add" | "edit";
  initialValues?: EntryFormValues;
  trigger: React.ReactNode;
  onSubmit: (values: EntryFormValues) => void;
};

function EntryDialog({ mode, initialValues, trigger, onSubmit }: EntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EntryFormValues>(
    initialValues ?? EMPTY_FORM
  );

  const setField = <K extends keyof EntryFormValues>(
    key: K,
    value: EntryFormValues[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => setForm(initialValues ?? EMPTY_FORM);

  const handleOpen = (v: boolean) => {
    if (v) setForm(initialValues ?? EMPTY_FORM);
    setOpen(v);
  };

  const handleSubmit = () => {
    if (!form.challengeName.trim()) {
      toast.error("챌린지명을 입력해주세요");
      return;
    }
    if (!form.date) {
      toast.error("참여 날짜를 입력해주세요");
      return;
    }
    if (form.viewCount && isNaN(Number(form.viewCount))) {
      toast.error("조회수는 숫자로 입력해주세요");
      return;
    }
    if (form.likeCount && isNaN(Number(form.likeCount))) {
      toast.error("좋아요 수는 숫자로 입력해주세요");
      return;
    }
    onSubmit(form);
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "챌린지 기록 추가" : "챌린지 기록 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 챌린지명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              챌린지명 <span className="text-red-500">*</span>
            </label>
            <Input
              value={form.challengeName}
              onChange={(e) => setField("challengeName", e.target.value)}
              placeholder="예: 아이유 빠빠야 챌린지"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 플랫폼 + 날짜 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">플랫폼</label>
              <Select
                value={form.platform}
                onValueChange={(v) => setField("platform", v as DanceChallengePlatform)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLATFORM_LABELS) as DanceChallengePlatform[]).map((key) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {PLATFORM_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                참여 날짜 <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 곡명 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              곡명 (선택)
            </label>
            <Input
              value={form.songTitle}
              onChange={(e) => setField("songTitle", e.target.value)}
              placeholder="예: Next Level"
              className="h-8 text-xs"
              maxLength={60}
            />
          </div>

          {/* 영상 URL */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              영상 URL (선택)
            </label>
            <Input
              value={form.videoUrl}
              onChange={(e) => setField("videoUrl", e.target.value)}
              placeholder="https://..."
              className="h-8 text-xs"
              maxLength={300}
            />
          </div>

          {/* 조회수 + 좋아요 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                조회수 (선택)
              </label>
              <Input
                type="number"
                min={0}
                value={form.viewCount}
                onChange={(e) => setField("viewCount", e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                좋아요 수 (선택)
              </label>
              <Input
                type="number"
                min={0}
                value={form.likeCount}
                onChange={(e) => setField("likeCount", e.target.value)}
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 결과 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">결과</label>
            <Select
              value={form.result}
              onValueChange={(v) => setField("result", v as DanceChallengeResult)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RESULT_LABELS) as DanceChallengeResult[]).map((key) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    {RESULT_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              메모 (선택)
            </label>
            <Textarea
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="챌린지 관련 메모를 남겨보세요"
              className="text-xs min-h-[60px] resize-none"
              maxLength={300}
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => { resetForm(); setOpen(false); }}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleSubmit}
            >
              {mode === "add" ? "추가" : "저장"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단일 챌린지 기록 행
// ============================================================

type EntryRowProps = {
  entry: DanceChallengeEntry;
  onUpdate: (id: string, values: EntryFormValues) => void;
  onDelete: (id: string) => void;
};

function EntryRow({ entry, onUpdate, onDelete }: EntryRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-start gap-2.5 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            {/* 아이콘 */}
            <div className="mt-0.5 shrink-0">
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {entry.challengeName}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${PLATFORM_COLORS[entry.platform]}`}
                >
                  {PLATFORM_LABELS[entry.platform]}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 shrink-0 ${RESULT_COLORS[entry.result]}`}
                >
                  {RESULT_LABELS[entry.result]}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>{formatYearMonthDay(entry.date)}</span>
                </div>
                {entry.songTitle && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Music2 className="h-3 w-3" />
                    <span className="truncate max-w-[100px]">{entry.songTitle}</span>
                  </div>
                )}
                {entry.viewCount !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{formatNumber(entry.viewCount)}</span>
                  </div>
                )}
                {entry.likeCount !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Heart className="h-3 w-3" />
                    <span>{formatNumber(entry.likeCount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 화살표 */}
            <div className="shrink-0 text-muted-foreground">
              {open ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t bg-muted/10 space-y-2">
            {/* 영상 URL */}
            {entry.videoUrl && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <a
                  href={entry.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {entry.videoUrl}
                </a>
              </div>
            )}

            {/* 메모 */}
            {entry.notes && (
              <p className="text-[11px] text-muted-foreground bg-muted/30 rounded p-2">
                {entry.notes}
              </p>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-1 border-t border-muted/40">
              <p className="text-[10px] text-muted-foreground">
                등록: {formatYearMonthDay(entry.createdAt.slice(0, 10))}
              </p>
              <div className="flex gap-1">
                <EntryDialog
                  mode="edit"
                  initialValues={entryToForm(entry)}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      수정
                    </Button>
                  }
                  onSubmit={(values) => {
                    onUpdate(entry.id, values);
                    toast.success("기록이 수정되었습니다");
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-red-500"
                  onClick={() => {
                    onDelete(entry.id);
                    toast.success("기록이 삭제되었습니다");
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================
// 필터 탭
// ============================================================

type FilterValue = "all" | DanceChallengeResult | DanceChallengePlatform;

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

type DanceChallengeCardProps = {
  memberId: string;
  memberName?: string;
};

export function DanceChallengeCard({
  memberId,
  memberName,
}: DanceChallengeCardProps) {
  const { entries, loading, addEntry, updateEntry, deleteEntry, stats } =
    useMemberDanceChallenge(memberId);

  const [filter, setFilter] = useState<FilterValue>("all");

  // 필터링된 목록
  const filteredEntries = (() => {
    if (filter === "all") return entries;
    if (
      filter === "completed" ||
      filter === "in_progress" ||
      filter === "abandoned"
    ) {
      return entries.filter((e) => e.result === filter);
    }
    return entries.filter((e) => e.platform === filter);
  })();

  const handleAdd = (values: EntryFormValues) => {
    addEntry({
      challengeName: values.challengeName,
      platform: values.platform,
      date: values.date,
      songTitle: values.songTitle || undefined,
      videoUrl: values.videoUrl || undefined,
      viewCount: values.viewCount ? Number(values.viewCount) : undefined,
      likeCount: values.likeCount ? Number(values.likeCount) : undefined,
      result: values.result,
      notes: values.notes || undefined,
    });
    toast.success("챌린지 기록이 추가되었습니다");
  };

  const handleUpdate = (id: string, values: EntryFormValues) => {
    updateEntry(id, {
      challengeName: values.challengeName,
      platform: values.platform,
      date: values.date,
      songTitle: values.songTitle,
      videoUrl: values.videoUrl,
      viewCount: values.viewCount ? Number(values.viewCount) : undefined,
      likeCount: values.likeCount ? Number(values.likeCount) : undefined,
      result: values.result,
      notes: values.notes,
    });
  };

  if (loading) {
    return (
      <div className="border rounded-xl p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-8 bg-muted rounded" />
        <div className="h-8 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="border rounded-xl p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold">
            댄스 챌린지 참여 기록
            {memberName && (
              <span className="text-muted-foreground font-normal ml-1">
                — {memberName}
              </span>
            )}
          </span>
        </div>
        <EntryDialog
          mode="add"
          trigger={
            <Button size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              기록 추가
            </Button>
          }
          onSubmit={handleAdd}
        />
      </div>

      {/* 요약 통계 */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="bg-muted/40 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-foreground">
              {stats.totalCount}
            </div>
            <div className="text-[10px] text-muted-foreground">전체</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-green-600">
              {stats.completedCount}
            </div>
            <div className="text-[10px] text-muted-foreground">완료</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-blue-600">
              {stats.inProgressCount}
            </div>
            <div className="text-[10px] text-muted-foreground">진행중</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-orange-500">
              {stats.totalViews > 0 ? formatNumber(stats.totalViews) : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground">총 조회수</div>
          </div>
        </div>
      )}

      {/* 필터 버튼 */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "전체"],
              ["completed", "완료"],
              ["in_progress", "진행중"],
              ["abandoned", "포기"],
            ] as [FilterValue, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                filter === val
                  ? "bg-foreground text-background border-foreground"
                  : "text-muted-foreground border-muted-foreground/30 hover:border-foreground/50"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="self-center text-muted-foreground/30 text-[10px]">|</span>
          {(
            Object.keys(PLATFORM_LABELS) as DanceChallengePlatform[]
          )
            .filter((p) => stats.platformCounts[p] > 0)
            .map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                  filter === p
                    ? "bg-foreground text-background border-foreground"
                    : "text-muted-foreground border-muted-foreground/30 hover:border-foreground/50"
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              초기화
            </button>
          )}
        </div>
      )}

      {/* 기록 목록 */}
      {entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">아직 등록된 챌린지 기록이 없습니다</p>
          <p className="text-[11px] mt-0.5 opacity-70">
            상단의 &quot;기록 추가&quot; 버튼을 눌러 시작하세요
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-xs">해당 필터에 맞는 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdate}
              onDelete={deleteEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
}
