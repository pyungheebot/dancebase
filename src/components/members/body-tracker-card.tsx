"use client";

import { useState, useCallback } from "react";
import {
  Scale,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { cn } from "@/lib/utils";
import { useBodyTracker } from "@/hooks/use-body-tracker";
import type { BodyTrackerEntry } from "@/types";
import { formatYearMonthDay, formatMonthDay } from "@/lib/date-utils";

// ============================================================
// 날짜 유틸
// ============================================================

function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// 체중 추이 라인 차트 (div 기반)
// ============================================================

type WeightChartProps = {
  data: Array<{ date: string; weight: number }>;
};

function WeightLineChart({ data }: WeightChartProps) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-muted-foreground text-center py-3">
        차트를 표시하려면 체중 기록이 2개 이상 필요합니다.
      </p>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const CHART_H = 64; // px
  const POINT_R = 3; // px (점 반지름)

  // SVG 폴리라인 포인트 계산
  const totalPoints = data.length;
  const points = data.map((d, i) => {
    const x = totalPoints === 1 ? 50 : (i / (totalPoints - 1)) * 100;
    const y =
      CHART_H -
      POINT_R -
      ((d.weight - minW) / range) * (CHART_H - POINT_R * 2);
    return { x, y, ...d };
  });

  const polylineStr = points
    .map((p) => `${p.x.toFixed(1)}%,${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="space-y-1">
      <div className="relative w-full" style={{ height: CHART_H + 20 }}>
        {/* SVG 선 레이어 */}
        <svg
          className="absolute inset-0 w-full overflow-visible"
          style={{ height: CHART_H }}
          preserveAspectRatio="none"
          viewBox={`0 0 100 ${CHART_H}`}
        >
          <polyline
            points={polylineStr}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* 점 + 레이블 레이어 */}
        <div className="absolute inset-0" style={{ height: CHART_H }}>
          {points.map((p, i) => {
            const isFirst = i === 0;
            const isLast = i === totalPoints - 1;
            const showLabel = isFirst || isLast || totalPoints <= 5;
            return (
              <div
                key={p.date}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: p.y - POINT_R,
                  transform: "translateX(-50%)",
                }}
              >
                <div
                  className={cn(
                    "rounded-full border-2 border-white",
                    isLast
                      ? "bg-primary w-2.5 h-2.5"
                      : "bg-primary/60 w-2 h-2"
                  )}
                  title={`${formatYearMonthDay(p.date)}: ${p.weight}kg`}
                />
                {showLabel && (
                  <span
                    className={cn(
                      "absolute text-[9px] whitespace-nowrap",
                      isLast
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    )}
                    style={{
                      top: POINT_R * 2 + 2,
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  >
                    {p.weight}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 날짜 축 */}
        <div
          className="absolute inset-x-0 flex justify-between px-0"
          style={{ top: CHART_H + 4 }}
        >
          {points.map((p, i) => {
            const isFirst = i === 0;
            const isLast = i === totalPoints - 1;
            if (!isFirst && !isLast && totalPoints > 5) return null;
            return (
              <span
                key={p.date}
                className="text-[9px] text-muted-foreground"
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {formatMonthDay(p.date)}
              </span>
            );
          })}
        </div>
      </div>

      {/* Y축 범위 */}
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">
          최소 {minW.toFixed(1)}kg
        </span>
        <span className="text-[9px] text-muted-foreground">
          최대 {maxW.toFixed(1)}kg
        </span>
      </div>
    </div>
  );
}

// ============================================================
// 변화량 뱃지
// ============================================================

function WeightChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;

  if (change === 0) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-gray-100 text-gray-600 border-gray-200">
        <Minus className="h-2.5 w-2.5" />
        변화 없음
      </Badge>
    );
  }

  if (change > 0) {
    return (
      <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-red-100 text-red-700 border-red-200">
        <TrendingUp className="h-2.5 w-2.5" />
        +{change}kg
      </Badge>
    );
  }

  return (
    <Badge className="text-[10px] px-1.5 py-0 gap-0.5 bg-blue-100 text-blue-700 border-blue-200">
      <TrendingDown className="h-2.5 w-2.5" />
      {change}kg
    </Badge>
  );
}

// ============================================================
// 기록 추가/수정 폼 타입
// ============================================================

type EntryForm = {
  date: string;
  weight: string;
  bodyFat: string;
  muscleMass: string;
  height: string;
  waist: string;
  notes: string;
};

function getDefaultForm(): EntryForm {
  return {
    date: getTodayStr(),
    weight: "",
    bodyFat: "",
    muscleMass: "",
    height: "",
    waist: "",
    notes: "",
  };
}

function entryToForm(entry: BodyTrackerEntry): EntryForm {
  return {
    date: entry.date,
    weight: entry.weight != null ? String(entry.weight) : "",
    bodyFat: entry.bodyFat != null ? String(entry.bodyFat) : "",
    muscleMass: entry.muscleMass != null ? String(entry.muscleMass) : "",
    height: entry.height != null ? String(entry.height) : "",
    waist: entry.waist != null ? String(entry.waist) : "",
    notes: entry.notes ?? "",
  };
}

// ============================================================
// 기록 목록 아이템
// ============================================================

type EntryItemProps = {
  entry: BodyTrackerEntry;
  onEdit: (entry: BodyTrackerEntry) => void;
  onDelete: (id: string) => void;
};

function EntryItem({ entry, onEdit, onDelete }: EntryItemProps) {
  const fields: Array<{ label: string; value: string; unit: string }> = [];
  if (entry.weight != null)
    fields.push({ label: "체중", value: String(entry.weight), unit: "kg" });
  if (entry.bodyFat != null)
    fields.push({ label: "체지방", value: String(entry.bodyFat), unit: "%" });
  if (entry.muscleMass != null)
    fields.push({
      label: "근육량",
      value: String(entry.muscleMass),
      unit: "kg",
    });
  if (entry.height != null)
    fields.push({ label: "키", value: String(entry.height), unit: "cm" });
  if (entry.waist != null)
    fields.push({
      label: "허리",
      value: String(entry.waist),
      unit: "cm",
    });

  return (
    <div className="rounded-lg border p-2.5 bg-card space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-800">
          {formatYearMonthDay(entry.date)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-2.5 w-2.5" />
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {fields.map((f) => (
            <Badge
              key={f.label}
              className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 border-slate-200"
            >
              {f.label} {f.value}
              {f.unit}
            </Badge>
          ))}
        </div>
      )}

      {entry.notes && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          {entry.notes}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

type BodyTrackerCardProps = {
  memberId: string;
};

export function BodyTrackerCard({ memberId }: BodyTrackerCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryForm>(getDefaultForm());

  const { entries, loading, stats, addEntry, updateEntry, deleteEntry } =
    useBodyTracker(memberId);

  // 체중 차트용 최근 10개 데이터
  const chartData = entries
    .filter((e) => e.weight != null)
    .slice(0, 10)
    .reverse()
    .map((e) => ({ date: e.date, weight: e.weight! }));

  // 다이얼로그 열기 (신규)
  const openAddDialog = useCallback(() => {
    setForm(getDefaultForm());
    setEditingId(null);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 열기 (수정)
  const openEditDialog = useCallback((entry: BodyTrackerEntry) => {
    setForm(entryToForm(entry));
    setEditingId(entry.id);
    setDialogOpen(true);
  }, []);

  // 다이얼로그 닫기
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingId(null);
  }, []);

  // 저장
  const handleSave = useCallback(() => {
    if (!form.date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }

    const hasAnyValue =
      form.weight !== "" ||
      form.bodyFat !== "" ||
      form.muscleMass !== "" ||
      form.height !== "" ||
      form.waist !== "";

    if (!hasAnyValue) {
      toast.error("체중, 체지방률 등 측정값을 하나 이상 입력해주세요.");
      return;
    }

    const toNum = (v: string): number | undefined =>
      v !== "" ? parseFloat(v) : undefined;

    const entryData = {
      date: form.date,
      weight: toNum(form.weight),
      bodyFat: toNum(form.bodyFat),
      muscleMass: toNum(form.muscleMass),
      height: toNum(form.height),
      waist: toNum(form.waist),
      notes: form.notes.trim() || undefined,
    };

    if (editingId) {
      const ok = updateEntry(editingId, entryData);
      if (ok) {
        toast.success("체형 기록이 수정되었습니다.");
        closeDialog();
      } else {
        toast.error(TOAST.UPDATE_ERROR);
      }
    } else {
      addEntry(entryData);
      toast.success("체형 기록이 저장되었습니다.");
      closeDialog();
    }
  }, [form, editingId, addEntry, updateEntry, closeDialog]);

  // 삭제
  const handleDelete = useCallback(
    (id: string) => {
      const ok = deleteEntry(id);
      if (ok) {
        toast.success("기록이 삭제되었습니다.");
      } else {
        toast.error(TOAST.DELETE_ERROR);
      }
    },
    [deleteEntry]
  );

  // 최근 기록 5개
  const recentEntries = entries.slice(0, 5);

  return (
    <>
      <Card>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-500" />
                  체중 / 체형 추적
                </CardTitle>
                <div className="flex items-center gap-2">
                  {stats.totalEntries > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>총 {stats.totalEntries}회</span>
                      {stats.latestWeight != null && (
                        <>
                          <span className="text-muted-foreground/40">|</span>
                          <span className="text-blue-600 font-medium">
                            {stats.latestWeight}kg
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  {open ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 space-y-4">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 최근 수치 요약 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-blue-50 p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">
                        {stats.latestWeight != null
                          ? `${stats.latestWeight}`
                          : "-"}
                      </p>
                      <p className="text-[10px] text-blue-500">체중 (kg)</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-2 text-center">
                      <p className="text-lg font-bold text-orange-600">
                        {entries.find((e) => e.bodyFat != null)?.bodyFat != null
                          ? `${entries.find((e) => e.bodyFat != null)!.bodyFat}`
                          : "-"}
                      </p>
                      <p className="text-[10px] text-orange-500">체지방 (%)</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2 text-center">
                      <p className="text-lg font-bold text-green-600">
                        {entries.find((e) => e.muscleMass != null)
                          ?.muscleMass != null
                          ? `${entries.find((e) => e.muscleMass != null)!.muscleMass}`
                          : "-"}
                      </p>
                      <p className="text-[10px] text-green-500">근육량 (kg)</p>
                    </div>
                  </div>

                  {/* 변화량 + 기록 추가 버튼 */}
                  <div className="flex items-center justify-between">
                    <WeightChangeBadge change={stats.weightChange} />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddDialog();
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      기록 추가
                    </Button>
                  </div>

                  {/* 체중 추이 차트 */}
                  {chartData.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        체중 추이 (최근 10회)
                      </p>
                      <WeightLineChart data={chartData} />
                    </div>
                  )}

                  {/* 최근 기록 목록 */}
                  {recentEntries.length === 0 ? (
                    <div className="text-center py-6 space-y-1">
                      <Scale className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        기록된 체형 데이터가 없습니다.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        상단 &apos;기록 추가&apos; 버튼으로 첫 기록을
                        등록하세요.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        최근 기록
                      </p>
                      {recentEntries.map((entry) => (
                        <EntryItem
                          key={entry.id}
                          entry={entry}
                          onEdit={openEditDialog}
                          onDelete={handleDelete}
                        />
                      ))}
                      {entries.length > 5 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          총 {entries.length}개 기록 중 최근 5개 표시
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 기록 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-500" />
              {editingId ? "체형 기록 수정" : "체형 기록 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* 날짜 */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                날짜
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="h-7 text-xs"
              />
            </div>

            {/* 체중 / 체지방 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  체중 (kg)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, weight: e.target.value }))
                  }
                  placeholder="예: 65.5"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  체지방률 (%)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={form.bodyFat}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bodyFat: e.target.value }))
                  }
                  placeholder="예: 18.5"
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* 근육량 / 키 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  근육량 (kg)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.muscleMass}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, muscleMass: e.target.value }))
                  }
                  placeholder="예: 32.0"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  키 (cm)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={form.height}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, height: e.target.value }))
                  }
                  placeholder="예: 170.0"
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* 허리둘레 */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                허리둘레 (cm)
              </Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={form.waist}
                onChange={(e) =>
                  setForm((f) => ({ ...f, waist: e.target.value }))
                }
                placeholder="예: 75.0"
                className="h-7 text-xs"
              />
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                메모 (선택)
              </Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="측정 환경, 특이사항 등을 입력하세요..."
                className="text-xs resize-none min-h-[56px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={closeDialog}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              {editingId ? "수정 완료" : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
