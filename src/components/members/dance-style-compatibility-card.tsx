"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Heart,
  Zap,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDanceStyleCompatibility,
  defaultDanceStyleScores,
} from "@/hooks/use-dance-style-compatibility";
import {
  DANCE_STYLE_DIMENSIONS,
  DANCE_STYLE_DIMENSION_LABELS,
} from "@/types";
import type { DanceStyleDimension, StyleCompatibilityResult } from "@/types";

// ============================================
// Props
// ============================================

type DanceStyleCompatibilityCardProps = {
  groupId: string;
  userId: string;
  userName: string;
};

// ============================================
// SVG 오각형 레이더 차트
// ============================================

type PentagonRadarChartProps = {
  scores: Record<DanceStyleDimension, number>;
  size?: number;
};

function PentagonRadarChart({ scores, size = 140 }: PentagonRadarChartProps) {
  const CENTER = size / 2;
  const MAX_RADIUS = (size / 2) * 0.6;
  const N = DANCE_STYLE_DIMENSIONS.length; // 5개

  /** 인덱스 → 각도 (위에서 시작, 시계방향) */
  function getAngle(i: number): number {
    return (i / N) * 2 * Math.PI - Math.PI / 2;
  }

  /** 점수(1~5) → 반지름 */
  function scoreToRadius(score: number): number {
    return ((score - 1) / 4) * MAX_RADIUS + MAX_RADIUS * 0.2;
  }

  /** (score, index) → SVG 좌표 */
  function getPoint(score: number, i: number): { x: number; y: number } {
    const r = scoreToRadius(score);
    const angle = getAngle(i);
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  }

  /** 점수 배열 → polygon points 문자열 */
  function buildPolygonPoints(
    scoresMap: Record<DanceStyleDimension, number>
  ): string {
    return DANCE_STYLE_DIMENSIONS.map((dim, i) =>
      getPoint(scoresMap[dim] ?? 3, i)
    )
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
  }

  // 배경 격자 (1~5 레벨)
  const gridLevels = [1, 2, 3, 4, 5];

  // 축 끝점
  const axisEndPoints = DANCE_STYLE_DIMENSIONS.map((_, i) => {
    const angle = getAngle(i);
    return {
      x: CENTER + MAX_RADIUS * Math.cos(angle),
      y: CENTER + MAX_RADIUS * Math.sin(angle),
    };
  });

  // 레이블 위치
  const labelOffset = MAX_RADIUS + 18;
  const labelPoints = DANCE_STYLE_DIMENSIONS.map((dim, i) => {
    const angle = getAngle(i);
    return {
      dim,
      x: CENTER + labelOffset * Math.cos(angle),
      y: CENTER + labelOffset * Math.sin(angle),
    };
  });

  const viewBoxPad = labelOffset + 14;
  const vbSize = size + viewBoxPad;

  return (
    <svg
      width={vbSize}
      height={vbSize}
      viewBox={`${-viewBoxPad / 2} ${-viewBoxPad / 2} ${vbSize} ${vbSize}`}
      aria-label="댄스 스타일 레이더 차트"
    >
      {/* 배경 격자 (오각형 5단계) */}
      {gridLevels.map((level) => {
        const pts = DANCE_STYLE_DIMENSIONS.map((_, i) => {
          const r = scoreToRadius(level);
          const angle = getAngle(i);
          return `${(CENTER + r * Math.cos(angle)).toFixed(2)},${(CENTER + r * Math.sin(angle)).toFixed(2)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* 축 선 */}
      {axisEndPoints.map((ep, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={ep.x.toFixed(2)}
          y2={ep.y.toFixed(2)}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      ))}

      {/* 점수 다각형 */}
      <polygon
        points={buildPolygonPoints(scores)}
        fill="rgba(139,92,246,0.18)"
        stroke="#8b5cf6"
        strokeWidth="2"
      />

      {/* 꼭짓점 점 */}
      {DANCE_STYLE_DIMENSIONS.map((dim, i) => {
        const p = getPoint(scores[dim] ?? 3, i);
        return (
          <circle
            key={dim}
            cx={p.x.toFixed(2)}
            cy={p.y.toFixed(2)}
            r="3"
            fill="#8b5cf6"
          />
        );
      })}

      {/* 레이블 */}
      {labelPoints.map(({ dim, x, y }) => (
        <text
          key={dim}
          x={x.toFixed(2)}
          y={y.toFixed(2)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="#64748b"
          fontFamily="inherit"
        >
          {DANCE_STYLE_DIMENSION_LABELS[dim]}
        </text>
      ))}
    </svg>
  );
}

// ============================================
// 점수 선택 버튼 그룹 (1~5)
// ============================================

function ScoreButtons({
  dim,
  value,
  onChange,
}: {
  dim: DanceStyleDimension;
  value: number;
  onChange: (dim: DanceStyleDimension, score: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(dim, n)}
          className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
            value === n
              ? "bg-violet-600 text-white"
              : "bg-muted text-muted-foreground hover:bg-violet-100 hover:text-violet-700"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ============================================
// 호환성 결과 항목
// ============================================

function CompatibilityItem({
  result,
  rank,
}: {
  result: StyleCompatibilityResult;
  rank: number;
}) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isTop3
          ? "border-violet-200 bg-violet-50/60"
          : "border-border bg-background"
      }`}
    >
      {/* 이름 + 점수 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isTop3 && (
            <Star
              className={`h-3 w-3 ${
                rank === 1
                  ? "text-yellow-500"
                  : rank === 2
                    ? "text-slate-400"
                    : "text-amber-600"
              }`}
            />
          )}
          <span className="text-xs font-medium">{result.partnerName}</span>
        </div>
        <span
          className={`text-sm font-bold tabular-nums ${
            result.compatibilityScore >= 80
              ? "text-violet-600"
              : result.compatibilityScore >= 60
                ? "text-blue-600"
                : "text-muted-foreground"
          }`}
        >
          {result.compatibilityScore}
          <span className="text-[10px] font-normal text-muted-foreground">점</span>
        </span>
      </div>

      {/* 프로그레스 바 */}
      <Progress
        value={result.compatibilityScore}
        className={`h-1.5 ${isTop3 ? "[&>div]:bg-violet-500" : "[&>div]:bg-blue-400"}`}
      />

      {/* 영역 배지 */}
      <div className="flex flex-wrap gap-1">
        {result.complementaryAreas.map((dim) => (
          <span
            key={`comp-${dim}`}
            className="text-[10px] px-1.5 py-0 rounded-full bg-orange-100 text-orange-700 font-medium"
          >
            {DANCE_STYLE_DIMENSION_LABELS[dim]} 보완
          </span>
        ))}
        {result.similarAreas.map((dim) => (
          <span
            key={`sim-${dim}`}
            className="text-[10px] px-1.5 py-0 rounded-full bg-blue-100 text-blue-700"
          >
            {DANCE_STYLE_DIMENSION_LABELS[dim]} 유사
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function DanceStyleCompatibilityCard({
  groupId,
  userId,
  userName,
}: DanceStyleCompatibilityCardProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<DanceStyleDimension, number>>(
    defaultDanceStyleScores()
  );
  const [draftStyle, setDraftStyle] = useState("");
  const [saving, setSaving] = useState(false);

  const { myProfile, getCompatibilityResults, loading, saveMyProfile } =
    useDanceStyleCompatibility(groupId, userId);

  const compatibilityResults = getCompatibilityResults(userId);

  // 편집 시작
  function handleStartEdit() {
    setDraftScores(myProfile ? { ...myProfile.scores } : defaultDanceStyleScores());
    setDraftStyle(myProfile?.preferredStyle ?? "");
    setEditing(true);
  }

  // 편집 취소
  function handleCancelEdit() {
    setEditing(false);
  }

  // 저장
  function handleSave() {
    setSaving(true);
    try {
      saveMyProfile(userId, userName, draftScores, draftStyle.trim());
      toast.success("댄스 스타일 프로필이 저장되었습니다");
      setEditing(false);
    } catch {
      toast.error("저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  }

  // 점수 변경
  function handleScoreChange(dim: DanceStyleDimension, score: number) {
    setDraftScores((prev) => ({ ...prev, [dim]: score }));
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border border-border rounded-lg bg-card">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">댄스 스타일 호환성</span>
              {myProfile && (
                <span className="text-[10px] px-1.5 py-0 bg-violet-100 text-violet-700 rounded-full">
                  {myProfile.preferredStyle || "프로필 등록됨"}
                </span>
              )}
              {compatibilityResults.length > 0 && (
                <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full flex items-center gap-0.5">
                  <Users className="h-2.5 w-2.5" />
                  {compatibilityResults.length}명 분석
                </span>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : editing ? (
              /* ── 편집 UI ── */
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  각 스타일 특성을 1~5점으로 평가하고 선호 장르를 입력하세요.
                </p>

                {/* 차트 미리보기 */}
                <div className="flex justify-center">
                  <PentagonRadarChart scores={draftScores} />
                </div>

                {/* 점수 입력 */}
                <div className="space-y-3">
                  {DANCE_STYLE_DIMENSIONS.map((dim) => (
                    <div key={dim} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium w-14 shrink-0">
                        {DANCE_STYLE_DIMENSION_LABELS[dim]}
                      </span>
                      <ScoreButtons
                        dim={dim}
                        value={draftScores[dim]}
                        onChange={handleScoreChange}
                      />
                      <span className="text-xs font-semibold text-violet-600 w-5 text-right tabular-nums shrink-0">
                        {draftScores[dim]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 선호 장르 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">선호 장르</label>
                  <Input
                    value={draftStyle}
                    onChange={(e) => setDraftStyle(e.target.value)}
                    placeholder="예: 힙합, 팝핀, 왁킹..."
                    className="h-8 text-xs"
                    maxLength={30}
                  />
                </div>

                {/* 저장/취소 버튼 */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs flex-1"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {saving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="h-3 w-3 mr-1" />
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              /* ── 결과 보기 UI ── */
              <div className="space-y-4">
                {/* 내 프로필 영역 */}
                {myProfile ? (
                  <div className="space-y-3">
                    {/* 레이더 차트 */}
                    <div className="flex flex-col items-center gap-2">
                      <PentagonRadarChart scores={myProfile.scores} />
                      {myProfile.preferredStyle && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3 text-violet-500" />
                          선호 장르:
                          <span className="font-medium text-foreground">
                            {myProfile.preferredStyle}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 차원별 점수 그리드 */}
                    <div className="grid grid-cols-5 gap-1">
                      {DANCE_STYLE_DIMENSIONS.map((dim) => (
                        <div
                          key={dim}
                          className="flex flex-col items-center gap-0.5 p-1.5 rounded bg-muted/50"
                        >
                          <span className="text-[10px] text-muted-foreground">
                            {DANCE_STYLE_DIMENSION_LABELS[dim]}
                          </span>
                          <span className="text-sm font-bold text-violet-600 tabular-nums">
                            {myProfile.scores[dim]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      아직 댄스 스타일 프로필이 없습니다.
                      <br />
                      프로필을 등록하고 다른 멤버와 호환성을 확인해보세요.
                    </p>
                  </div>
                )}

                {/* 프로필 편집 버튼 */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs w-full"
                  onClick={handleStartEdit}
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  {myProfile ? "프로필 수정" : "프로필 등록"}
                </Button>

                {/* 호환성 결과 */}
                {myProfile && compatibilityResults.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        호환성 분석 결과
                      </span>
                      <span className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 rounded-full ml-auto">
                        보완
                      </span>
                      <span className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 rounded-full">
                        유사
                      </span>
                    </div>

                    <div className="space-y-2">
                      {compatibilityResults.map((result, idx) => (
                        <CompatibilityItem
                          key={result.partnerId}
                          result={result}
                          rank={idx + 1}
                        />
                      ))}
                    </div>

                    {compatibilityResults.length >= 3 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        <Star className="h-2.5 w-2.5 inline mr-0.5 text-yellow-500" />
                        상위 3명은 최적 파트너 추천입니다
                      </p>
                    )}
                  </div>
                )}

                {/* 다른 멤버 프로필이 없는 경우 */}
                {myProfile && compatibilityResults.length === 0 && (
                  <div className="text-center py-3 text-xs text-muted-foreground border-t border-border pt-4">
                    다른 멤버가 프로필을 등록하면 호환성을 분석할 수 있습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
