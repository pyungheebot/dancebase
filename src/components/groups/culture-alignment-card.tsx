"use client";

import { useState } from "react";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Settings2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCultureAlignment } from "@/hooks/use-culture-alignment";
import type { CultureDimension, CultureProfile } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const DIMENSIONS: CultureDimension[] = [
  "teamwork",
  "creativity",
  "discipline",
  "fun",
  "growth",
];

const DIMENSION_LABELS: Record<CultureDimension, string> = {
  teamwork: "팀워크",
  creativity: "창의성",
  discipline: "규율",
  fun: "즐거움",
  growth: "성장",
};

const DIMENSION_COLORS: Record<CultureDimension, string> = {
  teamwork: "#6366f1",
  creativity: "#ec4899",
  discipline: "#f59e0b",
  fun: "#10b981",
  growth: "#3b82f6",
};

const ALIGNMENT_BADGE = (pct: number): string => {
  if (pct >= 80) return "bg-green-100 text-green-700 hover:bg-green-100";
  if (pct >= 60) return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  if (pct >= 40) return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
  return "bg-red-100 text-red-700 hover:bg-red-100";
};

const PROGRESS_COLOR = (pct: number): string => {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 60) return "bg-blue-500";
  if (pct >= 40) return "bg-yellow-500";
  return "bg-red-500";
};

// ─── SVG 레이더 차트 ──────────────────────────────────────────

const CHART_SIZE = 160;
const CENTER = CHART_SIZE / 2;
const MAX_RADIUS = 58;
const LABEL_RADIUS = 72;

/**
 * 5각형 각도 계산 (위에서 시작, 시계방향)
 * index 0 = top, 1 = upper-right, 2 = lower-right, 3 = lower-left, 4 = upper-left
 */
function angleOf(index: number): number {
  return (Math.PI * 2 * index) / 5 - Math.PI / 2;
}

function polarToXY(radius: number, angleIndex: number): { x: number; y: number } {
  const angle = angleOf(angleIndex);
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

function scoresToPath(scores: Record<CultureDimension, number>): string {
  const points = DIMENSIONS.map((dim, i) => {
    const ratio = ((scores[dim] ?? 1) - 1) / 9; // 1-10 → 0-1
    const r = ratio * MAX_RADIUS;
    const { x, y } = polarToXY(r, i);
    return `${x},${y}`;
  });
  return `M${points.join("L")}Z`;
}

function polygonPath(radius: number): string {
  const points = DIMENSIONS.map((_, i) => {
    const { x, y } = polarToXY(radius, i);
    return `${x},${y}`;
  });
  return `M${points.join("L")}Z`;
}

interface RadarChartProps {
  idealScores: Record<CultureDimension, number>;
  profile: CultureProfile | null;
  groupAvg: Record<CultureDimension, number>;
}

function RadarChart({ idealScores, profile, groupAvg }: RadarChartProps) {
  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <svg
      width={CHART_SIZE}
      height={CHART_SIZE}
      viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
      className="overflow-visible"
    >
      {/* 배경 그리드 */}
      {gridLevels.map((level) => {
        const r = ((level - 1) / 9) * MAX_RADIUS;
        return (
          <path
            key={level}
            d={polygonPath(r)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.8"
          />
        );
      })}

      {/* 축선 */}
      {DIMENSIONS.map((_, i) => {
        const { x, y } = polarToXY(MAX_RADIUS, i);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="#e5e7eb"
            strokeWidth="0.8"
          />
        );
      })}

      {/* 그룹 이상 가치 (점선) */}
      <path
        d={scoresToPath(idealScores)}
        fill="rgba(99,102,241,0.08)"
        stroke="#6366f1"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />

      {/* 멤버 프로필 (실선) — 선택된 경우 */}
      {profile && (
        <path
          d={scoresToPath(profile.scores)}
          fill="rgba(236,72,153,0.12)"
          stroke="#ec4899"
          strokeWidth="1.5"
        />
      )}

      {/* 그룹 평균 (실선, 연한 파란색) — 프로필 없을 때 표시 */}
      {!profile && (
        <path
          d={scoresToPath(groupAvg)}
          fill="rgba(59,130,246,0.10)"
          stroke="#3b82f6"
          strokeWidth="1.5"
        />
      )}

      {/* 축 라벨 */}
      {DIMENSIONS.map((dim, i) => {
        const { x, y } = polarToXY(LABEL_RADIUS, i);
        const anchor =
          Math.abs(x - CENTER) < 4
            ? "middle"
            : x < CENTER
            ? "end"
            : "start";
        return (
          <text
            key={dim}
            x={x}
            y={y + 3}
            textAnchor={anchor}
            fontSize="9"
            fill="#6b7280"
            fontWeight="500"
          >
            {DIMENSION_LABELS[dim]}
          </text>
        );
      })}
    </svg>
  );
}

// ─── 슬라이더 행 ─────────────────────────────────────────────

interface DimSliderProps {
  dim: CultureDimension;
  value: number;
  onChange: (v: number) => void;
}

function DimSlider({ dim, value, onChange }: DimSliderProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-14 text-[10px] font-medium shrink-0"
        style={{ color: DIMENSION_COLORS[dim] }}
      >
        {DIMENSION_LABELS[dim]}
      </span>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="w-5 text-[10px] text-right text-muted-foreground font-mono">
        {value}
      </span>
    </div>
  );
}

// ─── 이상 가치 설정 다이얼로그 ───────────────────────────────

interface IdealDialogProps {
  idealScores: Record<CultureDimension, number>;
  onSave: (scores: Record<CultureDimension, number>) => void;
}

function IdealDialog({ idealScores, onSave }: IdealDialogProps) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<CultureDimension, number>>({
    ...idealScores,
  });

  function handleOpen(v: boolean) {
    if (v) setScores({ ...idealScores });
    setOpen(v);
  }

  function handleSave() {
    onSave(scores);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Settings2 className="h-3 w-3" />
          이상 가치 설정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">그룹 이상 가치 설정</DialogTitle>
        </DialogHeader>
        <p className="text-[10px] text-muted-foreground">
          그룹이 지향하는 문화 가치의 중요도를 1-10으로 설정하세요.
        </p>
        <div className="space-y-3 pt-1">
          {DIMENSIONS.map((dim) => (
            <DimSlider
              key={dim}
              dim={dim}
              value={scores[dim]}
              onChange={(v) => setScores((prev) => ({ ...prev, [dim]: v }))}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 멤버 추가 다이얼로그 ────────────────────────────────────

interface AddProfileDialogProps {
  onAdd: (name: string, scores: Record<CultureDimension, number>) => boolean;
}

const DEFAULT_SCORES: Record<CultureDimension, number> = {
  teamwork: 5,
  creativity: 5,
  discipline: 5,
  fun: 5,
  growth: 5,
};

function AddProfileDialog({ onAdd }: AddProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scores, setScores] =
    useState<Record<CultureDimension, number>>({ ...DEFAULT_SCORES });

  function handleOpen(v: boolean) {
    if (v) {
      setName("");
      setScores({ ...DEFAULT_SCORES });
    }
    setOpen(v);
  }

  function handleAdd() {
    const ok = onAdd(name, scores);
    if (ok) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          멤버 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">멤버 문화 프로필 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">멤버 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <p className="text-[10px] text-muted-foreground">
              각 문화 가치에 대한 본인의 성향을 1-10으로 평가하세요.
            </p>
            {DIMENSIONS.map((dim) => (
              <DimSlider
                key={dim}
                dim={dim}
                value={scores[dim]}
                onChange={(v) =>
                  setScores((prev) => ({ ...prev, [dim]: v }))
                }
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>
            추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 멤버 상세 패널 ──────────────────────────────────────────

interface MemberDetailProps {
  profile: CultureProfile;
  alignment: number;
  idealScores: Record<CultureDimension, number>;
  onUpdate: (id: string, scores: Record<CultureDimension, number>) => boolean;
  onDelete: (id: string) => void;
}

function MemberDetail({
  profile,
  alignment,
  idealScores,
  onUpdate,
  onDelete,
}: MemberDetailProps) {
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState<Record<CultureDimension, number>>({
    ...profile.scores,
  });

  function handleSave() {
    const ok = onUpdate(profile.id, scores);
    if (ok) setEditing(false);
  }

  function handleCancel() {
    setScores({ ...profile.scores });
    setEditing(false);
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{profile.memberName}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 ${ALIGNMENT_BADGE(alignment)}`}
          >
            {alignment}%
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={() => setEditing(!editing)}
          >
            {editing ? "취소" : "편집"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(profile.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 레이더 차트 + 점수 리스트 */}
      <div className="flex gap-3 items-start">
        <RadarChart
          idealScores={idealScores}
          profile={profile}
          groupAvg={profile.scores}
        />
        <div className="flex-1 space-y-1.5">
          {editing
            ? DIMENSIONS.map((dim) => (
                <DimSlider
                  key={dim}
                  dim={dim}
                  value={scores[dim]}
                  onChange={(v) =>
                    setScores((prev) => ({ ...prev, [dim]: v }))
                  }
                />
              ))
            : DIMENSIONS.map((dim) => {
                const diff = profile.scores[dim] - idealScores[dim];
                return (
                  <div key={dim} className="flex items-center gap-1.5">
                    <span
                      className="w-12 text-[10px] shrink-0"
                      style={{ color: DIMENSION_COLORS[dim] }}
                    >
                      {DIMENSION_LABELS[dim]}
                    </span>
                    <span className="text-[10px] font-mono w-4 text-right text-muted-foreground">
                      {profile.scores[dim]}
                    </span>
                    <span
                      className={`text-[10px] font-mono w-6 ${
                        diff > 0
                          ? "text-green-600"
                          : diff < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff === 0 ? "±0" : diff}
                    </span>
                  </div>
                );
              })}
          {editing && (
            <div className="flex gap-1 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 flex-1"
                onClick={handleCancel}
              >
                취소
              </Button>
              <Button
                size="sm"
                className="h-6 text-[10px] px-2 flex-1"
                onClick={handleSave}
              >
                저장
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 카드 ───────────────────────────────────────────────

export function CultureAlignmentCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    config,
    setIdealScores,
    addProfile,
    updateProfile,
    deleteProfile,
    getAllAlignments,
    groupAverage,
    averageAlignment,
    memberCount,
  } = useCultureAlignment(groupId);

  const alignments = getAllAlignments();
  const avgProfile = groupAverage();
  const selected = config.profiles.find((p) => p.id === selectedId) ?? null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border bg-card shadow-sm">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 rounded-xl transition-colors">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              <span className="text-sm font-semibold">문화 가치관 맞춤도</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground hover:bg-muted">
                <Users className="h-2.5 w-2.5 mr-0.5 inline-block" />
                {memberCount}명
              </Badge>
              {memberCount > 0 && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 ${ALIGNMENT_BADGE(averageAlignment)}`}
                >
                  평균 {averageAlignment}%
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <Separator />
          <div className="p-4 space-y-4">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                그룹 핵심 가치를 정의하고 멤버별 맞춤도를 분석합니다.
              </p>
              <div className="flex items-center gap-2">
                <IdealDialog
                  idealScores={config.idealScores}
                  onSave={setIdealScores}
                />
                <AddProfileDialog onAdd={addProfile} />
              </div>
            </div>

            {/* 이상 가치 미리보기 */}
            <div className="rounded-lg border bg-indigo-50/50 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-indigo-700">
                그룹 이상 가치 (기준)
              </p>
              <div className="grid grid-cols-5 gap-1">
                {DIMENSIONS.map((dim) => (
                  <div key={dim} className="text-center">
                    <div
                      className="text-[10px] font-mono font-semibold"
                      style={{ color: DIMENSION_COLORS[dim] }}
                    >
                      {config.idealScores[dim]}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {DIMENSION_LABELS[dim]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 멤버 없을 때 안내 */}
            {memberCount === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">멤버 프로필을 추가하면 맞춤도를 분석합니다.</p>
              </div>
            )}

            {/* 멤버 맞춤도 리스트 */}
            {memberCount > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  멤버 맞춤도 순위
                </p>
                <div className="space-y-1.5">
                  {alignments.map(({ profile, alignment }, idx) => (
                    <div
                      key={profile.id}
                      className={`flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${
                        selectedId === profile.id
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() =>
                        setSelectedId(
                          selectedId === profile.id ? null : profile.id
                        )
                      }
                    >
                      <span className="text-[10px] text-muted-foreground w-4 text-right font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium flex-1 truncate">
                        {profile.memberName}
                      </span>
                      <div className="flex items-center gap-1.5 w-28">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${PROGRESS_COLOR(alignment)}`}
                            style={{ width: `${alignment}%` }}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-mono w-8 text-right ${
                            alignment >= 80
                              ? "text-green-600"
                              : alignment >= 60
                              ? "text-blue-600"
                              : alignment >= 40
                              ? "text-yellow-600"
                              : "text-red-500"
                          }`}
                        >
                          {alignment}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 선택된 멤버 상세 */}
            {selected && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    멤버 상세 분석
                  </p>
                  <MemberDetail
                    profile={selected}
                    alignment={
                      alignments.find((a) => a.profile.id === selected.id)
                        ?.alignment ?? 0
                    }
                    idealScores={config.idealScores}
                    onUpdate={updateProfile}
                    onDelete={(id) => {
                      deleteProfile(id);
                      setSelectedId(null);
                    }}
                  />
                </div>
              </>
            )}

            {/* 그룹 평균 레이더 차트 (멤버 2명 이상, 미선택 상태) */}
            {memberCount >= 2 && !selected && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    그룹 평균 vs 이상 가치
                  </p>
                  <div className="flex items-start gap-4">
                    <RadarChart
                      idealScores={config.idealScores}
                      profile={null}
                      groupAvg={avgProfile}
                    />
                    <div className="flex-1 space-y-2">
                      {/* 범례 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <svg width="16" height="8">
                            <line
                              x1="0"
                              y1="4"
                              x2="16"
                              y2="4"
                              stroke="#6366f1"
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                            />
                          </svg>
                          <span className="text-[10px] text-muted-foreground">
                            이상 가치
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg width="16" height="8">
                            <line
                              x1="0"
                              y1="4"
                              x2="16"
                              y2="4"
                              stroke="#3b82f6"
                              strokeWidth="1.5"
                            />
                          </svg>
                          <span className="text-[10px] text-muted-foreground">
                            그룹 평균
                          </span>
                        </div>
                      </div>
                      {/* 차원별 평균 */}
                      <div className="space-y-1.5 pt-1">
                        {DIMENSIONS.map((dim) => {
                          const avg = avgProfile[dim];
                          const ideal = config.idealScores[dim];
                          const diff = Math.round((avg - ideal) * 10) / 10;
                          return (
                            <div key={dim} className="flex items-center gap-1.5">
                              <span
                                className="w-12 text-[10px] shrink-0"
                                style={{ color: DIMENSION_COLORS[dim] }}
                              >
                                {DIMENSION_LABELS[dim]}
                              </span>
                              <Progress
                                value={(avg / 10) * 100}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-[10px] font-mono w-6 text-right text-muted-foreground">
                                {avg}
                              </span>
                              <span
                                className={`text-[10px] font-mono w-7 text-right ${
                                  diff > 0
                                    ? "text-green-600"
                                    : diff < 0
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff === 0 ? "±0" : diff}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
