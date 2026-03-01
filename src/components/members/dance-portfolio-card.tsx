"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  MapPin,
  User,
  Tag,
  Star,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useDancePortfolio } from "@/hooks/use-dance-portfolio";
import type { DancePortfolioEntry, PortfolioEntryType, PortfolioAward } from "@/types";
import { cn } from "@/lib/utils";

// ============================================================
// 상수 정의
// ============================================================

const TYPE_META: Record<
  PortfolioEntryType,
  { label: string; color: string }
> = {
  performance: {
    label: "공연",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  competition: {
    label: "대회",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  workshop: {
    label: "워크샵",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  collaboration: {
    label: "협업",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  solo: {
    label: "솔로",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

const TYPE_ORDER: PortfolioEntryType[] = [
  "performance",
  "competition",
  "workshop",
  "collaboration",
  "solo",
];

// ============================================================
// 항목 추가/편집 다이얼로그
// ============================================================

interface EntryDialogProps {
  initial?: DancePortfolioEntry;
  onSave: (payload: Omit<DancePortfolioEntry, "id" | "createdAt">) => Promise<void>;
  trigger: React.ReactNode;
}

function EntryDialog({ initial, onSave, trigger }: EntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PortfolioEntryType>(initial?.type ?? "performance");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [highlights, setHighlights] = useState<string[]>(initial?.highlights ?? []);
  const [highlightInput, setHighlightInput] = useState("");
  const [awards, setAwards] = useState<PortfolioAward[]>(initial?.awards ?? []);
  const [awardTitle, setAwardTitle] = useState("");
  const [awardRank, setAwardRank] = useState("");
  const [awardDate, setAwardDate] = useState("");
  const { pending: saving, execute: executeSave } = useAsyncAction();

  function resetForm() {
    setType(initial?.type ?? "performance");
    setTitle(initial?.title ?? "");
    setDate(initial?.date ?? "");
    setVenue(initial?.venue ?? "");
    setRole(initial?.role ?? "");
    setGenre(initial?.genre ?? "");
    setDescription(initial?.description ?? "");
    setHighlights(initial?.highlights ?? []);
    setHighlightInput("");
    setAwards(initial?.awards ?? []);
    setAwardTitle("");
    setAwardRank("");
    setAwardDate("");
  }

  function handleOpen(value: boolean) {
    if (value) resetForm();
    setOpen(value);
  }

  function addHighlight() {
    const trimmed = highlightInput.trim();
    if (!trimmed) return;
    setHighlights((prev) => [...prev, trimmed]);
    setHighlightInput("");
  }

  function removeHighlight(idx: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  }

  function addAward() {
    const trimmed = awardTitle.trim();
    if (!trimmed) return;
    setAwards((prev) => [
      ...prev,
      { title: trimmed, rank: awardRank.trim() || undefined, date: awardDate },
    ]);
    setAwardTitle("");
    setAwardRank("");
    setAwardDate("");
  }

  function removeAward(idx: number) {
    setAwards((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error(TOAST.MEMBERS.PORTFOLIO_TITLE_REQUIRED);
      return;
    }
    if (!date) {
      toast.error(TOAST.MEMBERS.PORTFOLIO_DATE_REQUIRED);
      return;
    }
    await executeSave(async () => {
      await onSave({
        type,
        title: title.trim(),
        date,
        venue: venue.trim() || undefined,
        role: role.trim() || undefined,
        genre: genre.trim() || undefined,
        description: description.trim() || undefined,
        highlights,
        awards,
      });
      toast.success(initial ? TOAST.ITEM_UPDATED : TOAST.ITEM_ADDED);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initial ? "포트폴리오 수정" : "포트폴리오 항목 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">유형</Label>
            <Select value={type} onValueChange={(v) => setType(v as PortfolioEntryType)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_ORDER.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TYPE_META[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              placeholder="행사/공연 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜 *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label className="text-xs">장소</Label>
            <Input
              placeholder="공연/행사 장소"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 역할 */}
          <div className="space-y-1">
            <Label className="text-xs">역할</Label>
            <Input
              placeholder="예: 메인 댄서, 안무가..."
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 장르 */}
          <div className="space-y-1">
            <Label className="text-xs">장르</Label>
            <Input
              placeholder="예: 힙합, 팝핀, 브레이킹..."
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">설명</Label>
            <Textarea
              placeholder="활동에 대한 간략한 설명..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[60px] resize-none"
            />
          </div>

          {/* 하이라이트 */}
          <div className="space-y-1.5">
            <Label className="text-xs">주요 하이라이트</Label>
            <div className="flex gap-1.5">
              <Input
                placeholder="기억에 남는 순간..."
                value={highlightInput}
                onChange={(e) => setHighlightInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addHighlight();
                  }
                }}
                className="h-7 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0 shrink-0"
                onClick={addHighlight}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {highlights.length > 0 && (
              <ul className="space-y-1">
                {highlights.map((h, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs rounded-md bg-muted/30 px-2 py-1">
                    <span className="truncate">{h}</span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="ml-1 shrink-0 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 수상내역 */}
          <div className="space-y-1.5">
            <Label className="text-xs">수상내역</Label>
            <div className="space-y-1">
              <Input
                placeholder="수상 제목"
                value={awardTitle}
                onChange={(e) => setAwardTitle(e.target.value)}
                className="h-7 text-xs"
              />
              <div className="flex gap-1.5">
                <Input
                  placeholder="순위 (예: 1위, 금상...)"
                  value={awardRank}
                  onChange={(e) => setAwardRank(e.target.value)}
                  className="h-7 text-xs"
                />
                <Input
                  type="date"
                  value={awardDate}
                  onChange={(e) => setAwardDate(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 shrink-0"
                  onClick={addAward}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {awards.length > 0 && (
              <ul className="space-y-1">
                {awards.map((award, idx) => (
                  <li key={idx} className="flex items-center justify-between text-xs rounded-md bg-amber-50 border border-amber-200 px-2 py-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Trophy className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{award.title}</span>
                      {award.rank && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-300 shrink-0">
                          {award.rank}
                        </Badge>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAward(idx)}
                      className="ml-1 shrink-0 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSave}
              disabled={saving}
            >
              <Check className="h-3 w-3 mr-1" />
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function DancePortfolioCard({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(true);
  const [activeType, setActiveType] = useState<PortfolioEntryType | "all">("all");
  const { entries, addEntry, updateEntry, deleteEntry, stats } =
    useDancePortfolio(memberId);

  // 필터 적용 + 최신순 정렬
  const filtered = (
    activeType === "all" ? entries : entries.filter((e) => e.type === activeType)
  ).slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 연도별 그룹화
  const byYear = filtered.reduce<Record<number, DancePortfolioEntry[]>>((acc, e) => {
    const year = new Date(e.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(e);
    return acc;
  }, {});
  const sortedYears = Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a);

  // 수상 하이라이트 전체 모음
  const allAwards = entries.flatMap((e) =>
    e.awards.map((a) => ({ ...a, entryTitle: e.title }))
  );

  async function handleDelete(id: string) {
    try {
      await deleteEntry(id);
      toast.success(TOAST.MEMBERS.PORTFOLIO_ITEM_DELETED);
    } catch {
      toast.error(TOAST.DELETE_ERROR);
    }
  }

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-100">
                  <Trophy className="h-4 w-4 text-amber-600" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  댄스 포트폴리오
                </CardTitle>
                {stats.totalEntries > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {stats.totalEntries}개
                  </Badge>
                )}
                {stats.totalAwards > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    수상 {stats.totalAwards}건
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 통계 요약 */}
            {stats.totalEntries > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <StatChip
                  label="전체 활동"
                  value={`${stats.totalEntries}개`}
                  color="text-amber-600"
                />
                <StatChip
                  label="수상 경력"
                  value={`${stats.totalAwards}건`}
                  color="text-yellow-600"
                />
                <StatChip
                  label="활동 기간"
                  value={
                    stats.yearRange
                      ? stats.yearRange.min === stats.yearRange.max
                        ? `${stats.yearRange.min}년`
                        : `${stats.yearRange.min}-${stats.yearRange.max}`
                      : "-"
                  }
                  color="text-orange-600"
                />
              </div>
            )}

            {/* 유형별 필터 탭 */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setActiveType("all")}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                  activeType === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
                )}
              >
                전체 ({stats.totalEntries})
              </button>
              {TYPE_ORDER.map((t) => {
                const count = stats.typeBreakdown[t];
                if (count === 0) return null;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveType(t)}
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                      activeType === t
                        ? "bg-foreground text-background border-foreground"
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    {TYPE_META[t].label} ({count})
                  </button>
                );
              })}
            </div>

            {/* 연도별 타임라인 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  활동 타임라인
                </span>
                <EntryDialog
                  onSave={addEntry}
                  trigger={
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2">
                      <Plus className="h-3 w-3 mr-0.5" />
                      추가
                    </Button>
                  }
                />
              </div>

              {filtered.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md">
                  {activeType === "all"
                    ? "아직 등록된 포트폴리오 항목이 없습니다."
                    : `등록된 ${TYPE_META[activeType].label} 항목이 없습니다.`}
                </p>
              ) : (
                <div className="space-y-4">
                  {sortedYears.map((year) => (
                    <div key={year} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {year}년
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="space-y-2 pl-2 border-l-2 border-muted ml-1">
                        {byYear[year].map((entry) => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            onEdit={(payload) => updateEntry(entry.id, payload)}
                            onDelete={() => handleDelete(entry.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 수상 하이라이트 섹션 */}
            {allAwards.length > 0 && (
              <section className="space-y-2 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  수상 하이라이트
                </span>
                <div className="space-y-1">
                  {allAwards.map((award, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium text-amber-800">
                          {award.title}
                        </span>
                        {award.rank && (
                          <Badge
                            variant="outline"
                            className="ml-1.5 text-[10px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-300"
                          >
                            {award.rank}
                          </Badge>
                        )}
                        <span className="text-[10px] text-amber-600 ml-1.5">
                          {award.entryTitle}
                        </span>
                      </div>
                      {award.date && (
                        <span className="text-[10px] text-amber-600 shrink-0">
                          {award.date}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================
// 하위 컴포넌트: 항목 행
// ============================================================

interface EntryRowProps {
  entry: DancePortfolioEntry;
  onEdit: (payload: Omit<DancePortfolioEntry, "id" | "createdAt">) => Promise<void>;
  onDelete: () => void;
}

function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  return (
    <div className="group rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors px-3 py-2 space-y-1.5">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 shrink-0", TYPE_META[entry.type].color)}
          >
            {TYPE_META[entry.type].label}
          </Badge>
          <span className="text-xs font-medium truncate">{entry.title}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <EntryDialog
            initial={entry}
            onSave={onEdit}
            trigger={
              <button
                type="button"
                className="p-1 hover:text-blue-600 transition-colors"
                aria-label="항목 편집"
              >
                <Pencil className="h-3 w-3" />
              </button>
            }
          />
          <button
            type="button"
            onClick={onDelete}
            className="p-1 hover:text-red-600 transition-colors"
            aria-label="항목 삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 메타 정보 행 */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Calendar className="h-3 w-3" />
          {entry.date}
        </span>
        {entry.venue && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {entry.venue}
          </span>
        )}
        {entry.role && (
          <span className="flex items-center gap-0.5">
            <User className="h-3 w-3" />
            {entry.role}
          </span>
        )}
        {entry.genre && (
          <span className="flex items-center gap-0.5">
            <Tag className="h-3 w-3" />
            {entry.genre}
          </span>
        )}
      </div>

      {/* 설명 */}
      {entry.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {entry.description}
        </p>
      )}

      {/* 수상내역 */}
      {entry.awards.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.awards.map((award, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-0.5 text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0"
            >
              <Trophy className="h-2.5 w-2.5 text-amber-500" />
              {award.title}
              {award.rank && ` · ${award.rank}`}
            </span>
          ))}
        </div>
      )}

      {/* 하이라이트 */}
      {entry.highlights.length > 0 && (
        <ul className="space-y-0.5">
          {entry.highlights.map((h, idx) => (
            <li key={idx} className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <span className="text-blue-400 mt-0.5 shrink-0">•</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// 하위 컴포넌트: 통계 칩
// ============================================================

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="text-center rounded-md border bg-muted/20 py-1.5 px-1">
      <p className={cn("text-sm font-semibold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
