"use client";

import { useState, useMemo } from "react";
import {
  History,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MapPin,
  Users,
  Star,
  Trophy,
  Music,
  Pencil,
  CalendarDays,
  Mic2,
  Swords,
  PartyPopper,
  Zap,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePerformanceHistory } from "@/hooks/use-performance-history";
import type {
  PerformanceHistoryRecord,
  PerformanceHistoryType,
} from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const TYPE_LABEL: Record<PerformanceHistoryType, string> = {
  concert: "콘서트",
  competition: "대회",
  festival: "페스티벌",
  showcase: "쇼케이스",
  flash_mob: "플래시몹",
  other: "기타",
};

const TYPE_COLOR: Record<PerformanceHistoryType, string> = {
  concert: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  competition: "bg-red-100 text-red-700 hover:bg-red-100",
  festival: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  showcase: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  flash_mob: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  other: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

const TYPE_ICON: Record<PerformanceHistoryType, React.ReactNode> = {
  concert: <Mic2 className="h-3 w-3" />,
  competition: <Swords className="h-3 w-3" />,
  festival: <PartyPopper className="h-3 w-3" />,
  showcase: <Zap className="h-3 w-3" />,
  flash_mob: <Sparkles className="h-3 w-3" />,
  other: <HelpCircle className="h-3 w-3" />,
};

const ALL_TYPES = Object.keys(TYPE_LABEL) as PerformanceHistoryType[];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={cn(
            "focus:outline-none",
            readonly ? "cursor-default" : "cursor-pointer"
          )}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              n <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 기록 추가/편집 다이얼로그
// ============================================================

type RecordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (
    input: Omit<PerformanceHistoryRecord, "id" | "createdAt">
  ) => Promise<void>;
  initial?: PerformanceHistoryRecord | null;
};

function RecordDialog({ open, onClose, onSave, initial }: RecordDialogProps) {
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<PerformanceHistoryType>(
    initial?.type ?? "concert"
  );
  const [date, setDate] = useState(initial?.date ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [audienceCount, setAudienceCount] = useState(
    initial?.audienceCount != null ? String(initial.audienceCount) : ""
  );
  const [performers, setPerformers] = useState(
    (initial?.performers ?? []).join(", ")
  );
  const [setlist, setSetlist] = useState(
    (initial?.setlist ?? []).join("\n")
  );
  const [awards, setAwards] = useState(
    (initial?.awards ?? []).join("\n")
  );
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [highlights, setHighlights] = useState(initial?.highlights ?? "");
  const [lessonsLearned, setLessonsLearned] = useState(
    initial?.lessonsLearned ?? ""
  );
  const [saving, setSaving] = useState(false);

  // initial이 바뀌면 폼 초기화
  const resetToInitial = () => {
    setTitle(initial?.title ?? "");
    setType(initial?.type ?? "concert");
    setDate(initial?.date ?? "");
    setVenue(initial?.venue ?? "");
    setAudienceCount(
      initial?.audienceCount != null ? String(initial.audienceCount) : ""
    );
    setPerformers((initial?.performers ?? []).join(", "));
    setSetlist((initial?.setlist ?? []).join("\n"));
    setAwards((initial?.awards ?? []).join("\n"));
    setRating(initial?.rating ?? 0);
    setHighlights(initial?.highlights ?? "");
    setLessonsLearned(initial?.lessonsLearned ?? "");
  };

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!venue.trim()) {
      toast.error("장소를 입력해주세요.");
      return;
    }

    const parsedPerformers = performers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedSetlist = setlist
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedAwards = awards
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        date,
        venue: venue.trim(),
        audienceCount: audienceCount ? Number(audienceCount) : undefined,
        performers: parsedPerformers,
        setlist: parsedSetlist,
        awards: parsedAwards.length > 0 ? parsedAwards : undefined,
        rating: rating > 0 ? rating : undefined,
        highlights: highlights.trim() || undefined,
        lessonsLearned: lessonsLearned.trim() || undefined,
      });
      toast.success(isEdit ? "기록이 수정되었습니다." : "공연 기록이 추가되었습니다.");
      resetToInitial();
      onClose();
    } catch {
      toast.error(isEdit ? "기록 수정에 실패했습니다." : "기록 추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          resetToInitial();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <History className="h-4 w-4 text-indigo-500" />
            {isEdit ? "공연 기록 수정" : "공연 기록 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 공연명 */}
          <div className="space-y-1">
            <Label className="text-xs">공연명 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2025 연말 공연, 전국 댄스 대회"
              className="h-8 text-xs"
            />
          </div>

          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PerformanceHistoryType)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 날짜 / 장소 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">날짜 *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">장소 *</Label>
              <Input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="공연 장소"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 관객수 */}
          <div className="space-y-1">
            <Label className="text-xs">관객수 (명)</Label>
            <Input
              type="number"
              value={audienceCount}
              onChange={(e) => setAudienceCount(e.target.value)}
              placeholder="0"
              className="h-8 text-xs"
              min={0}
            />
          </div>

          {/* 출연자 */}
          <div className="space-y-1">
            <Label className="text-xs">출연자 (쉼표로 구분)</Label>
            <Input
              value={performers}
              onChange={(e) => setPerformers(e.target.value)}
              placeholder="홍길동, 김철수, 이영희"
              className="h-8 text-xs"
            />
          </div>

          {/* 세트리스트 */}
          <div className="space-y-1">
            <Label className="text-xs">세트리스트 (줄바꿈으로 구분)</Label>
            <Textarea
              value={setlist}
              onChange={(e) => setSetlist(e.target.value)}
              placeholder={"1. 곡명\n2. 곡명"}
              className="text-xs min-h-[70px] resize-none"
            />
          </div>

          {/* 수상 */}
          <div className="space-y-1">
            <Label className="text-xs">수상 내역 (줄바꿈으로 구분)</Label>
            <Textarea
              value={awards}
              onChange={(e) => setAwards(e.target.value)}
              placeholder={"대상\n최우수상"}
              className="text-xs min-h-[50px] resize-none"
            />
          </div>

          {/* 별점 */}
          <div className="space-y-1">
            <Label className="text-xs">자체 평점</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* 하이라이트 */}
          <div className="space-y-1">
            <Label className="text-xs">하이라이트</Label>
            <Textarea
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="공연의 가장 멋진 순간을 기록해주세요"
              className="text-xs min-h-[50px] resize-none"
            />
          </div>

          {/* 배운 점 */}
          <div className="space-y-1">
            <Label className="text-xs">배운 점 / 개선사항</Label>
            <Textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="다음 공연을 위해 기억할 교훈"
              className="text-xs min-h-[50px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              resetToInitial();
              onClose();
            }}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (isEdit ? "수정 중..." : "추가 중...") : isEdit ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 단일 기록 카드
// ============================================================

type RecordItemProps = {
  record: PerformanceHistoryRecord;
  onEdit: (record: PerformanceHistoryRecord) => void;
  onDelete: (recordId: string) => Promise<void>;
};

function RecordItem({ record, onEdit, onDelete }: RecordItemProps) {
  const [expanded, setExpanded] = useState(false);

  async function handleDelete() {
    if (!confirm("이 공연 기록을 삭제하시겠습니까?")) return;
    await onDelete(record.id);
    toast.success("공연 기록이 삭제되었습니다.");
  }

  const hasExtra =
    record.setlist.length > 0 ||
    (record.awards && record.awards.length > 0) ||
    record.highlights ||
    record.lessonsLearned;

  return (
    <div className="rounded-lg border bg-white p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Badge
            variant="secondary"
            className={cn(
              "flex items-center gap-1 text-[10px] px-1.5 py-0 shrink-0 mt-0.5",
              TYPE_COLOR[record.type]
            )}
          >
            {TYPE_ICON[record.type]}
            {TYPE_LABEL[record.type]}
          </Badge>
          <div className="min-w-0">
            <p className="text-xs font-medium leading-tight truncate">
              {record.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="h-2.5 w-2.5" />
                {formatDate(record.date)}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {record.venue}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(record)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="수정"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-red-500 transition-colors"
            title="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-3 flex-wrap">
        {record.audienceCount != null && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="h-2.5 w-2.5" />
            관객 {record.audienceCount.toLocaleString()}명
          </span>
        )}
        {record.performers.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            출연: {record.performers.join(", ")}
          </span>
        )}
        {record.rating != null && (
          <StarRating value={record.rating} readonly />
        )}
      </div>

      {/* 수상 배지 */}
      {record.awards && record.awards.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {record.awards.map((award, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="flex items-center gap-1 text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
            >
              <Trophy className="h-2.5 w-2.5" />
              {award}
            </Badge>
          ))}
        </div>
      )}

      {/* 확장 버튼 */}
      {hasExtra && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 w-full flex items-center gap-1 justify-center"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                접기
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                상세 보기
              </>
            )}
          </Button>

          {expanded && (
            <div className="space-y-2 pt-1">
              <Separator />

              {/* 세트리스트 */}
              {record.setlist.length > 0 && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Music className="h-2.5 w-2.5" />
                    세트리스트
                  </p>
                  <ol className="space-y-0.5 pl-4">
                    {record.setlist.map((song, i) => (
                      <li key={i} className="text-[10px] list-decimal">
                        {song}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 하이라이트 */}
              {record.highlights && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Sparkles className="h-2.5 w-2.5" />
                    하이라이트
                  </p>
                  <p className="text-[10px] text-foreground whitespace-pre-line">
                    {record.highlights}
                  </p>
                </div>
              )}

              {/* 배운 점 */}
              {record.lessonsLearned && (
                <div className="space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Zap className="h-2.5 w-2.5" />
                    배운 점 / 개선사항
                  </p>
                  <p className="text-[10px] text-foreground whitespace-pre-line">
                    {record.lessonsLearned}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// 연도 그룹
// ============================================================

type YearGroupProps = {
  year: number;
  records: PerformanceHistoryRecord[];
  onEdit: (record: PerformanceHistoryRecord) => void;
  onDelete: (recordId: string) => Promise<void>;
};

function YearGroup({ year, records, onEdit, onDelete }: YearGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {year}년
        </span>
        <span className="text-[10px] text-muted-foreground">
          ({records.length}회)
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2 pl-2">
        {records.map((r) => (
          <RecordItem key={r.id} record={r} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type PerformanceHistoryCardProps = {
  groupId: string;
};

export function PerformanceHistoryCard({ groupId }: PerformanceHistoryCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PerformanceHistoryRecord | null>(null);
  const [typeFilter, setTypeFilter] = useState<PerformanceHistoryType | "all">("all");

  const { records, loading, addRecord, updateRecord, deleteRecord, stats } =
    usePerformanceHistory(groupId);

  // 필터링
  const filteredRecords = useMemo(() => {
    if (typeFilter === "all") return records;
    return records.filter((r) => r.type === typeFilter);
  }, [records, typeFilter]);

  // 연도별 그룹 (최신순)
  const groupedByYear = useMemo(() => {
    const map = new Map<number, PerformanceHistoryRecord[]>();
    const sorted = [...filteredRecords].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    for (const r of sorted) {
      const year = new Date(r.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  }, [filteredRecords]);

  function handleEdit(record: PerformanceHistoryRecord) {
    setEditTarget(record);
    setDialogOpen(true);
  }

  function handleAddNew() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  async function handleSave(
    input: Omit<PerformanceHistoryRecord, "id" | "createdAt">
  ) {
    if (editTarget) {
      await updateRecord(editTarget.id, input);
    } else {
      await addRecord(input);
    }
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">공연 히스토리</span>
                {stats.totalPerformances > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700"
                  >
                    {stats.totalPerformances}회
                  </Badge>
                )}
                {stats.awardCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700"
                  >
                    <Trophy className="h-2.5 w-2.5 mr-0.5" />
                    {stats.awardCount}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {stats.yearRange && (
                  <span className="text-[10px] text-muted-foreground">
                    {stats.yearRange.min === stats.yearRange.max
                      ? `${stats.yearRange.min}년`
                      : `${stats.yearRange.min} - ${stats.yearRange.max}년`}
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            <Separator />

            {/* 통계 요약 */}
            {stats.totalPerformances > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-indigo-600">
                    {stats.totalPerformances}
                  </p>
                  <p className="text-[10px] text-muted-foreground">총 공연</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-blue-600">
                    {stats.totalAudience > 0
                      ? stats.totalAudience.toLocaleString()
                      : "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">총 관객</p>
                </div>
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-xs font-semibold text-yellow-600">
                    {stats.awardCount > 0 ? stats.awardCount : "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">수상</p>
                </div>
              </div>
            )}

            {/* 유형 필터 */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setTypeFilter("all")}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] border transition-colors",
                  typeFilter === "all"
                    ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                    : "bg-white text-muted-foreground border-border hover:bg-muted/40"
                )}
              >
                전체
              </button>
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] border transition-colors",
                    typeFilter === t
                      ? cn(TYPE_COLOR[t], "border-transparent")
                      : "bg-white text-muted-foreground border-border hover:bg-muted/40"
                  )}
                >
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            {/* 추가 버튼 */}
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs flex items-center gap-1"
              onClick={handleAddNew}
            >
              <Plus className="h-3 w-3" />
              공연 기록 추가
            </Button>

            {/* 목록 */}
            {loading ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                불러오는 중...
              </p>
            ) : groupedByYear.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">
                {typeFilter === "all"
                  ? "아직 공연 기록이 없습니다."
                  : `${TYPE_LABEL[typeFilter as PerformanceHistoryType]} 기록이 없습니다.`}
              </p>
            ) : (
              <div className="space-y-4">
                {groupedByYear.map(([year, yearRecords]) => (
                  <YearGroup
                    key={year}
                    year={year}
                    records={yearRecords}
                    onEdit={handleEdit}
                    onDelete={deleteRecord}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 추가/편집 다이얼로그 */}
      <RecordDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSave}
        initial={editTarget}
      />
    </Card>
  );
}
