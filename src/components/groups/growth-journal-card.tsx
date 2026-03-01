"use client";

import { useState } from "react";
import {
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Star,
  BarChart2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useGrowthJournal,
  GROWTH_AREAS,
  type GrowthJournalStats,
} from "@/hooks/use-growth-journal";
import type { GrowthJournalEntry, GrowthArea } from "@/types";

// ============================================================
// 상수 & 스타일 매핑
// ============================================================

const AREA_BADGE: Record<GrowthArea, string> = {
  테크닉: "bg-blue-100 text-blue-700",
  표현력: "bg-pink-100 text-pink-700",
  체력: "bg-orange-100 text-orange-700",
  리더십: "bg-purple-100 text-purple-700",
  협동심: "bg-green-100 text-green-700",
  자신감: "bg-yellow-100 text-yellow-700",
};

const AREA_BAR_COLOR: Record<GrowthArea, string> = {
  테크닉: "bg-blue-400",
  표현력: "bg-pink-400",
  체력: "bg-orange-400",
  리더십: "bg-purple-400",
  협동심: "bg-green-400",
  자신감: "bg-yellow-400",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// 별점 선택기
// ============================================================

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5 rounded transition-colors hover:bg-yellow-50"
          aria-label={`${n}점`}
        >
          <Star
            className={cn(
              "h-5 w-5",
              n <= value
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 성장도 델타 표시
// ============================================================

function GrowthDelta({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="text-[10px] text-muted-foreground">첫 기록</span>
    );
  }
  if (delta > 0) {
    return (
      <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
        <TrendingUp className="h-3 w-3" />+{delta}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="text-[10px] text-red-500 font-medium">
        {delta}
      </span>
    );
  }
  return (
    <span className="text-[10px] text-muted-foreground">유지</span>
  );
}

// ============================================================
// 일지 작성/수정 다이얼로그
// ============================================================

type EntryDialogProps = {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  initial?: GrowthJournalEntry;
  onSave: (data: {
    memberName: string;
    date: string;
    title: string;
    content: string;
    area: GrowthArea;
    level: number;
  }) => void;
};

function EntryDialog({
  open,
  onClose,
  memberNames,
  initial,
  onSave,
}: EntryDialogProps) {
  const isEdit = !!initial;

  const [memberName, setMemberName] = useState(initial?.memberName ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [area, setArea] = useState<GrowthArea>(
    initial?.area ?? "테크닉"
  );
  const [level, setLevel] = useState<number>(initial?.level ?? 3);

  function reset() {
    setMemberName(initial?.memberName ?? "");
    setDate(initial?.date ?? today());
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
    setArea(initial?.area ?? "테크닉");
    setLevel(initial?.level ?? 3);
  }

  function handleSave() {
    if (!memberName.trim()) {
      toast.error(TOAST.GROWTH_JOURNAL.MEMBER_REQUIRED);
      return;
    }
    if (!title.trim()) {
      toast.error(TOAST.GROWTH_JOURNAL.TITLE_REQUIRED);
      return;
    }
    if (!content.trim()) {
      toast.error(TOAST.GROWTH_JOURNAL.CONTENT_REQUIRED);
      return;
    }
    onSave({
      memberName: memberName.trim(),
      date,
      title: title.trim(),
      content: content.trim(),
      area,
      level,
    });
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {isEdit ? "성장 일지 수정" : "성장 일지 작성"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 멤버 선택 */}
          <div className="space-y-1">
            <Label className="text-xs">멤버 이름 *</Label>
            {memberNames.length > 0 ? (
              <Select value={memberName} onValueChange={setMemberName}>
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
            ) : (
              <Input
                placeholder="멤버 이름 입력"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 성장 영역 */}
          <div className="space-y-1">
            <Label className="text-xs">성장 영역</Label>
            <Select
              value={area}
              onValueChange={(v) => setArea(v as GrowthArea)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROWTH_AREAS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 성장 수준 */}
          <div className="space-y-1">
            <Label className="text-xs">
              성장 수준{" "}
              <span className="text-muted-foreground">
                ({level}점 / 5점)
              </span>
            </Label>
            <StarPicker value={level} onChange={setLevel} />
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs">제목 *</Label>
            <Input
              placeholder="오늘의 성장 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">내용 *</Label>
            <Textarea
              placeholder="오늘의 성장 내용을 기록해주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            {isEdit ? "수정" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 개별 일지 카드
// ============================================================

type EntryCardProps = {
  entry: GrowthJournalEntry;
  prevEntry: GrowthJournalEntry | null;
  onEdit: () => void;
  onDelete: () => void;
};

function EntryCard({ entry, prevEntry, onEdit, onDelete }: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const level = entry.level ?? 0;
  const prevLevel = prevEntry?.level ?? null;
  const delta = prevLevel !== null ? level - prevLevel : null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-xs font-medium truncate max-w-[90px] flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            {entry.memberName}
          </span>
          {entry.area && (
            <Badge
              className={cn(
                "text-[10px] px-1.5 py-0",
                AREA_BADGE[entry.area]
              )}
            >
              {entry.area}
            </Badge>
          )}
          <GrowthDelta delta={delta} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 날짜 + 별점 */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span>{entry.date}</span>
        {/* 별점 표시 */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn(
                "h-3 w-3",
                n <= level
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-200"
              )}
            />
          ))}
        </div>
        {prevLevel !== null && (
          <span className="text-[10px] text-muted-foreground">
            이전: {prevLevel}점
          </span>
        )}
      </div>

      {/* 제목 */}
      <p className="text-xs font-medium">{entry.title}</p>

      {/* 내용 (접기/펼치기) */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <p
          className={cn(
            "text-[11px] text-muted-foreground leading-relaxed",
            !expanded && "line-clamp-2"
          )}
        >
          {entry.content}
        </p>
        {entry.content.length > 80 && (
          <CollapsibleTrigger asChild>
            <button className="text-[10px] text-blue-500 hover:text-blue-700 mt-1">
              {expanded ? "접기" : "더 보기"}
            </button>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent />
      </Collapsible>
    </div>
  );
}

// ============================================================
// 통계 패널
// ============================================================

function StatsPanel({ stats }: { stats: GrowthJournalStats }) {
  if (stats.totalEntries === 0) return null;

  return (
    <div className="rounded-lg border p-3 space-y-3 bg-gray-50">
      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        <BarChart2 className="h-3 w-3" />
        통계
      </p>

      {/* 요약 수치 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-blue-600">
            {stats.totalEntries}
          </div>
          <div className="text-[10px] text-muted-foreground">총 일지</div>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-yellow-500">
            {stats.overallAvgLevel > 0 ? stats.overallAvgLevel : "-"}
          </div>
          <div className="text-[10px] text-muted-foreground">평균 성장도</div>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <div className="text-base font-bold text-purple-600">
            {stats.memberEntryCount.length}
          </div>
          <div className="text-[10px] text-muted-foreground">참여 멤버</div>
        </div>
      </div>

      {/* 영역별 평균 성장도 */}
      {stats.areaAvgLevel.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground">
            영역별 평균 성장도
          </p>
          {stats.areaAvgLevel
            .sort((a, b) => b.avgLevel - a.avgLevel)
            .map(({ area, avgLevel, count }) => (
              <div key={area} className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 w-14 justify-center shrink-0",
                    AREA_BADGE[area]
                  )}
                >
                  {area}
                </Badge>
                {/* 진행 바 (최대 5점 기준) */}
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={cn("h-1.5 rounded-full", AREA_BAR_COLOR[area])}
                    style={{ width: `${(avgLevel / 5) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
                  {avgLevel}점 ({count}건)
                </span>
              </div>
            ))}
        </div>
      )}

      {/* 멤버별 일지 수 */}
      {stats.memberEntryCount.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">
            멤버별 일지 수
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {stats.memberEntryCount.map(({ memberName, count }) => (
              <div
                key={memberName}
                className="flex items-center gap-1 rounded-full bg-card border px-2 py-0.5"
              >
                <User className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="text-[10px]">
                  {memberName} {count}건
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type FilterMember = "전체" | string;
type FilterArea = "전체" | GrowthArea;

export function GrowthJournalCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    entries,
    loading,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    getPreviousEntry,
  } = useGrowthJournal(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GrowthJournalEntry | null>(null);
  const [filterMember, setFilterMember] = useState<FilterMember>("전체");
  const [filterArea, setFilterArea] = useState<FilterArea>("전체");
  const [showStats, setShowStats] = useState(false);

  // 모든 멤버 이름 목록 (props + 기존 기록)
  const allMemberNames = Array.from(
    new Set([
      ...memberNames,
      ...entries.map((e) => e.memberName),
    ])
  );

  // 필터링
  const filtered = entries.filter((e) => {
    if (filterMember !== "전체" && e.memberName !== filterMember) return false;
    if (filterArea !== "전체" && e.area !== filterArea) return false;
    return true;
  });

  const sortedFiltered = filtered
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  function handleAdd(data: Parameters<typeof addEntry>[0]) {
    addEntry(data);
    toast.success(TOAST.GROWTH_JOURNAL.ADDED);
  }

  function handleEdit(data: Parameters<typeof addEntry>[0]) {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, data);
    if (ok) toast.success(TOAST.GROWTH_JOURNAL.UPDATED);
    else toast.error(TOAST.UPDATE_ERROR);
    setEditTarget(null);
  }

  function handleDelete(entryId: string) {
    const ok = deleteEntry(entryId);
    if (ok) toast.success(TOAST.GROWTH_JOURNAL.DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 카드 헤더 */}
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">멤버 성장 일지</span>
                {stats.totalEntries > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700">
                    {stats.totalEntries}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 툴바 */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Button
                  variant={showStats ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => setShowStats(!showStats)}
                >
                  <BarChart2 className="h-3 w-3 mr-0.5" />
                  통계
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  일지 작성
                </Button>
              </div>

              {/* 통계 패널 */}
              {showStats && <StatsPanel stats={stats} />}

              {/* 필터 */}
              <div className="space-y-1.5">
                {/* 영역 필터 */}
                <div className="flex gap-1 flex-wrap">
                  <Button
                    variant={filterArea === "전체" ? "default" : "outline"}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setFilterArea("전체")}
                  >
                    전체 영역
                  </Button>
                  {GROWTH_AREAS.map((a) => (
                    <Button
                      key={a}
                      variant={filterArea === a ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterArea(a)}
                    >
                      {a}
                    </Button>
                  ))}
                </div>

                {/* 멤버 필터 */}
                {allMemberNames.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    <Button
                      variant={filterMember === "전체" ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setFilterMember("전체")}
                    >
                      전체 멤버
                    </Button>
                    {allMemberNames.map((name) => (
                      <Button
                        key={name}
                        variant={filterMember === name ? "default" : "outline"}
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setFilterMember(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* 일지 목록 */}
              {loading ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </div>
              ) : sortedFiltered.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  {entries.length === 0
                    ? "아직 성장 일지가 없습니다. 첫 일지를 작성해보세요."
                    : "해당 조건의 일지가 없습니다."}
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedFiltered.map((entry) => {
                    const prevEntry =
                      entry.area
                        ? getPreviousEntry(
                            entry.memberName,
                            entry.area,
                            entry.date,
                            entry.id
                          )
                        : null;
                    return (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        prevEntry={prevEntry}
                        onEdit={() => setEditTarget(entry)}
                        onDelete={() => handleDelete(entry.id)}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 작성 다이얼로그 */}
      <EntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        memberNames={allMemberNames}
        onSave={handleAdd}
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EntryDialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          memberNames={allMemberNames}
          initial={editTarget}
          onSave={handleEdit}
        />
      )}
    </>
  );
}
