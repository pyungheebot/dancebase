"use client";

import { useState } from "react";
import {
  Moon,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sun,
  Clock,
  Star,
  TrendingUp,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useSleepTracker } from "@/hooks/use-sleep-tracker";
import type { SleepTrackerQuality } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

const QUALITY_LABELS: Record<SleepTrackerQuality, string> = {
  excellent: "최상",
  good: "좋음",
  fair: "보통",
  poor: "나쁨",
  terrible: "최악",
};

const QUALITY_COLORS: Record<SleepTrackerQuality, string> = {
  excellent: "bg-blue-100 text-blue-700",
  good: "bg-green-100 text-green-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
  terrible: "bg-red-100 text-red-700",
};

const QUALITY_BAR_COLORS: Record<SleepTrackerQuality, string> = {
  excellent: "bg-blue-400",
  good: "bg-green-400",
  fair: "bg-yellow-400",
  poor: "bg-orange-400",
  terrible: "bg-red-400",
};

function getDayLabel(dateStr: string): string {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(dateStr + "T00:00:00");
  return days[d.getDay()];
}

function getWeekDates(referenceDate: string): string[] {
  const d = new Date(referenceDate + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    return dt.toISOString().split("T")[0];
  });
}

interface AddFormState {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: SleepTrackerQuality;
  hadNap: boolean;
  napMinutes: string;
  notes: string;
}

const today = new Date().toISOString().split("T")[0];

const DEFAULT_FORM: AddFormState = {
  date: today,
  bedtime: "23:00",
  wakeTime: "07:00",
  quality: "good",
  hadNap: false,
  napMinutes: "",
  notes: "",
};

export function SleepTrackerCard({ memberId }: { memberId: string }) {
  const { entries, addEntry, deleteEntry, getEntriesByWeek, stats } =
    useSleepTracker(memberId);

  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddFormState>(DEFAULT_FORM);

  const weekDates = getWeekDates(today);
  const weekEntries = getEntriesByWeek(today);

  const weekMap: Record<string, number> = {};
  const weekQuality: Record<string, SleepTrackerQuality> = {};
  weekEntries.forEach((e) => {
    weekMap[e.date] = e.durationHours;
    weekQuality[e.date] = e.quality;
  });

  const maxDuration = Math.max(8, ...Object.values(weekMap));

  // 수면 질 분포
  const qualityDistribution: Record<SleepTrackerQuality, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    terrible: 0,
  };
  entries.forEach((e) => {
    qualityDistribution[e.quality]++;
  });

  function handleSubmit() {
    if (!form.date || !form.bedtime || !form.wakeTime) {
      toast.error("날짜, 취침 시간, 기상 시간을 모두 입력해주세요.");
      return;
    }
    const napMinutes =
      form.hadNap && form.napMinutes ? parseInt(form.napMinutes, 10) : undefined;
    if (form.hadNap && form.napMinutes && isNaN(napMinutes!)) {
      toast.error("낮잠 시간은 숫자로 입력해주세요.");
      return;
    }
    addEntry({
      date: form.date,
      bedtime: form.bedtime,
      wakeTime: form.wakeTime,
      quality: form.quality,
      hadNap: form.hadNap,
      napMinutes,
      notes: form.notes || undefined,
    });
    toast.success("수면 기록이 추가되었습니다.");
    setForm(DEFAULT_FORM);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    deleteEntry(id);
    toast.success("수면 기록이 삭제되었습니다.");
  }

  const recentEntries = entries.slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <button
          className="flex w-full items-center justify-between"
          onClick={() => setIsOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold">수면 추적</span>
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-0">
              {stats.totalEntries}건
            </Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* 통계 요약 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-indigo-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">평균 수면</p>
              <p className="text-sm font-bold text-indigo-600">
                {stats.averageDuration > 0
                  ? `${stats.averageDuration}시간`
                  : "-"}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">평균 수면질</p>
              <p className="text-sm font-bold text-purple-600">
                {stats.averageQualityScore > 0
                  ? `${stats.averageQualityScore}/5`
                  : "-"}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">이번 주 평균</p>
              <p className="text-sm font-bold text-blue-600">
                {stats.weeklyAvgDuration > 0
                  ? `${stats.weeklyAvgDuration}시간`
                  : "-"}
              </p>
            </div>
          </div>

          {/* 최적 수면일 */}
          {stats.bestSleepDay && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2">
              <Star className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-yellow-700">
                최적 수면일:{" "}
                <strong>
                  {formatMonthDay(stats.bestSleepDay)}(
                  {getDayLabel(stats.bestSleepDay)})
                </strong>
              </span>
            </div>
          )}

          {/* 주간 수면 차트 */}
          <div>
            <div className="mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                이번 주 수면 현황
              </span>
            </div>
            <div className="relative h-20">
              {/* 8시간 기준선 */}
              <div
                className="absolute inset-x-0 border-t border-dashed border-gray-300"
                style={{ bottom: `${(8 / maxDuration) * 100}%` }}
              >
                <span className="absolute right-0 -top-3 text-[9px] text-gray-400">
                  8h
                </span>
              </div>
              <div className="flex h-full items-end gap-1">
                {weekDates.map((date) => {
                  const dur = weekMap[date] ?? 0;
                  const quality = weekQuality[date];
                  const heightPct =
                    dur > 0 ? Math.min((dur / maxDuration) * 100, 100) : 0;
                  return (
                    <div
                      key={date}
                      className="flex flex-1 flex-col items-center gap-0.5"
                    >
                      <div className="relative w-full flex-1">
                        {dur > 0 && (
                          <div
                            className={`absolute bottom-0 w-full rounded-t ${
                              quality
                                ? QUALITY_BAR_COLORS[quality]
                                : "bg-gray-300"
                            }`}
                            style={{ height: `${heightPct}%` }}
                            title={`${dur}시간`}
                          />
                        )}
                        {dur === 0 && (
                          <div className="absolute bottom-0 w-full rounded-t bg-gray-100 h-1" />
                        )}
                      </div>
                      <span className="text-[9px] text-muted-foreground">
                        {getDayLabel(date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 수면 질 분포 */}
          {stats.totalEntries > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                수면 질 분포
              </p>
              <div className="flex flex-wrap gap-1">
                {(
                  Object.entries(qualityDistribution) as [
                    SleepTrackerQuality,
                    number,
                  ][]
                )
                  .filter(([, count]) => count > 0)
                  .map(([q, count]) => (
                    <span
                      key={q}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${QUALITY_COLORS[q]}`}
                    >
                      {QUALITY_LABELS[q]} {count}회
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* 최근 기록 */}
          {recentEntries.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                최근 기록
              </p>
              <div className="space-y-1">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium w-10">
                        {formatMonthDay(entry.date)}({getDayLabel(entry.date)})
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Moon className="h-2.5 w-2.5" />
                        {entry.bedtime}
                        <span className="mx-0.5">→</span>
                        <Sun className="h-2.5 w-2.5" />
                        {entry.wakeTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {entry.durationHours}h
                      </span>
                      {entry.hadNap && entry.napMinutes && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Coffee className="h-2.5 w-2.5" />
                          {entry.napMinutes}분
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`rounded-full px-1.5 py-0 text-[10px] font-medium ${QUALITY_COLORS[entry.quality]}`}
                      >
                        {QUALITY_LABELS[entry.quality]}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 기록 추가 폼 */}
          {showForm ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-3">
              <p className="text-xs font-semibold text-indigo-700">
                수면 기록 추가
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">날짜</Label>
                  <Input
                    type="date"
                    className="h-7 text-xs"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">수면 질</Label>
                  <Select
                    value={form.quality}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        quality: v as SleepTrackerQuality,
                      }))
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(QUALITY_LABELS) as [
                          SleepTrackerQuality,
                          string,
                        ][]
                      ).map(([v, label]) => (
                        <SelectItem key={v} value={v} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">취침 시간</Label>
                  <Input
                    type="time"
                    className="h-7 text-xs"
                    value={form.bedtime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bedtime: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">기상 시간</Label>
                  <Input
                    type="time"
                    className="h-7 text-xs"
                    value={form.wakeTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, wakeTime: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="hadNap"
                  checked={form.hadNap}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, hadNap: !!checked }))
                  }
                />
                <Label htmlFor="hadNap" className="text-xs cursor-pointer">
                  낮잠을 잤어요
                </Label>
                {form.hadNap && (
                  <div className="flex items-center gap-1 ml-2">
                    <Input
                      type="number"
                      placeholder="분"
                      className="h-6 w-16 text-xs"
                      value={form.napMinutes}
                      min={1}
                      max={240}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, napMinutes: e.target.value }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">분</span>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">메모 (선택)</Label>
                <Textarea
                  className="min-h-[48px] text-xs resize-none"
                  placeholder="수면에 대한 메모를 입력하세요..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowForm(false);
                    setForm(DEFAULT_FORM);
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleSubmit}
                >
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              수면 기록 추가
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
