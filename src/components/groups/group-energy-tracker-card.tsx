"use client";

import { useState } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import { ChevronDown, ChevronUp, Zap, Trash2, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGroupEnergyTracker,
  type WeeklyTrend,
} from "@/hooks/use-group-energy-tracker";
import type { EnergyDimension } from "@/types";

// -------------------------------------------------------
// 상수 및 헬퍼
// -------------------------------------------------------

const DIMENSIONS: {
  key: EnergyDimension;
  label: string;
  color: string;
  trackColor: string;
  badgeClass: string;
}[] = [
  {
    key: "morale",
    label: "사기",
    color: "#3b82f6",
    trackColor: "#dbeafe",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  {
    key: "motivation",
    label: "동기부여",
    color: "#22c55e",
    trackColor: "#dcfce7",
    badgeClass: "bg-green-100 text-green-700",
  },
  {
    key: "fatigue",
    label: "피로도",
    color: "#ef4444",
    trackColor: "#fee2e2",
    badgeClass: "bg-red-100 text-red-700",
  },
];

function scoreLabel(score: number, dim: EnergyDimension): string {
  if (dim === "fatigue") {
    if (score >= 80) return "매우 높음";
    if (score >= 60) return "높음";
    if (score >= 40) return "보통";
    if (score >= 20) return "낮음";
    return "매우 낮음";
  }
  if (score >= 80) return "매우 좋음";
  if (score >= 60) return "좋음";
  if (score >= 40) return "보통";
  if (score >= 20) return "낮음";
  return "매우 낮음";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// -------------------------------------------------------
// 서브 컴포넌트: 게이지 바
// -------------------------------------------------------

function EnergyGaugeBar({
  label,
  score,
  color,
  trackColor,
  badgeClass,
  dim,
}: {
  label: string;
  score: number;
  color: string;
  trackColor: string;
  badgeClass: string;
  dim: EnergyDimension;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold" style={{ color }}>
            {score}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 ${badgeClass}`}>
            {scoreLabel(score, dim)}
          </Badge>
        </div>
      </div>
      <div
        className="relative h-2.5 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: trackColor }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 서브 컴포넌트: 주간 트렌드 바 차트
// -------------------------------------------------------

function WeeklyBarChart({ trends }: { trends: WeeklyTrend[] }) {
  if (trends.every((t) => t.count === 0)) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">
        최근 4주 데이터가 없습니다
      </p>
    );
  }

  const maxVal = 100;

  return (
    <div className="space-y-3">
      {DIMENSIONS.map((dim) => (
        <div key={dim.key} className="space-y-1">
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: dim.color }}
            />
            <span className="text-[11px] text-gray-500">{dim.label}</span>
          </div>
          <div className="flex items-end gap-1.5 h-12">
            {trends.map((week) => {
              const val = week[dim.key];
              const heightPct = week.count === 0 ? 0 : (val / maxVal) * 100;
              return (
                <div
                  key={week.weekLabel}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div className="w-full flex items-end h-10">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, week.count === 0 ? 0 : 4)}%`,
                        backgroundColor:
                          week.count === 0 ? "#e5e7eb" : dim.color,
                        opacity: week.count === 0 ? 0.5 : 1,
                      }}
                      title={
                        week.count === 0
                          ? "기록 없음"
                          : `${dim.label}: ${val} (${week.weekLabel}, ${week.count}건)`
                      }
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 leading-none">
                    {week.weekLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-[10px] text-gray-400 text-right">
        * W4 = 이번 주, 0-100 기준
      </div>
    </div>
  );
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------

interface GroupEnergyTrackerCardProps {
  groupId: string;
  currentUserId?: string;
}

export function GroupEnergyTrackerCard({
  groupId,
  currentUserId = "익명",
}: GroupEnergyTrackerCardProps) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // 폼 상태
  const [formDate, setFormDate] = useState(todayStr());
  const [formScores, setFormScores] = useState<Record<EnergyDimension, number>>({
    morale: 70,
    motivation: 70,
    fatigue: 30,
  });
  const [formNote, setFormNote] = useState("");
  const { pending: submitting, execute } = useAsyncAction();

  const { currentEnergy, weeklyTrends, recent30, addRecord, deleteRecord, loading } =
    useGroupEnergyTracker(groupId);

  function handleScoreChange(dim: EnergyDimension, val: number[]) {
    setFormScores((prev) => ({ ...prev, [dim]: val[0] }));
  }

  async function handleSubmit() {
    if (!formDate) return;
    await execute(async () => {
      addRecord({
        date: formDate,
        recordedBy: currentUserId,
        scores: formScores,
        note: formNote.trim(),
      });
      // 폼 초기화
      setFormDate(todayStr());
      setFormScores({ morale: 70, motivation: 70, fatigue: 30 });
      setFormNote("");
      setFormOpen(false);
    });
  }

  // 최근 10개 기록
  const recentList = [...recent30]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <Card className="border border-gray-200">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-800">
                  그룹 에너지 트래커
                </span>
                {recent30.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700">
                    최근 30일 {recent30.length}건
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-5">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
            ) : (
              <>
                {/* 현재 에너지 게이지 */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    현재 에너지 (최근 7일 평균)
                  </p>
                  {recent30.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      아직 기록이 없습니다. 아래에서 첫 기록을 추가해보세요.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {DIMENSIONS.map((dim) => (
                        <EnergyGaugeBar
                          key={dim.key}
                          label={dim.label}
                          score={currentEnergy[dim.key]}
                          color={dim.color}
                          trackColor={dim.trackColor}
                          badgeClass={dim.badgeClass}
                          dim={dim.key}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* 기록 추가 폼 */}
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={() => setFormOpen((v) => !v)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {formOpen ? "기록 폼 닫기" : "에너지 기록 추가"}
                  </Button>

                  {formOpen && (
                    <div className="mt-3 border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
                      {/* 날짜 */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">날짜</Label>
                        <Input
                          type="date"
                          value={formDate}
                          onChange={(e) => setFormDate(e.target.value)}
                          className="h-7 text-xs"
                          max={todayStr()}
                        />
                      </div>

                      {/* 슬라이더 */}
                      {DIMENSIONS.map((dim) => (
                        <div key={dim.key} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-gray-600">
                              {dim.label}
                            </Label>
                            <span
                              className="text-xs font-bold"
                              style={{ color: dim.color }}
                            >
                              {formScores[dim.key]}
                            </span>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[formScores[dim.key]]}
                            onValueChange={(val) => handleScoreChange(dim.key, val)}
                            className="w-full"
                          />
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>0</span>
                            <span>50</span>
                            <span>100</span>
                          </div>
                        </div>
                      ))}

                      {/* 메모 */}
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-600">메모 (선택)</Label>
                        <Textarea
                          value={formNote}
                          onChange={(e) => setFormNote(e.target.value)}
                          placeholder="오늘 연습 후 느낀 점을 적어보세요..."
                          className="text-xs min-h-[60px] resize-none"
                        />
                      </div>

                      <Button
                        size="sm"
                        className="h-7 text-xs w-full"
                        onClick={handleSubmit}
                        disabled={submitting || !formDate}
                      >
                        기록 저장
                      </Button>
                    </div>
                  )}
                </div>

                {/* 주간 트렌드 차트 */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    주간 트렌드 (최근 4주)
                  </p>
                  <WeeklyBarChart trends={weeklyTrends} />
                </div>

                {/* 최근 기록 리스트 */}
                {recentList.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      최근 기록
                    </p>
                    <div className="space-y-1.5">
                      {recentList.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-start justify-between gap-2 rounded-md border border-gray-100 bg-white px-2.5 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-gray-700">
                                {rec.date}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                by {rec.recordedBy}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {DIMENSIONS.map((dim) => (
                                <span
                                  key={dim.key}
                                  className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${dim.badgeClass}`}
                                >
                                  {dim.label} {rec.scores[dim.key]}
                                </span>
                              ))}
                            </div>
                            {rec.note && (
                              <p className="mt-0.5 text-[11px] text-gray-500 truncate">
                                {rec.note}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteRecord(rec.id)}
                            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                            aria-label="기록 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
