"use client";

import { useState, useMemo } from "react";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  useLightingCue,
  parseTimestamp,
} from "@/hooks/use-lighting-cue";
import type {
  LightingCueEntry,
  LightingCueAction,
  LightingCueColor,
} from "@/types";

// ============================================
// 상수: 액션 메타데이터
// ============================================

const ACTION_META: Record<
  LightingCueAction,
  { label: string; badgeClass: string; rowBg: string }
> = {
  on: {
    label: "점등",
    badgeClass: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    rowBg: "bg-yellow-50/40",
  },
  off: {
    label: "소등",
    badgeClass: "bg-gray-200 text-gray-600 hover:bg-gray-200",
    rowBg: "bg-gray-50/60",
  },
  fade_in: {
    label: "페이드인",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    rowBg: "bg-blue-50/30",
  },
  fade_out: {
    label: "페이드아웃",
    badgeClass: "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
    rowBg: "bg-indigo-50/30",
  },
  color_change: {
    label: "색상 변경",
    badgeClass: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    rowBg: "bg-pink-50/30",
  },
  strobe: {
    label: "스트로브",
    badgeClass: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    rowBg: "bg-orange-50/30",
  },
  spotlight: {
    label: "스포트라이트",
    badgeClass: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    rowBg: "bg-amber-50/50",
  },
  blackout: {
    label: "블랙아웃",
    badgeClass: "bg-gray-800 text-gray-100 hover:bg-gray-800",
    rowBg: "bg-gray-200/60",
  },
};

// ============================================
// 상수: 색상 메타데이터
// ============================================

const COLOR_META: Record<
  LightingCueColor,
  { label: string; hex: string }
> = {
  white: { label: "흰색", hex: "#ffffff" },
  red: { label: "빨강", hex: "#ef4444" },
  blue: { label: "파랑", hex: "#3b82f6" },
  green: { label: "초록", hex: "#22c55e" },
  yellow: { label: "노랑", hex: "#eab308" },
  purple: { label: "보라", hex: "#a855f7" },
  pink: { label: "핑크", hex: "#ec4899" },
  warm: { label: "따뜻한 백색", hex: "#fbbf24" },
  cool: { label: "차가운 백색", hex: "#bfdbfe" },
};

// ============================================
// 유틸리티
// ============================================

function isValidTimestamp(value: string): boolean {
  if (!value.trim()) return false;
  return /^\d{1,2}:\d{2}$/.test(value.trim());
}

// ============================================
// 서브 컴포넌트: 색상 원형
// ============================================

function ColorDot({ color }: { color?: LightingCueColor }) {
  if (!color) return <span className="text-[10px] text-muted-foreground">-</span>;
  const meta = COLOR_META[color];
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
        style={{ backgroundColor: meta.hex }}
        title={meta.label}
      />
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        {meta.label}
      </span>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 강도 바
// ============================================

function IntensityBar({ intensity }: { intensity: number }) {
  const pct = Math.max(0, Math.min(100, intensity));
  return (
    <div className="flex items-center gap-1">
      <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: pct > 70 ? "#f59e0b" : pct > 30 ? "#6366f1" : "#94a3b8",
          }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground w-7 text-right">
        {pct}%
      </span>
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 큐 행
// ============================================

interface CueRowProps {
  cue: LightingCueEntry;
  onDelete: (id: string) => void;
}

function CueRow({ cue, onDelete }: CueRowProps) {
  const meta = ACTION_META[cue.action];
  return (
    <tr
      className={`border-b border-gray-100 group text-xs hover:brightness-95 transition-all ${meta.rowBg}`}
    >
      {/* # */}
      <td className="py-1.5 px-2 text-center font-mono text-[10px] text-muted-foreground w-8 flex-shrink-0">
        {String(cue.cueNumber).padStart(2, "0")}
      </td>
      {/* 시간 */}
      <td className="py-1.5 px-2 w-14">
        <span className="flex items-center gap-0.5 font-mono text-[11px]">
          <Clock className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
          {cue.timestamp}
        </span>
      </td>
      {/* 액션 */}
      <td className="py-1.5 px-2">
        <Badge className={`text-[10px] px-1.5 py-0 ${meta.badgeClass}`}>
          {meta.label}
        </Badge>
      </td>
      {/* 색상 */}
      <td className="py-1.5 px-2">
        <ColorDot color={cue.color} />
      </td>
      {/* 강도 */}
      <td className="py-1.5 px-2 w-24">
        <IntensityBar intensity={cue.intensity} />
      </td>
      {/* 구역 */}
      <td className="py-1.5 px-2 max-w-[80px]">
        <span className="text-[10px] truncate block">{cue.zone}</span>
      </td>
      {/* 메모 */}
      <td className="py-1.5 px-2 max-w-[100px]">
        <span className="text-[10px] text-muted-foreground truncate block">
          {cue.notes ?? "-"}
        </span>
      </td>
      {/* 삭제 */}
      <td className="py-1.5 px-2 w-8">
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          onClick={() => onDelete(cue.id)}
          title="큐 삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}

// ============================================
// 서브 컴포넌트: 타임라인 뷰
// ============================================

interface TimelineViewProps {
  cues: LightingCueEntry[];
  totalDuration: string;
}

function TimelineView({ cues, totalDuration }: TimelineViewProps) {
  const totalSec = parseTimestamp(totalDuration) || 1;

  if (cues.length === 0) {
    return (
      <div className="text-center py-2 text-[10px] text-muted-foreground">
        타임라인 데이터 없음
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {/* 타임라인 바 */}
      <div className="relative h-6 bg-gray-100 rounded-full overflow-visible mx-1">
        {cues.map((cue) => {
          const pct = (parseTimestamp(cue.timestamp) / totalSec) * 100;
          const meta = ACTION_META[cue.action];
          return (
            <div
              key={cue.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group"
              style={{ left: `${Math.min(pct, 98)}%` }}
              title={`Q${cue.cueNumber} ${cue.timestamp} - ${meta.label} (${cue.zone})`}
            >
              {/* 점 */}
              <div
                className={`w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-default
                  ${cue.action === "blackout" ? "bg-gray-700" :
                    cue.action === "spotlight" ? "bg-amber-400" :
                    cue.action === "strobe" ? "bg-orange-400" :
                    cue.action === "fade_in" ? "bg-blue-400" :
                    cue.action === "fade_out" ? "bg-indigo-400" :
                    cue.action === "color_change" && cue.color
                      ? ""
                      : "bg-yellow-300"
                  }`}
                style={
                  cue.action === "color_change" && cue.color
                    ? { backgroundColor: COLOR_META[cue.color].hex }
                    : undefined
                }
              />
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-gray-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                Q{cue.cueNumber} {cue.timestamp}
              </div>
            </div>
          );
        })}
        {/* 눈금: 시작/끝 */}
        <span className="absolute left-0 -bottom-4 text-[9px] text-muted-foreground">
          00:00
        </span>
        <span className="absolute right-0 -bottom-4 text-[9px] text-muted-foreground">
          {totalDuration}
        </span>
      </div>
      {/* 눈금 여백 */}
      <div className="h-4" />
    </div>
  );
}

// ============================================
// 서브 컴포넌트: 큐 추가 다이얼로그
// ============================================

const DEFAULT_FORM = {
  timestamp: "",
  action: "on" as LightingCueAction,
  color: "" as LightingCueColor | "",
  intensity: 80,
  zone: "",
  notes: "",
};

interface AddCueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (
    timestamp: string,
    action: LightingCueAction,
    color: LightingCueColor | undefined,
    intensity: number,
    zone: string,
    notes?: string
  ) => void;
}

function AddCueDialog({ open, onOpenChange, onAdd }: AddCueDialogProps) {
  const [form, setForm] = useState(DEFAULT_FORM);

  function handleClose() {
    setForm(DEFAULT_FORM);
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValidTimestamp(form.timestamp)) {
      toast.error('시간은 "MM:SS" 형식으로 입력해주세요. (예: 01:30)');
      return;
    }
    if (!form.zone.trim()) {
      toast.error("구역을 입력해주세요.");
      return;
    }

    onAdd(
      form.timestamp.trim(),
      form.action,
      form.color ? form.color : undefined,
      form.intensity,
      form.zone.trim(),
      form.notes.trim() || undefined
    );
    toast.success("조명 큐가 추가되었습니다.");
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            조명 큐 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 시간 + 구역 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">시간 (MM:SS) *</Label>
              <Input
                value={form.timestamp}
                onChange={(e) =>
                  setForm((f) => ({ ...f, timestamp: e.target.value }))
                }
                placeholder="예: 01:30"
                className="h-8 text-xs font-mono"
                maxLength={5}
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">구역 *</Label>
              <Input
                value={form.zone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zone: e.target.value }))
                }
                placeholder="예: 무대 전체"
                className="h-8 text-xs"
                maxLength={50}
              />
            </div>
          </div>

          {/* 액션 */}
          <div className="space-y-1">
            <Label className="text-xs">액션 *</Label>
            <Select
              value={form.action}
              onValueChange={(val) =>
                setForm((f) => ({ ...f, action: val as LightingCueAction }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(ACTION_META) as [
                    LightingCueAction,
                    { label: string; badgeClass: string; rowBg: string }
                  ][]
                ).map(([action, meta]) => (
                  <SelectItem key={action} value={action} className="text-xs">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 색상 */}
          <div className="space-y-1">
            <Label className="text-xs">색상</Label>
            <Select
              value={form.color}
              onValueChange={(val) =>
                setForm((f) => ({
                  ...f,
                  color: val === "_none" ? "" : (val as LightingCueColor),
                }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="색상 선택 (선택)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none" className="text-xs text-muted-foreground">
                  없음
                </SelectItem>
                {(
                  Object.entries(COLOR_META) as [
                    LightingCueColor,
                    { label: string; hex: string }
                  ][]
                ).map(([color, meta]) => (
                  <SelectItem key={color} value={color} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0"
                        style={{ backgroundColor: meta.hex }}
                      />
                      {meta.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 강도 슬라이더 */}
          <div className="space-y-1">
            <Label className="text-xs">
              강도{" "}
              <span className="text-yellow-600 font-medium">
                {form.intensity}%
              </span>
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.intensity}
              onChange={(e) =>
                setForm((f) => ({ ...f, intensity: Number(e.target.value) }))
              }
              className="w-full h-1.5 accent-yellow-500"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모</Label>
            <Input
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="특이사항 메모"
              className="h-8 text-xs"
              maxLength={200}
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

interface LightingCueCardProps {
  groupId: string;
  projectId: string;
}

export function LightingCueCard({ groupId, projectId }: LightingCueCardProps) {
  const {
    cues,
    totalCues,
    zones,
    totalDuration,
    addCue,
    deleteCue,
  } = useLightingCue(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>("__all__");
  const [showTimeline, setShowTimeline] = useState(false);

  const filteredCues = useMemo(() => {
    if (selectedZone === "__all__") return cues;
    return cues.filter((c) => c.zone === selectedZone);
  }, [cues, selectedZone]);

  function handleDelete(id: string) {
    deleteCue(id);
    toast.success("큐가 삭제되었습니다.");
  }

  return (
    <div className="border rounded-lg bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-sm font-medium">무대 조명 큐시트</span>
            {totalCues > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                {totalCues}개
              </Badge>
            )}
            {totalCues > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {totalDuration}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
              title="큐 추가"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">큐 추가</span>
            </Button>
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 펼쳐지는 내용 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t space-y-3">
            {totalCues === 0 ? (
              /* 빈 상태 */
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
                <Lightbulb className="h-7 w-7 opacity-30" />
                <p className="text-xs">아직 조명 큐가 없습니다.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs mt-1 gap-1"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  첫 큐 추가하기
                </Button>
              </div>
            ) : (
              <>
                {/* 필터 바 + 타임라인 토글 */}
                <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
                  {/* 구역 필터 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <button
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        selectedZone === "__all__"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                          : "bg-white text-muted-foreground border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedZone("__all__")}
                    >
                      전체
                    </button>
                    {zones.map((zone) => (
                      <button
                        key={zone}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          selectedZone === zone
                            ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                            : "bg-white text-muted-foreground border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedZone(zone)}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>

                  {/* 타임라인 토글 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px] px-2 gap-1"
                    onClick={() => setShowTimeline((v) => !v)}
                  >
                    {showTimeline ? "테이블 뷰" : "타임라인 뷰"}
                  </Button>
                </div>

                {/* 타임라인 뷰 */}
                {showTimeline ? (
                  <div className="rounded-lg border bg-gray-50/50 p-3">
                    <p className="text-[10px] text-muted-foreground mb-3">
                      큐 위치를 타임라인에서 확인합니다.
                    </p>
                    <TimelineView
                      cues={filteredCues}
                      totalDuration={totalDuration}
                    />
                  </div>
                ) : (
                  /* 테이블 뷰 */
                  <ScrollArea className="max-h-72">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/80">
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium w-8">
                            #
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium w-14">
                            시간
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium">
                            액션
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium">
                            색상
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium w-24">
                            강도
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium max-w-[80px]">
                            구역
                          </th>
                          <th className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium max-w-[100px]">
                            메모
                          </th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCues.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="py-6 text-center text-[11px] text-muted-foreground"
                            >
                              해당 구역의 큐가 없습니다.
                            </td>
                          </tr>
                        ) : (
                          filteredCues.map((cue) => (
                            <CueRow
                              key={cue.id}
                              cue={cue}
                              onDelete={handleDelete}
                            />
                          ))
                        )}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}

                {/* 통계 요약 */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">
                    총{" "}
                    <span className="font-medium text-foreground">
                      {filteredCues.length}
                    </span>
                    개 큐
                  </span>
                  {zones.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      구역{" "}
                      <span className="font-medium text-foreground">
                        {zones.length}
                      </span>
                      개
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    마지막 큐:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {totalDuration}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 큐 추가 다이얼로그 */}
      <AddCueDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={addCue}
      />
    </div>
  );
}
