"use client";

import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  usePeerScoring,
  PEER_SCORE_DIMENSIONS,
  PEER_SCORE_DIMENSION_LABELS,
} from "@/hooks/use-peer-scoring";
import type { PeerScoreDimension } from "@/types";

// ============================================
// Props
// ============================================

type PeerScoringCardProps = {
  groupId: string;
};

// ============================================
// 5각 레이더 차트 (CSS/SVG)
// ============================================

type MiniRadarProps = {
  scores: Record<PeerScoreDimension, number>;
};

function MiniRadar({ scores }: MiniRadarProps) {
  const SIZE = 64;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 26;
  const N = PEER_SCORE_DIMENSIONS.length; // 5개

  function getAngle(i: number): number {
    // 위(top)에서 시작, 시계방향
    return (i / N) * 2 * Math.PI - Math.PI / 2;
  }

  function scoreToRadius(score: number): number {
    if (score === 0) return MAX_RADIUS * 0.1;
    return ((score - 1) / 4) * MAX_RADIUS * 0.8 + MAX_RADIUS * 0.2;
  }

  function getPoint(score: number, i: number): string {
    const r = scoreToRadius(score);
    const angle = getAngle(i);
    const x = CENTER + r * Math.cos(angle);
    const y = CENTER + r * Math.sin(angle);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }

  // 배경 격자 (3단계)
  const gridLevels = [1, 3, 5];
  const dataPoints = PEER_SCORE_DIMENSIONS.map((dim, i) =>
    getPoint(scores[dim] ?? 0, i)
  ).join(" ");

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-label="피어 점수 레이더 차트"
    >
      {/* 배경 격자 */}
      {gridLevels.map((level) => {
        const pts = PEER_SCORE_DIMENSIONS.map((_, i) => {
          const r = scoreToRadius(level);
          const angle = getAngle(i);
          const x = CENTER + r * Math.cos(angle);
          const y = CENTER + r * Math.sin(angle);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
        );
      })}

      {/* 축 선 */}
      {PEER_SCORE_DIMENSIONS.map((_, i) => {
        const angle = getAngle(i);
        const x = CENTER + MAX_RADIUS * Math.cos(angle);
        const y = CENTER + MAX_RADIUS * Math.sin(angle);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
        );
      })}

      {/* 데이터 다각형 */}
      <polygon
        points={dataPoints}
        fill="rgba(99,102,241,0.2)"
        stroke="#6366f1"
        strokeWidth="1.2"
      />

      {/* 데이터 점 */}
      {PEER_SCORE_DIMENSIONS.map((dim, i) => {
        const score = scores[dim] ?? 0;
        const r = scoreToRadius(score);
        const angle = getAngle(i);
        const x = CENTER + r * Math.cos(angle);
        const y = CENTER + r * Math.sin(angle);
        return (
          <circle
            key={dim}
            cx={x.toFixed(1)}
            cy={y.toFixed(1)}
            r="1.8"
            fill="#6366f1"
          />
        );
      })}
    </svg>
  );
}

// ============================================
// 별점 표시
// ============================================

function StarRating({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-2.5 w-2.5 ${
            n <= Math.round(score)
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </span>
  );
}

// ============================================
// 점수 입력 다이얼로그
// ============================================

type ScoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    targetName: string;
    scorerName: string;
    scores: Record<PeerScoreDimension, number>;
    comment: string;
    sessionDate: string;
  }) => void;
};

function ScoreDialog({ open, onOpenChange, onSubmit }: ScoreDialogProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [targetName, setTargetName] = useState("");
  const [scorerName, setScorerName] = useState("");
  const [comment, setComment] = useState("");
  const [sessionDate, setSessionDate] = useState(today);
  const [scores, setScores] = useState<Record<PeerScoreDimension, number>>({
    timing: 3,
    expression: 3,
    energy: 3,
    technique: 3,
    teamwork: 3,
  });

  const handleReset = () => {
    setTargetName("");
    setScorerName("");
    setComment("");
    setSessionDate(today);
    setScores({ timing: 3, expression: 3, energy: 3, technique: 3, teamwork: 3 });
  };

  const handleSubmit = () => {
    if (!targetName.trim()) {
      toast.error(TOAST.MEMBERS.PEER_SCORE_EVALUATEE_REQUIRED);
      return;
    }
    if (!scorerName.trim()) {
      toast.error(TOAST.MEMBERS.PEER_SCORE_EVALUATOR_REQUIRED);
      return;
    }
    if (!sessionDate) {
      toast.error(TOAST.MEMBERS.PEER_SCORE_DATE_REQUIRED);
      return;
    }
    onSubmit({
      targetName: targetName.trim(),
      scorerName: scorerName.trim(),
      scores,
      comment: comment.trim(),
      sessionDate,
    });
    handleReset();
    onOpenChange(false);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">피어 점수 입력</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">평가 대상자</Label>
              <Input
                className="h-7 text-xs"
                placeholder="이름"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">평가자</Label>
              <Input
                className="h-7 text-xs"
                placeholder="이름"
                value={scorerName}
                onChange={(e) => setScorerName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">세션 날짜</Label>
            <Input
              type="date"
              className="h-7 text-xs"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>

          {/* 항목별 슬라이더 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              항목별 평가 (1-5점)
            </p>
            {PEER_SCORE_DIMENSIONS.map((dim) => (
              <div key={dim} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{PEER_SCORE_DIMENSION_LABELS[dim]}</Label>
                  <span className="text-xs font-semibold tabular-nums text-indigo-600">
                    {scores[dim]}점
                  </span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[scores[dim]]}
                  onValueChange={(val) =>
                    setScores((prev) => ({ ...prev, [dim]: val[0] }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between px-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`text-[9px] tabular-nums ${
                        scores[dim] === n
                          ? "text-indigo-600 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 코멘트 */}
          <div className="space-y-1">
            <Label className="text-xs">코멘트 (선택)</Label>
            <Textarea
              className="text-xs min-h-[60px] resize-none"
              placeholder="간단한 피드백을 남겨주세요"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export function PeerScoringCard({ groupId }: PeerScoringCardProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>("all");

  const {
    addScore,
    deleteScore,
    getAllSummaries,
    getBySession,
    totalEntries,
    uniqueMembers,
    overallAvg,
    sessionDates,
  } = usePeerScoring(groupId);

  const summaries = getAllSummaries();
  const filteredEntries =
    selectedSession === "all" ? [] : getBySession(selectedSession);

  // 점수 입력 제출 처리
  const handleSubmit = (data: {
    targetName: string;
    scorerName: string;
    scores: Record<PeerScoreDimension, number>;
    comment: string;
    sessionDate: string;
  }) => {
    let success = true;
    // 항목별로 각각 저장
    for (const dim of PEER_SCORE_DIMENSIONS) {
      const ok = addScore({
        targetName: data.targetName,
        scorerName: data.scorerName,
        dimension: dim,
        score: data.scores[dim],
        comment: data.comment,
        sessionDate: data.sessionDate,
      });
      if (!ok) success = false;
    }
    if (success) {
      toast.success(`${data.targetName}님 피어 점수가 저장되었습니다.`);
    } else {
      toast.error(TOAST.MEMBERS.PEER_FEEDBACK_PARTIAL_ERROR);
    }
  };

  const handleDelete = (id: string) => {
    const ok = deleteScore(id);
    if (ok) {
      toast.success(TOAST.MEMBERS.PEER_SCORE_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="border border-border rounded-lg bg-card">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-lg"
            >
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">연습 피어 점수</span>
                {totalEntries > 0 && (
                  <span className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 rounded-full">
                    {totalEntries}건
                  </span>
                )}
                {overallAvg > 0 && (
                  <span className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 rounded-full">
                    평균 {overallAvg}점
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
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              {/* 통계 요약 */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">총 평가</p>
                  <p className="text-sm font-semibold tabular-nums">{totalEntries}</p>
                </div>
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">멤버 수</p>
                  <p className="text-sm font-semibold tabular-nums">{uniqueMembers}</p>
                </div>
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">전체 평균</p>
                  <p className="text-sm font-semibold tabular-nums text-indigo-600">
                    {overallAvg > 0 ? overallAvg : "-"}
                  </p>
                </div>
              </div>

              {/* 점수 추가 버튼 */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                피어 점수 추가
              </Button>

              {/* 세션 필터 */}
              {sessionDates.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                  <button
                    type="button"
                    className={`text-[10px] px-1.5 py-0 rounded-full border transition-colors ${
                      selectedSession === "all"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                        : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedSession("all")}
                  >
                    전체
                  </button>
                  {sessionDates.slice(0, 6).map((date) => (
                    <button
                      key={date}
                      type="button"
                      className={`text-[10px] px-1.5 py-0 rounded-full border transition-colors ${
                        selectedSession === date
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedSession(date)}
                    >
                      {date.slice(5)} {/* MM-DD */}
                    </button>
                  ))}
                </div>
              )}

              {/* 멤버별 랭킹 테이블 */}
              {summaries.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    멤버 랭킹
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1 pr-2 font-medium text-muted-foreground w-5">
                            #
                          </th>
                          <th className="text-left py-1 pr-2 font-medium text-muted-foreground">
                            이름
                          </th>
                          <th className="text-center py-1 pr-2 font-medium text-muted-foreground">
                            종합
                          </th>
                          {PEER_SCORE_DIMENSIONS.map((dim) => (
                            <th
                              key={dim}
                              className="text-center py-1 pr-1 font-medium text-muted-foreground"
                              title={PEER_SCORE_DIMENSION_LABELS[dim]}
                            >
                              {PEER_SCORE_DIMENSION_LABELS[dim].slice(0, 2)}
                            </th>
                          ))}
                          <th className="text-center py-1 font-medium text-muted-foreground w-8">
                            차트
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaries.map((s, idx) => (
                          <tr
                            key={s.targetName}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-1.5 pr-2 text-muted-foreground tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 pr-2 font-medium truncate max-w-[60px]">
                              {s.targetName}
                            </td>
                            <td className="py-1.5 pr-2 text-center">
                              <span className="font-semibold tabular-nums text-indigo-600">
                                {s.avgScore}
                              </span>
                            </td>
                            {PEER_SCORE_DIMENSIONS.map((dim) => (
                              <td key={dim} className="py-1.5 pr-1 text-center tabular-nums">
                                {s.dimensionAvgs[dim] > 0
                                  ? s.dimensionAvgs[dim]
                                  : "-"}
                              </td>
                            ))}
                            <td className="py-1.5 text-center">
                              <div className="flex justify-center">
                                <MiniRadar scores={s.dimensionAvgs} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  아직 피어 점수가 없습니다. 첫 평가를 추가해보세요.
                </p>
              )}

              {/* 세션별 상세 목록 */}
              {selectedSession !== "all" && filteredEntries.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {selectedSession} 세션 상세
                  </p>
                  <ul className="space-y-1">
                    {filteredEntries.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between text-[10px] py-1 border-b border-border/50 last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium truncate">{e.targetName}</span>
                          <span className="text-muted-foreground shrink-0">
                            ({PEER_SCORE_DIMENSION_LABELS[e.dimension]})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StarRating score={e.score} />
                          <span className="tabular-nums font-semibold text-indigo-600">
                            {e.score}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(e.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                            aria-label="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <ScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
