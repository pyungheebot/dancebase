"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  CalendarDays,
  Thermometer,
  Droplets,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  MapPin,
  Umbrella,
  Tent,
  ClipboardList,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStageWeather, calcSafety } from "@/hooks/use-stage-weather";
import type {
  StageWeatherCondition,
  StageWeatherSafety,
} from "@/types";

// ─── 상수 & 헬퍼 ─────────────────────────────────────────────

const CONDITION_LABELS: Record<StageWeatherCondition, string> = {
  sunny: "맑음",
  cloudy: "흐림",
  rainy: "비",
  snowy: "눈",
  windy: "바람",
};

const CONDITION_COLORS: Record<StageWeatherCondition, string> = {
  sunny: "text-yellow-500",
  cloudy: "text-gray-500",
  rainy: "text-blue-500",
  snowy: "text-cyan-400",
  windy: "text-teal-500",
};

function WeatherIcon({
  condition,
  className,
}: {
  condition: StageWeatherCondition;
  className?: string;
}) {
  const cls = className ?? "h-4 w-4";
  switch (condition) {
    case "sunny":  return <Sun className={cls} />;
    case "cloudy": return <Cloud className={cls} />;
    case "rainy":  return <CloudRain className={cls} />;
    case "snowy":  return <CloudSnow className={cls} />;
    case "windy":  return <Wind className={cls} />;
  }
}

const SAFETY_CONFIG: Record<
  StageWeatherSafety,
  { label: string; color: string; badgeClass: string; Icon: typeof ShieldCheck }
> = {
  safe: {
    label: "안전",
    color: "text-green-600",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    Icon: ShieldCheck,
  },
  caution: {
    label: "주의",
    color: "text-yellow-600",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Icon: ShieldAlert,
  },
  danger: {
    label: "위험",
    color: "text-red-600",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    Icon: ShieldX,
  },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDday(days: number): string {
  if (days === 0) return "D-DAY";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

// ─── 예보 추가 폼 ─────────────────────────────────────────────

interface AddForecastFormProps {
  onAdd: (payload: {
    date: string;
    condition: StageWeatherCondition;
    temperature: number;
    humidity: number;
    windNote: string;
  }) => void;
  onCancel: () => void;
}

function AddForecastForm({ onAdd, onCancel }: AddForecastFormProps) {
  const [date, setDate] = useState("");
  const [condition, setCondition] = useState<StageWeatherCondition>("sunny");
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [windNote, setWindNote] = useState("");

  function handleSubmit() {
    if (!date) {
      toast.error("공연 날짜를 입력해주세요.");
      return;
    }
    const temp = Number(temperature);
    const hum = Number(humidity);
    if (isNaN(temp)) {
      toast.error("기온을 숫자로 입력해주세요.");
      return;
    }
    if (isNaN(hum) || hum < 0 || hum > 100) {
      toast.error("습도는 0~100 사이의 숫자로 입력해주세요.");
      return;
    }
    onAdd({ date, condition, temperature: temp, humidity: hum, windNote });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">공연 날짜</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">예상 날씨</Label>
          <Select
            value={condition}
            onValueChange={(v) => setCondition(v as StageWeatherCondition)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONDITION_LABELS) as StageWeatherCondition[]).map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {CONDITION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">기온 (°C)</Label>
          <Input
            type="number"
            placeholder="예: 25"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">습도 (%)</Label>
          <Input
            type="number"
            placeholder="예: 60"
            value={humidity}
            onChange={(e) => setHumidity(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">풍속 메모</Label>
        <Input
          placeholder="예: 초속 3m, 약한 바람"
          value={windNote}
          onChange={(e) => setWindNote(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
          추가
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 대응 플랜 추가 폼 ────────────────────────────────────────

interface AddPlanFormProps {
  onAdd: (payload: {
    condition: StageWeatherCondition;
    action: string;
    equipment: string[];
  }) => void;
  onCancel: () => void;
}

function AddPlanForm({ onAdd, onCancel }: AddPlanFormProps) {
  const [condition, setCondition] = useState<StageWeatherCondition>("rainy");
  const [action, setAction] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");

  function handleSubmit() {
    if (!action.trim()) {
      toast.error("대응 내용을 입력해주세요.");
      return;
    }
    const equipment = equipmentInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onAdd({ condition, action: action.trim(), equipment });
  }

  return (
    <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">날씨 조건</Label>
          <Select
            value={condition}
            onValueChange={(v) => setCondition(v as StageWeatherCondition)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CONDITION_LABELS) as StageWeatherCondition[]).map((c) => (
                <SelectItem key={c} value={c} className="text-xs">
                  {CONDITION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">필요 장비 (쉼표 구분)</Label>
          <Input
            placeholder="예: 우산, 방수포"
            value={equipmentInput}
            onChange={(e) => setEquipmentInput(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">대응 내용</Label>
        <Input
          placeholder="예: 음향 장비 우선 대피 후 공연 30분 연기"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-7 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSubmit}>
          추가
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={onCancel}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export function StageWeatherCard({ projectId }: { projectId: string }) {
  const {
    data,
    addForecast,
    removeForecast,
    toggleCheckItem,
    addCheckItem,
    removeCheckItem,
    addPlan,
    removePlan,
    updateRainPlan,
  } = useStageWeather(projectId);

  const [showAddForecast, setShowAddForecast] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [openForecastIds, setOpenForecastIds] = useState<Set<string>>(new Set());
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [forecastOpen, setForecastOpen] = useState(true);
  const [planOpen, setPlanOpen] = useState(true);
  const [rainOpen, setRainOpen] = useState(true);

  function toggleForecast(id: string) {
    setOpenForecastIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddForecast(payload: Parameters<typeof addForecast>[0]) {
    addForecast(payload);
    setShowAddForecast(false);
    toast.success("날씨 예보가 추가되었습니다.");
  }

  function handleRemoveForecast(id: string) {
    removeForecast(id);
    toast.success("예보가 삭제되었습니다.");
  }

  function handleAddCheckItem(forecastId: string) {
    const label = (newItemInputs[forecastId] ?? "").trim();
    if (!label) {
      toast.error("체크리스트 항목을 입력해주세요.");
      return;
    }
    addCheckItem(forecastId, label);
    setNewItemInputs((prev) => ({ ...prev, [forecastId]: "" }));
    toast.success("항목이 추가되었습니다.");
  }

  function handleAddPlan(payload: Parameters<typeof addPlan>[0]) {
    addPlan(payload);
    setShowAddPlan(false);
    toast.success("대응 플랜이 추가되었습니다.");
  }

  function handleRemovePlan(id: string) {
    removePlan(id);
    toast.success("플랜이 삭제되었습니다.");
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sun className="h-4 w-4 text-yellow-500" />
          야외 공연 날씨 관리
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── 공연일 날씨 체크리스트 ── */}
        <Collapsible open={forecastOpen} onOpenChange={setForecastOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                공연일 날씨 체크리스트
              </p>
              {forecastOpen ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-2">
            {data.forecasts.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                등록된 공연일 날씨 정보가 없습니다.
              </p>
            )}

            {data.forecasts.map((forecast) => {
              const days = daysUntil(forecast.date);
              const safety = SAFETY_CONFIG[forecast.safety];
              const SafetyIcon = safety.Icon;
              const isOpen = openForecastIds.has(forecast.id);
              const doneCount = forecast.checklist.filter((c) => c.done).length;
              const total = forecast.checklist.length;
              const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

              return (
                <div
                  key={forecast.id}
                  className="rounded-lg border bg-card"
                >
                  {/* 예보 헤더 */}
                  <div
                    className="flex items-center justify-between px-3 py-2 cursor-pointer"
                    onClick={() => toggleForecast(forecast.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`${CONDITION_COLORS[forecast.condition]} shrink-0`}
                      >
                        <WeatherIcon condition={forecast.condition} className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {forecast.date}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {CONDITION_LABELS[forecast.condition]}
                          {" · "}
                          <Thermometer className="h-3 w-3 inline" />
                          {forecast.temperature}°C
                          {" · "}
                          <Droplets className="h-3 w-3 inline" />
                          {forecast.humidity}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* D-day 배지 */}
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-mono"
                      >
                        {formatDday(days)}
                      </Badge>
                      {/* 안전 판정 배지 */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${safety.badgeClass}`}
                      >
                        <SafetyIcon className="h-3 w-3 mr-0.5 inline" />
                        {safety.label}
                      </Badge>
                      {isOpen ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* 체크리스트 진행률 바 */}
                  <div className="px-3 pb-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">
                        체크리스트 {doneCount}/{total}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>

                  {/* 펼침 영역 */}
                  {isOpen && (
                    <div className="px-3 pb-3 space-y-3 border-t mt-1 pt-2">
                      {/* 풍속 메모 */}
                      {forecast.windNote && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          {forecast.windNote}
                        </p>
                      )}

                      {/* 체크리스트 */}
                      <div className="space-y-1">
                        {forecast.checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 group"
                          >
                            <button
                              onClick={() =>
                                toggleCheckItem(forecast.id, item.id)
                              }
                              className="shrink-0"
                            >
                              {item.done ? (
                                <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Square className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </button>
                            <span
                              className={`text-xs flex-1 ${
                                item.done
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {item.label}
                            </span>
                            <button
                              onClick={() =>
                                removeCheckItem(forecast.id, item.id)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* 항목 추가 */}
                      <div className="flex gap-1">
                        <Input
                          placeholder="체크 항목 추가..."
                          value={newItemInputs[forecast.id] ?? ""}
                          onChange={(e) =>
                            setNewItemInputs((prev) => ({
                              ...prev,
                              [forecast.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleAddCheckItem(forecast.id);
                          }}
                          className="h-6 text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => handleAddCheckItem(forecast.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* 예보 삭제 */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs text-destructive hover:text-destructive w-full"
                        onClick={() => handleRemoveForecast(forecast.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        예보 삭제
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 예보 추가 */}
            {showAddForecast ? (
              <AddForecastForm
                onAdd={handleAddForecast}
                onCancel={() => setShowAddForecast(false)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={() => setShowAddForecast(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                공연일 날씨 추가
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── 날씨별 대응 플랜 ── */}
        <Collapsible open={planOpen} onOpenChange={setPlanOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <ClipboardList className="h-3 w-3" />
                날씨별 대응 플랜
              </p>
              {planOpen ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 mt-2">
            {data.plans.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                등록된 대응 플랜이 없습니다.
              </p>
            )}

            {data.plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border px-3 py-2 flex gap-3"
              >
                <span className={`${CONDITION_COLORS[plan.condition]} shrink-0 mt-0.5`}>
                  <WeatherIcon condition={plan.condition} className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {CONDITION_LABELS[plan.condition]}
                    </Badge>
                  </div>
                  <p className="text-xs">{plan.action}</p>
                  {plan.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.equipment.map((eq, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0 rounded bg-muted text-muted-foreground"
                        >
                          {eq}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemovePlan(plan.id)}
                  className="shrink-0 self-start mt-0.5"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ))}

            {/* 플랜 추가 */}
            {showAddPlan ? (
              <AddPlanForm
                onAdd={handleAddPlan}
                onCancel={() => setShowAddPlan(false)}
              />
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={() => setShowAddPlan(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                대응 플랜 추가
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* ── 우천 시 대체 계획 ── */}
        <Collapsible open={rainOpen} onOpenChange={setRainOpen}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                우천 시 대체 계획
              </p>
              {rainOpen ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-2">
            {/* 장소 변경 여부 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1 cursor-pointer">
                <MapPin className="h-3 w-3" />
                장소 변경
              </Label>
              <Switch
                checked={data.rainPlan.venueChange}
                onCheckedChange={(v) => {
                  updateRainPlan({ venueChange: v });
                  toast.success(v ? "장소 변경 계획이 설정되었습니다." : "장소 변경 계획이 해제되었습니다.");
                }}
              />
            </div>

            {/* 대체 장소 입력 */}
            {data.rainPlan.venueChange && (
              <div className="space-y-1">
                <Label className="text-xs">대체 장소</Label>
                <Input
                  placeholder="예: OO 실내 체육관"
                  value={data.rainPlan.alternativeVenue}
                  onChange={(e) =>
                    updateRainPlan({ alternativeVenue: e.target.value })
                  }
                  className="h-7 text-xs"
                />
              </div>
            )}

            {/* 우비 준비 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1 cursor-pointer">
                <Umbrella className="h-3 w-3" />
                우비 준비 완료
              </Label>
              <Switch
                checked={data.rainPlan.raincoatReady}
                onCheckedChange={(v) => {
                  updateRainPlan({ raincoatReady: v });
                  toast.success(v ? "우비 준비 완료로 표시했습니다." : "우비 준비 미완료로 변경했습니다.");
                }}
              />
            </div>

            {/* 텐트 준비 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1 cursor-pointer">
                <Tent className="h-3 w-3" />
                텐트 준비 완료
              </Label>
              <Switch
                checked={data.rainPlan.tentReady}
                onCheckedChange={(v) => {
                  updateRainPlan({ tentReady: v });
                  toast.success(v ? "텐트 준비 완료로 표시했습니다." : "텐트 준비 미완료로 변경했습니다.");
                }}
              />
            </div>

            {/* 준비 현황 요약 */}
            <div className="rounded-lg bg-muted/40 px-3 py-2">
              <p className="text-[10px] text-muted-foreground font-medium mb-1">준비 현황</p>
              <div className="flex gap-3">
                <span className="text-[10px] flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  대체 장소:{" "}
                  <span
                    className={
                      data.rainPlan.venueChange && data.rainPlan.alternativeVenue
                        ? "text-green-600 font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {data.rainPlan.venueChange && data.rainPlan.alternativeVenue
                      ? data.rainPlan.alternativeVenue
                      : "미설정"}
                  </span>
                </span>
              </div>
              <div className="flex gap-3 mt-1">
                <span
                  className={`text-[10px] flex items-center gap-1 ${
                    data.rainPlan.raincoatReady ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <Umbrella className="h-3 w-3" />
                  우비 {data.rainPlan.raincoatReady ? "준비됨" : "미준비"}
                </span>
                <span
                  className={`text-[10px] flex items-center gap-1 ${
                    data.rainPlan.tentReady ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  <Tent className="h-3 w-3" />
                  텐트 {data.rainPlan.tentReady ? "준비됨" : "미준비"}
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
