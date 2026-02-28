"use client";

import { useState } from "react";
import { useSetList } from "@/hooks/use-set-list";
import type { SetListItemType } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ChevronDown,
  ChevronRight,
  ListOrdered,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Mic2,
  Coffee,
  Star,
  PlayCircle,
  Sunset,
  Sunrise,
  Users,
  Clock,
  Music2,
} from "lucide-react";
import { toast } from "sonner";

// ============================================================
// 유형 헬퍼
// ============================================================

const ALL_TYPES: SetListItemType[] = [
  "opening",
  "performance",
  "mc_talk",
  "intermission",
  "encore",
  "closing",
];

function typeLabel(type: SetListItemType): string {
  switch (type) {
    case "performance":
      return "공연";
    case "mc_talk":
      return "MC";
    case "intermission":
      return "인터미션";
    case "opening":
      return "오프닝";
    case "closing":
      return "클로징";
    case "encore":
      return "앙코르";
  }
}

function TypeIcon({
  type,
  className,
}: {
  type: SetListItemType;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (type) {
    case "performance":
      return <PlayCircle className={cls} />;
    case "mc_talk":
      return <Mic2 className={cls} />;
    case "intermission":
      return <Coffee className={cls} />;
    case "opening":
      return <Sunrise className={cls} />;
    case "closing":
      return <Sunset className={cls} />;
    case "encore":
      return <Star className={cls} />;
  }
}

function typeIconColor(type: SetListItemType): string {
  switch (type) {
    case "performance":
      return "text-blue-500";
    case "mc_talk":
      return "text-yellow-600";
    case "intermission":
      return "text-gray-500";
    case "opening":
      return "text-blue-600";
    case "closing":
      return "text-red-500";
    case "encore":
      return "text-yellow-500";
  }
}

/** 유형별 행 배경색 */
function typeRowBgClass(type: SetListItemType): string {
  switch (type) {
    case "performance":
      return "";
    case "mc_talk":
      return "bg-yellow-50 dark:bg-yellow-950/20";
    case "intermission":
      return "bg-gray-50 dark:bg-gray-900/30";
    case "opening":
      return "bg-blue-50 dark:bg-blue-950/20";
    case "closing":
      return "bg-red-50 dark:bg-red-950/20";
    case "encore":
      return "bg-amber-50 dark:bg-amber-950/20";
  }
}

// ============================================================
// 시간 포맷 헬퍼
// ============================================================

/** 초 -> MM:SS */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** MM:SS 또는 M:SS -> 초 (파싱 실패 시 0 반환) */
function parseDuration(value: string): number {
  const trimmed = value.trim();
  // MM:SS
  const match = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (match) {
    const m = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    if (!isNaN(m) && !isNaN(s) && s < 60) return m * 60 + s;
  }
  // 순수 숫자 (초 단위)
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 0) return num;
  return 0;
}

// ============================================================
// 항목 추가 다이얼로그
// ============================================================

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onSubmit: (
    type: SetListItemType,
    title: string,
    artist: string,
    duration: number,
    performers: string[],
    notes: string,
    transitionNote: string
  ) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  memberNames,
  onSubmit,
}: AddItemDialogProps) {
  const [type, setType] = useState<SetListItemType>("performance");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [durationStr, setDurationStr] = useState("3:00");
  const [performers, setPerformers] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [transitionNote, setTransitionNote] = useState("");

  const resetForm = () => {
    setType("performance");
    setTitle("");
    setArtist("");
    setDurationStr("3:00");
    setPerformers([]);
    setNotes("");
    setTransitionNote("");
  };

  const togglePerformer = (name: string) => {
    setPerformers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    const duration = parseDuration(durationStr);
    onSubmit(type, title.trim(), artist.trim(), duration, performers, notes.trim(), transitionNote.trim());
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            세트리스트 항목 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 유형 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">유형 *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as SetListItemType)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {typeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제목 *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: Dynamite"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 아티스트 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">아티스트 (선택)</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="예: BTS"
              className="h-7 text-xs"
            />
          </div>

          {/* 시간 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              시간 (MM:SS) *
            </Label>
            <Input
              value={durationStr}
              onChange={(e) => setDurationStr(e.target.value)}
              placeholder="예: 3:30"
              className="h-7 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              MM:SS 형식으로 입력 (예: 3:30 = 3분 30초)
            </p>
          </div>

          {/* 출연자 */}
          {memberNames.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">출연자 (선택)</Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {memberNames.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-1 cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={performers.includes(name)}
                      onCheckedChange={() => togglePerformer(name)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="text-xs">{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="특이사항, 의상, 소품 등"
              className="text-xs min-h-[48px] resize-none"
              rows={2}
            />
          </div>

          {/* 전환 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              전환 메모 (선택)
            </Label>
            <Input
              value={transitionNote}
              onChange={(e) => setTransitionNote(e.target.value)}
              placeholder="예: 조명 페이드아웃 후 다음 팀 준비"
              className="h-7 text-xs"
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface SetListCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function SetListCard({
  groupId,
  projectId,
  memberNames,
}: SetListCardProps) {
  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const {
    items,
    addItem,
    deleteItem,
    moveItem,
    totalItems,
    totalDuration,
    performanceCount,
    totalPerformers,
  } = useSetList(groupId, projectId);

  const handleAddItem = (
    type: SetListItemType,
    title: string,
    artist: string,
    duration: number,
    performers: string[],
    notes: string,
    transitionNote: string
  ) => {
    const ok = addItem(
      type,
      title,
      artist || undefined,
      duration,
      performers,
      notes || undefined,
      transitionNote || undefined
    );
    if (ok) {
      toast.success("항목이 추가되었습니다.");
    } else {
      toast.error("제목을 입력해주세요.");
    }
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("이 항목을 삭제하시겠습니까?")) {
      deleteItem(id);
      toast.success("항목이 삭제되었습니다.");
    }
  };

  // 누적 시간 계산 (order 순)
  const cumulativeDurations: number[] = [];
  let cumSum = 0;
  for (const item of items) {
    cumSum += item.duration;
    cumulativeDurations.push(cumSum);
  }

  return (
    <>
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        memberNames={memberNames}
        onSubmit={handleAddItem}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <ListOrdered className="h-4 w-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 세트리스트</span>
              {totalItems > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalItems}곡
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 요약 배지 */}
            {totalItems > 0 && (
              <>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex"
                >
                  <Clock className="h-2.5 w-2.5" />
                  {formatDuration(totalDuration)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex"
                >
                  <Music2 className="h-2.5 w-2.5" />
                  {performanceCount}
                </Badge>
                {totalPerformers > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 gap-0.5 hidden sm:flex"
                  >
                    <Users className="h-2.5 w-2.5" />
                    {totalPerformers}
                  </Badge>
                )}
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              항목 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg bg-card">
            {/* 통계 요약 (모바일에서도 표시) */}
            {totalItems > 0 && (
              <div className="flex items-center gap-4 px-3 py-2 border-b flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">총 곡수</span>
                  <span className="text-xs font-semibold">{totalItems}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">총 시간</span>
                  <span className="text-xs font-semibold">{formatDuration(totalDuration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground">공연</span>
                  <span className="text-xs font-semibold">{performanceCount}곡</span>
                </div>
                {totalPerformers > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">출연자</span>
                    <span className="text-xs font-semibold">{totalPerformers}명</span>
                  </div>
                )}
              </div>
            )}

            {/* 빈 상태 */}
            {totalItems === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">세트리스트가 비어있습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;항목 추가&rdquo; 버튼으로 공연 순서를 등록하세요.
                </p>
              </div>
            )}

            {/* 세트리스트 테이블 */}
            {totalItems > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr className="border-b text-[10px] text-muted-foreground">
                      <th className="text-center px-2 py-1.5 w-8 font-medium">#</th>
                      <th className="text-left px-2 py-1.5 w-20 font-medium">유형</th>
                      <th className="text-left px-2 py-1.5 font-medium">제목</th>
                      <th className="text-left px-2 py-1.5 w-24 font-medium">아티스트</th>
                      <th className="text-right px-2 py-1.5 w-16 font-medium">시간</th>
                      <th className="text-right px-2 py-1.5 w-16 font-medium">누적</th>
                      <th className="text-left px-2 py-1.5 font-medium">출연자</th>
                      <th className="text-left px-2 py-1.5 w-24 font-medium">전환</th>
                      <th className="w-16 px-2 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b last:border-b-0 transition-colors ${typeRowBgClass(item.type)}`}
                      >
                        {/* # */}
                        <td className="text-center px-2 py-1.5 text-muted-foreground font-mono text-[10px]">
                          {item.order}
                        </td>

                        {/* 유형 */}
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            <span className={typeIconColor(item.type)}>
                              <TypeIcon type={item.type} className="h-3 w-3" />
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {typeLabel(item.type)}
                            </span>
                          </div>
                        </td>

                        {/* 제목 + 메모 */}
                        <td className="px-2 py-1.5">
                          <div>
                            <span className="font-medium truncate block max-w-[160px]">
                              {item.title}
                            </span>
                            {item.notes && (
                              <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
                                {item.notes}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 아티스트 */}
                        <td className="px-2 py-1.5 text-muted-foreground truncate max-w-[96px]">
                          {item.artist ?? "-"}
                        </td>

                        {/* 시간 */}
                        <td className="px-2 py-1.5 text-right font-mono text-[11px]">
                          {formatDuration(item.duration)}
                        </td>

                        {/* 누적 시간 */}
                        <td className="px-2 py-1.5 text-right font-mono text-[11px] text-muted-foreground">
                          {formatDuration(cumulativeDurations[idx])}
                        </td>

                        {/* 출연자 칩 */}
                        <td className="px-2 py-1.5">
                          <div className="flex flex-wrap gap-0.5">
                            {item.performers.length === 0 ? (
                              <span className="text-[10px] text-muted-foreground">-</span>
                            ) : (
                              item.performers.map((p) => (
                                <span
                                  key={p}
                                  className="inline-block text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                                >
                                  {p}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* 전환 메모 */}
                        <td className="px-2 py-1.5">
                          {item.transitionNote ? (
                            <span
                              className="text-[10px] text-muted-foreground truncate block max-w-[96px]"
                              title={item.transitionNote}
                            >
                              {item.transitionNote}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">-</span>
                          )}
                        </td>

                        {/* 액션 */}
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => moveItem(item.id, "up")}
                              disabled={idx === 0}
                              title="위로 이동"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => moveItem(item.id, "down")}
                              disabled={idx === items.length - 1}
                              title="아래로 이동"
                            >
                              <ChevronDownIcon className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              title="삭제"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
