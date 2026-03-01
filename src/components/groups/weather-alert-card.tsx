"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { toast } from "sonner";
import {
  CloudSun,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  CheckCircle2,
  XCircle,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useWeatherAlert,
  WEATHER_CONDITION_LABELS,
  WEATHER_LEVEL_LABELS,
  WEATHER_LEVEL_COLORS,
} from "@/hooks/use-weather-alert";
import type {
  WeatherAlertCondition,
  WeatherAlertLevel,
  WeatherAlertEntry,
} from "@/types";

// ─── 날씨 조건별 아이콘 ───────────────────────────────────────

function WeatherIcon({
  condition,
  size = "sm",
}: {
  condition: WeatherAlertCondition;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "h-10 w-10" : "h-4 w-4";
  switch (condition) {
    case "sunny":
      return <Sun className={`${cls} text-yellow-500`} />;
    case "cloudy":
      return <Cloud className={`${cls} text-gray-400`} />;
    case "rainy":
      return <CloudRain className={`${cls} text-blue-400`} />;
    case "snowy":
      return <CloudSnow className={`${cls} text-blue-200`} />;
    case "windy":
      return <Wind className={`${cls} text-cyan-400`} />;
    case "hot":
      return <Thermometer className={`${cls} text-red-500`} />;
    case "cold":
      return <Thermometer className={`${cls} text-blue-600`} />;
    case "humid":
      return <Droplets className={`${cls} text-teal-400`} />;
    default:
      return <CloudSun className={`${cls} text-gray-400`} />;
  }
}

// ─── 날짜 포맷 ────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${y}.${m}.${d}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 알림 추가 다이얼로그 ─────────────────────────────────────

interface AddAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: ReturnType<typeof useWeatherAlert>["addAlert"];
}

const INITIAL_FORM = {
  date: todayStr(),
  condition: "sunny" as WeatherAlertCondition,
  temperature: "",
  humidity: "",
  windSpeed: "",
  alertLevel: "safe" as WeatherAlertLevel,
  recommendation: "",
  isOutdoorSafe: true,
  notes: "",
};

function AddAlertDialog({ open, onClose, onAdd }: AddAlertDialogProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const { pending: loading, execute } = useAsyncAction();

  async function handleSubmit() {
    if (!form.date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!form.recommendation.trim()) {
      toast.error("권장사항을 입력해주세요.");
      return;
    }

    await execute(async () => {
      const ok = onAdd({
        date: form.date,
        condition: form.condition,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        humidity: form.humidity ? Number(form.humidity) : undefined,
        windSpeed: form.windSpeed ? Number(form.windSpeed) : undefined,
        alertLevel: form.alertLevel,
        recommendation: form.recommendation.trim(),
        isOutdoorSafe: form.isOutdoorSafe,
        notes: form.notes.trim() || undefined,
        createdBy: "나",
      });

      if (ok) {
        toast.success("날씨 알림이 추가되었습니다.");
        setForm(INITIAL_FORM);
        onClose();
      } else {
        toast.error("날씨 알림 추가에 실패했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <CloudSun className="h-4 w-4 text-blue-500" />
            날씨 알림 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>

          {/* 날씨 조건 */}
          <div className="space-y-1">
            <Label className="text-xs">날씨 조건</Label>
            <Select
              value={form.condition}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, condition: v as WeatherAlertCondition }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WEATHER_CONDITION_LABELS) as WeatherAlertCondition[]).map(
                  (cond) => (
                    <SelectItem key={cond} value={cond} className="text-xs">
                      {WEATHER_CONDITION_LABELS[cond]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 온도 / 습도 / 풍속 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">온도 (°C)</Label>
              <Input
                type="number"
                placeholder="예: 25"
                value={form.temperature}
                onChange={(e) =>
                  setForm((f) => ({ ...f, temperature: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">습도 (%)</Label>
              <Input
                type="number"
                placeholder="예: 60"
                value={form.humidity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, humidity: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">풍속 (m/s)</Label>
              <Input
                type="number"
                placeholder="예: 5"
                value={form.windSpeed}
                onChange={(e) =>
                  setForm((f) => ({ ...f, windSpeed: e.target.value }))
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* 안전 수준 */}
          <div className="space-y-1">
            <Label className="text-xs">안전 수준</Label>
            <Select
              value={form.alertLevel}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, alertLevel: v as WeatherAlertLevel }))
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WEATHER_LEVEL_LABELS) as WeatherAlertLevel[]).map(
                  (level) => (
                    <SelectItem key={level} value={level} className="text-xs">
                      {WEATHER_LEVEL_LABELS[level]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 야외 연습 가능 여부 */}
          <div className="space-y-1">
            <Label className="text-xs">야외 연습 가능 여부</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={form.isOutdoorSafe ? "default" : "outline"}
                className="h-8 flex-1 text-xs"
                onClick={() => setForm((f) => ({ ...f, isOutdoorSafe: true }))}
              >
                가능
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!form.isOutdoorSafe ? "destructive" : "outline"}
                className="h-8 flex-1 text-xs"
                onClick={() => setForm((f) => ({ ...f, isOutdoorSafe: false }))}
              >
                불가
              </Button>
            </div>
          </div>

          {/* 권장사항 */}
          <div className="space-y-1">
            <Label className="text-xs">권장사항</Label>
            <Textarea
              placeholder="연습 권장사항을 입력하세요"
              value={form.recommendation}
              onChange={(e) =>
                setForm((f) => ({ ...f, recommendation: e.target.value }))
              }
              className="min-h-[60px] resize-none text-xs"
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">메모 (선택)</Label>
            <Input
              placeholder="추가 메모"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={loading}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 오늘 날씨 카드 ───────────────────────────────────────────

function TodayWeatherCard({
  entry,
  onDelete,
}: {
  entry: WeatherAlertEntry;
  onDelete: (id: string) => void;
}) {
  function handleDelete() {
    onDelete(entry.id);
    toast.success("날씨 알림이 삭제되었습니다.");
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      {/* 헤더: 날씨 아이콘 + 조건명 + 삭제 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <WeatherIcon condition={entry.condition} size="lg" />
          <div>
            <p className="text-sm font-semibold">
              {WEATHER_CONDITION_LABELS[entry.condition]}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {formatDate(entry.date)} 오늘
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge className={`text-[10px] px-1.5 py-0 ${WEATHER_LEVEL_COLORS[entry.alertLevel]}`}>
            {WEATHER_LEVEL_LABELS[entry.alertLevel]}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 수치 정보 */}
      <div className="flex gap-4">
        {entry.temperature !== undefined && (
          <div className="flex items-center gap-1">
            <Thermometer className="h-3 w-3 text-red-400" />
            <span className="text-xs font-medium">{entry.temperature}°C</span>
          </div>
        )}
        {entry.humidity !== undefined && (
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3 text-blue-400" />
            <span className="text-xs font-medium">{entry.humidity}%</span>
          </div>
        )}
        {entry.windSpeed !== undefined && (
          <div className="flex items-center gap-1">
            <Wind className="h-3 w-3 text-cyan-400" />
            <span className="text-xs font-medium">{entry.windSpeed}m/s</span>
          </div>
        )}
      </div>

      <Separator />

      {/* 권장사항 */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium">권장사항</p>
        <p className="text-xs leading-relaxed">{entry.recommendation}</p>
      </div>

      {/* 야외 연습 가능 여부 */}
      <div className="flex items-center gap-2 rounded-md border p-2">
        <span className="text-xs text-muted-foreground">야외 연습</span>
        {entry.isOutdoorSafe ? (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm font-bold text-green-600">가능</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-bold text-red-600">불가</span>
          </div>
        )}
      </div>

      {/* 메모 */}
      {entry.notes && (
        <p className="text-[10px] text-muted-foreground">{entry.notes}</p>
      )}
    </div>
  );
}

// ─── 최근 날씨 이력 행 ────────────────────────────────────────

function HistoryRow({
  entry,
  onDelete,
}: {
  entry: WeatherAlertEntry;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <WeatherIcon condition={entry.condition} size="sm" />
        <span className="text-xs text-muted-foreground w-20 shrink-0">
          {formatDate(entry.date)}
        </span>
        <span className="text-xs truncate">{WEATHER_CONDITION_LABELS[entry.condition]}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Badge
          className={`text-[10px] px-1.5 py-0 ${WEATHER_LEVEL_COLORS[entry.alertLevel]}`}
        >
          {WEATHER_LEVEL_LABELS[entry.alertLevel]}
        </Badge>
        {entry.isOutdoorSafe ? (
          <CheckCircle2 className="h-3 w-3 text-green-500" />
        ) : (
          <XCircle className="h-3 w-3 text-red-400" />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => {
            onDelete(entry.id);
            toast.success("날씨 알림이 삭제되었습니다.");
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface WeatherAlertCardProps {
  groupId: string;
}

export function WeatherAlertCard({ groupId }: WeatherAlertCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { addAlert, deleteAlert, getTodayAlert, getRecentAlerts, stats } =
    useWeatherAlert(groupId);

  const todayAlert = getTodayAlert();
  const recentAlerts = getRecentAlerts(7);
  const historyAlerts = recentAlerts.filter(
    (e) => e.date !== new Date().toISOString().slice(0, 10)
  );

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="rounded-lg border bg-card shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-semibold">연습 날씨 알림</span>
                {todayAlert && (
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${WEATHER_LEVEL_COLORS[todayAlert.alertLevel]}`}
                  >
                    오늘: {WEATHER_LEVEL_LABELS[todayAlert.alertLevel]}
                  </Badge>
                )}
                {!todayAlert && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500">
                    오늘 미등록
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                  추가
                </Button>
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3">
              <Separator />

              {/* 통계 요약 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-muted/40 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">총 등록</p>
                  <p className="text-sm font-bold">{stats.totalAlerts}일</p>
                </div>
                <div className="rounded-md bg-green-50 p-2 text-center">
                  <p className="text-[10px] text-green-600">안전</p>
                  <p className="text-sm font-bold text-green-700">{stats.safeDays}일</p>
                </div>
                <div className="rounded-md bg-red-50 p-2 text-center">
                  <p className="text-[10px] text-red-500">위험/경고</p>
                  <p className="text-sm font-bold text-red-600">{stats.dangerDays}일</p>
                </div>
              </div>

              {/* 오늘 날씨 */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  오늘 날씨
                </p>
                {todayAlert ? (
                  <TodayWeatherCard entry={todayAlert} onDelete={deleteAlert} />
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <AlertTriangle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      오늘 날씨 정보가 없습니다.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs gap-1"
                      onClick={() => setDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                      날씨 등록
                    </Button>
                  </div>
                )}
              </div>

              {/* 최근 7일 이력 */}
              {historyAlerts.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    최근 7일 날씨 이력
                  </p>
                  <div className="rounded-md border divide-y">
                    {historyAlerts.map((entry) => (
                      <div key={entry.id} className="px-2">
                        <HistoryRow entry={entry} onDelete={deleteAlert} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {recentAlerts.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  등록된 날씨 알림이 없습니다.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <AddAlertDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdd={addAlert}
      />
    </>
  );
}
