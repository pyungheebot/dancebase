"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Timer,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  useSessionTimer,
  SEGMENT_COLORS,
  MAX_PRESETS,
  MAX_SEGMENTS,
} from "@/hooks/use-session-timer";
import type { SessionTimerSegment } from "@/types";

// ============================================
// 유틸
// ============================================

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

// ============================================
// SVG 도넛 파이 차트
// ============================================

type DonutChartProps = {
  segments: SessionTimerSegment[];
  totalMinutes: number;
  currentSegmentIndex: number;
  progress: number; // 0~1, 전체 진행률
  isRunning: boolean;
};

function DonutChart({
  segments,
  totalMinutes,
  currentSegmentIndex,
  progress,
  isRunning,
}: DonutChartProps) {
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const r = 36;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;

  if (totalMinutes === 0 || segments.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
      </svg>
    );
  }

  // 각 구간의 호(arc) 계산 - reduce로 불변 패턴 사용 (React Compiler 호환)
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const { arcs } = segments.reduce<{
    arcs: {
      seg: SessionTimerSegment;
      d: string;
      strokeDasharray: string;
      startAngle: number;
      angle: number;
    }[];
    cumulativeAngle: number;
  }>(
    (acc, seg) => {
      const ratio = seg.durationMinutes / totalMinutes;
      const angle = ratio * 360;
      const startAngle = acc.cumulativeAngle;
      const endAngle = startAngle + angle;

      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle - 0.5));
      const y2 = cy + r * Math.sin(toRad(endAngle - 0.5));
      const largeArc = angle > 180 ? 1 : 0;

      return {
        arcs: [
          ...acc.arcs,
          {
            seg,
            d: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
            strokeDasharray: `${((angle - 0.5) / 360) * circumference} ${circumference}`,
            startAngle,
            angle,
          },
        ],
        cumulativeAngle: endAngle,
      };
    },
    { arcs: [], cumulativeAngle: -90 } // 12시 방향 시작
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 배경 원 */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />

      {/* 구간별 호 */}
      {arcs.map((arc, idx) => {
        const isCurrentSeg = idx === currentSegmentIndex && isRunning;
        return (
          <path
            key={arc.seg.id}
            d={arc.d}
            fill="none"
            stroke={arc.seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={isRunning && idx > currentSegmentIndex ? 0.3 : idx < currentSegmentIndex ? 0.6 : 1}
          />
        );
      })}

      {/* 진행 오버레이 (전체 진행률 흰색 호로 미완성 영역 표시) */}
      {isRunning && progress > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="transparent"
          strokeWidth={strokeWidth}
        />
      )}

      {/* 중앙 텍스트 */}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="#6b7280"
        fontWeight="600"
      >
        {isRunning
          ? `${Math.round(progress * 100)}%`
          : `${totalMinutes}분`}
      </text>
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="8"
        fill="#9ca3af"
      >
        {isRunning ? "진행" : "총 시간"}
      </text>
    </svg>
  );
}

// ============================================
// 구간 색상 선택기
// ============================================

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {SEGMENT_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: color,
            borderColor: value === color ? "#1f2937" : "transparent",
          }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

// ============================================
// 새 프리셋 폼
// ============================================

type NewPresetFormProps = {
  onSave: (title: string, segments: SessionTimerSegment[]) => void;
  onCancel: () => void;
};

function NewPresetForm({ onSave, onCancel }: NewPresetFormProps) {
  const [title, setTitle] = useState("");
  const [segments, setSegments] = useState<SessionTimerSegment[]>(() => [
    { id: `ns-${Date.now()}`, label: "워밍업", durationMinutes: 15, color: "#f97316" },
  ]);
  const [newLabel, setNewLabel] = useState("");
  const [newDuration, setNewDuration] = useState("15");
  const [newColor, setNewColor] = useState(SEGMENT_COLORS[1]);

  const handleAddSeg = () => {
    if (!newLabel.trim()) return;
    const dur = parseInt(newDuration) || 15;
    setSegments((prev) => [
      ...prev,
      { id: `ns-${Date.now()}`, label: newLabel.trim(), durationMinutes: dur, color: newColor },
    ]);
    setNewLabel("");
    setNewDuration("15");
    setNewColor(SEGMENT_COLORS[(segments.length + 1) % SEGMENT_COLORS.length]);
  };

  const handleRemoveSeg = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const canSave = segments.length > 0;

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
      <div className="text-xs font-medium text-muted-foreground">새 프리셋 만들기</div>

      {/* 프리셋 이름 */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="프리셋 이름 (예: 3시간 심화 연습)"
        className="h-7 text-xs"
      />

      {/* 구간 목록 */}
      <div className="space-y-1">
        {segments.map((seg) => (
          <div
            key={seg.id}
            className="flex items-center gap-1.5 rounded-md bg-background px-2 py-1"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="flex-1 text-xs truncate">{seg.label}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {seg.durationMinutes}분
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => handleRemoveSeg(seg.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* 구간 추가 */}
      {segments.length < MAX_SEGMENTS && (
        <div className="space-y-2 rounded-md border border-dashed p-2">
          <div className="flex gap-1">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="구간명"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleAddSeg()}
            />
            <Input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              placeholder="분"
              className="h-7 text-xs w-14"
              min={1}
              max={999}
            />
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs w-full gap-1"
            onClick={handleAddSeg}
            disabled={!newLabel.trim()}
          >
            <Plus className="h-3 w-3" />
            구간 추가
          </Button>
        </div>
      )}

      {/* 저장/취소 */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          className="flex-1 h-7 text-xs gap-1"
          onClick={() => onSave(title, segments)}
          disabled={!canSave}
        >
          <Check className="h-3 w-3" />
          저장
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-7 text-xs"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

type SessionTimerCardProps = {
  groupId: string;
};

export function SessionTimerCard({ groupId }: SessionTimerCardProps) {
  const {
    presets,
    selectedPresetId,
    selectedPreset,
    setSelectedPresetId,
    addPreset,
    deletePreset,
    status,
    currentSegmentIndex,
    remainingSeconds,
    elapsedTotal,
    totalSeconds,
    isFlashing,
    startTimer,
    pauseTimer,
    resumeTimer,
    skipSegment,
    resetTimer,
  } = useSessionTimer(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [showNewPresetForm, setShowNewPresetForm] = useState(false);

  const isIdle = status === "idle";
  const isRunning = status === "running";
  const isPaused = status === "paused";
  const isFinished = status === "finished";
  const isActive = isRunning || isPaused;

  const overallProgress = totalSeconds > 0 ? elapsedTotal / totalSeconds : 0;
  const currentSeg = selectedPreset?.segments[currentSegmentIndex];
  const currentSegDuration = currentSeg ? currentSeg.durationMinutes * 60 : 0;
  const currentSegProgress =
    currentSegDuration > 0
      ? (currentSegDuration - remainingSeconds) / currentSegDuration
      : 0;

  const handleSavePreset = (title: string, segments: SessionTimerSegment[]) => {
    const ok = addPreset(title, segments);
    if (ok) setShowNewPresetForm(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* 헤더 트리거 */}
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer items-center justify-between rounded-lg border bg-card px-3 py-2.5 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">연습 세션 타이머</span>
            {isActive && (
              <Badge
                variant="outline"
                className={[
                  "text-[10px] px-1.5 py-0",
                  isRunning
                    ? "bg-green-100 text-green-700 border-green-200 animate-pulse"
                    : "bg-yellow-100 text-yellow-700 border-yellow-200",
                ].join(" ")}
              >
                {isRunning ? "진행 중" : "일시정지"}
              </Badge>
            )}
            {isFinished && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
              >
                완료
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="font-mono text-xs text-muted-foreground">
                {formatTime(remainingSeconds)}
              </span>
            )}
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 rounded-lg border bg-card p-3 space-y-4">

          {/* 카운트다운 모드 (active) */}
          {isActive && currentSeg && (
            <div
              className={[
                "rounded-lg p-4 transition-all duration-300",
                isFlashing
                  ? "bg-primary/20 animate-pulse"
                  : "bg-muted/30",
              ].join(" ")}
            >
              {/* 현재 구간명 */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: currentSeg.color }}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {currentSeg.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({currentSegmentIndex + 1}/{selectedPreset?.segments.length})
                </span>
              </div>

              {/* 남은 시간 */}
              <div
                className={[
                  "text-center font-mono text-5xl font-bold tabular-nums tracking-tight",
                  isRunning ? "text-foreground" : "text-muted-foreground",
                ].join(" ")}
              >
                {formatTime(remainingSeconds)}
              </div>

              {/* 현재 구간 진행 바 */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${currentSegProgress * 100}%`,
                    backgroundColor: currentSeg.color,
                  }}
                />
              </div>

              {/* 전체 진행률 바 */}
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>전체 진행</span>
                  <span>{Math.round(overallProgress * 100)}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-1000"
                    style={{ width: `${overallProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 완료 상태 */}
          {isFinished && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 text-center space-y-1">
              <div className="text-sm font-medium text-green-700 dark:text-green-400">
                연습 완료!
              </div>
              <div className="font-mono text-3xl font-bold text-green-700 dark:text-green-400">
                {formatTime(elapsedTotal)}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">
                {selectedPreset?.title}
              </div>
            </div>
          )}

          {/* 프리셋 + 도넛 차트 (idle / 완료 상태) */}
          {(isIdle || isFinished) && selectedPreset && (
            <div className="flex gap-3">
              {/* 도넛 차트 */}
              <div className="shrink-0">
                <DonutChart
                  segments={selectedPreset.segments}
                  totalMinutes={selectedPreset.totalMinutes}
                  currentSegmentIndex={currentSegmentIndex}
                  progress={overallProgress}
                  isRunning={false}
                />
              </div>

              {/* 구간 범례 */}
              <div className="flex-1 space-y-1 min-w-0">
                {selectedPreset.segments.map((seg) => (
                  <div key={seg.id} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="flex-1 text-xs truncate text-muted-foreground">
                      {seg.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {seg.durationMinutes}분
                    </span>
                  </div>
                ))}
                <div className="pt-1 border-t text-[10px] text-muted-foreground">
                  합계: {formatMinutes(selectedPreset.totalMinutes)}
                </div>
              </div>
            </div>
          )}

          {/* 실행 중 - 구간 목록 (미니) */}
          {isActive && selectedPreset && (
            <div className="space-y-1">
              {selectedPreset.segments.map((seg, idx) => {
                const isDone = idx < currentSegmentIndex;
                const isCurrent = idx === currentSegmentIndex;
                return (
                  <div
                    key={seg.id}
                    className={[
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors",
                      isCurrent
                        ? "bg-primary/10 border border-primary/20 font-medium"
                        : isDone
                        ? "text-muted-foreground/60 line-through"
                        : "text-muted-foreground/50",
                    ].join(" ")}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: seg.color,
                        opacity: isDone ? 0.4 : 1,
                      }}
                    />
                    <span className="flex-1">{seg.label}</span>
                    <span className="shrink-0 text-[10px]">
                      {isDone ? "완료" : `${seg.durationMinutes}분`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 프리셋 선택 탭 (idle 상태에서만) */}
          {isIdle && presets.length > 1 && (
            <Tabs
              value={selectedPresetId}
              onValueChange={setSelectedPresetId}
            >
              <TabsList className="h-7 w-full">
                {presets.map((p) => (
                  <TabsTrigger
                    key={p.id}
                    value={p.id}
                    className="text-[10px] flex-1 h-5 px-1 truncate"
                  >
                    {p.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* 새 프리셋 폼 */}
          {showNewPresetForm && (
            <NewPresetForm
              onSave={handleSavePreset}
              onCancel={() => setShowNewPresetForm(false)}
            />
          )}

          {/* 컨트롤 버튼 */}
          <div className="space-y-2">
            {/* 메인 컨트롤 */}
            <div className="flex gap-1.5">
              {isIdle && (
                <Button
                  className="flex-1 h-8 text-xs gap-1"
                  onClick={startTimer}
                  disabled={!selectedPreset || selectedPreset.segments.length === 0}
                >
                  <Play className="h-3.5 w-3.5" />
                  타이머 시작
                </Button>
              )}
              {isRunning && (
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-xs gap-1"
                  onClick={pauseTimer}
                >
                  <Pause className="h-3.5 w-3.5" />
                  일시정지
                </Button>
              )}
              {isPaused && (
                <Button
                  className="flex-1 h-8 text-xs gap-1"
                  onClick={resumeTimer}
                >
                  <Play className="h-3.5 w-3.5" />
                  재개
                </Button>
              )}
              {isActive && (
                <Button
                  variant="outline"
                  className="flex-1 h-8 text-xs gap-1"
                  onClick={skipSegment}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  {currentSegmentIndex >= (selectedPreset?.segments.length ?? 1) - 1
                    ? "완료"
                    : "건너뛰기"}
                </Button>
              )}
              {(isActive || isFinished) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* idle 상태: 프리셋 관리 버튼 */}
            {isIdle && (
              <div className="flex gap-1.5">
                {presets.length < MAX_PRESETS && !showNewPresetForm && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-xs gap-1"
                    onClick={() => setShowNewPresetForm(true)}
                  >
                    <Plus className="h-3 w-3" />
                    프리셋 추가
                  </Button>
                )}
                {presets.length > 1 && selectedPreset && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    onClick={() => deletePreset(selectedPreset.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                    삭제
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
