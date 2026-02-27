"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Handshake,
  Award,
  MessageCircle,
  Clock,
  Share2,
  TrendingUp,
  Heart,
  ChevronDown,
  ChevronUp,
  Send,
  EyeOff,
  Eye,
  Star,
} from "lucide-react";
import {
  useCollaborationEffectiveness,
  COLLAB_DIMENSIONS,
  COLLAB_DIMENSION_LABEL,
} from "@/hooks/use-collaboration-effectiveness";
import type { CollabDimension } from "@/types";

// ============================================
// 상수 / 헬퍼
// ============================================

const DIMENSION_ICONS: Record<CollabDimension, React.ElementType> = {
  communication: MessageCircle,
  punctuality: Clock,
  contribution: TrendingUp,
  attitude: Heart,
  skillSharing: Share2,
};

const DIMENSION_COLORS: Record<CollabDimension, string> = {
  communication: "bg-blue-500",
  punctuality: "bg-green-500",
  contribution: "bg-purple-500",
  attitude: "bg-pink-500",
  skillSharing: "bg-orange-500",
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function ScoreBar({
  score,
  colorClass,
}: {
  score: number;
  colorClass: string;
}) {
  const pct = Math.round((score / 5) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-6 w-6 rounded text-[11px] font-semibold border transition-colors ${
            value >= n
              ? "bg-indigo-500 text-white border-indigo-500"
              : "bg-white text-muted-foreground border-border hover:border-indigo-300"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// ============================================
// Props
// ============================================

interface CollaborationEffectivenessCardProps {
  groupId: string;
  /** 그룹 내 멤버 목록 { id, name } */
  members: { id: string; name: string }[];
  /** 현재 로그인 유저 */
  currentUser: { id: string; name: string };
}

// ============================================
// 컴포넌트
// ============================================

export function CollaborationEffectivenessCard({
  groupId,
  members,
  currentUser,
}: CollaborationEffectivenessCardProps) {
  const {
    evaluations,
    summaries,
    getReceivedEvaluations,
    addEvaluation,
    loading,
  } = useCollaborationEffectiveness(groupId);

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"evaluate" | "ranking" | "myReceived">("ranking");

  // 폼 상태
  const [targetId, setTargetId] = useState("");
  const [scores, setScores] = useState<Record<CollabDimension, number>>(
    Object.fromEntries(COLLAB_DIMENSIONS.map((d) => [d, 3])) as Record<CollabDimension, number>
  );
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 대상 멤버 목록 (자기 자신 제외)
  const targetMembers = members.filter((m) => m.id !== currentUser.id);

  const selectedTarget = members.find((m) => m.id === targetId);

  function resetForm() {
    setTargetId("");
    setScores(
      Object.fromEntries(COLLAB_DIMENSIONS.map((d) => [d, 3])) as Record<CollabDimension, number>
    );
    setComment("");
    setIsAnonymous(false);
  }

  function handleSubmit() {
    if (!targetId) {
      toast.error("평가할 동료를 선택해주세요.");
      return;
    }
    const hasAllScores = COLLAB_DIMENSIONS.every((d) => scores[d] >= 1 && scores[d] <= 5);
    if (!hasAllScores) {
      toast.error("모든 항목에 점수를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      addEvaluation({
        evaluatorId: currentUser.id,
        targetId,
        targetName: selectedTarget?.name ?? "",
        scores,
        comment: comment.trim(),
        isAnonymous,
      });
      toast.success(`${selectedTarget?.name}님에 대한 평가가 저장되었습니다.`);
      resetForm();
      setActiveTab("ranking");
    } catch {
      toast.error("평가 저장 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // 내가 받은 평가
  const myReceivedEvaluations = getReceivedEvaluations(currentUser.id);
  const myReceivedSummary = summaries.find((s) => s.targetId === currentUser.id) ?? null;

  const totalEvaluations = evaluations.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Handshake className="h-4 w-4 text-indigo-500" />
              <span>동료 협력도 평가</span>
              {totalEvaluations > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200">
                  {totalEvaluations}건
                </Badge>
              )}
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* 탭 네비게이션 */}
            <div className="flex gap-1 border-b pb-2">
              {(
                [
                  { key: "ranking", label: "협력도 랭킹" },
                  { key: "evaluate", label: "평가하기" },
                  { key: "myReceived", label: "내가 받은 평가" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    activeTab === key
                      ? "bg-indigo-500 text-white"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ── 탭: 평가하기 ── */}
            {activeTab === "evaluate" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 p-3 space-y-3">
                  {/* 대상 선택 */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      평가 대상
                    </label>
                    <Select value={targetId} onValueChange={setTargetId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="동료를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 5가지 dimension 점수 */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      항목별 점수 (1-5)
                    </label>
                    {COLLAB_DIMENSIONS.map((dim) => {
                      const Icon = DIMENSION_ICONS[dim];
                      return (
                        <div key={dim} className="flex items-center gap-2">
                          <div className="flex items-center gap-1 w-24 shrink-0">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-foreground">
                              {COLLAB_DIMENSION_LABEL[dim]}
                            </span>
                          </div>
                          <ScoreSelector
                            value={scores[dim]}
                            onChange={(v) =>
                              setScores((prev) => ({ ...prev, [dim]: v }))
                            }
                          />
                          <span className="text-[11px] font-semibold text-indigo-600 w-4 text-right">
                            {scores[dim]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 코멘트 */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      코멘트 (선택)
                    </label>
                    <Input
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 100))}
                      placeholder="간단한 코멘트를 남겨주세요. (최대 100자)"
                      className="h-8 text-xs"
                    />
                    <p className="text-right text-[10px] text-muted-foreground">
                      {comment.length}/100
                    </p>
                  </div>

                  {/* 익명 체크박스 */}
                  <button
                    type="button"
                    onClick={() => setIsAnonymous((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isAnonymous ? (
                      <EyeOff className="h-3.5 w-3.5 text-indigo-500" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    <span className={isAnonymous ? "text-indigo-600 font-medium" : ""}>
                      {isAnonymous ? "익명으로 제출" : "실명으로 제출"}
                    </span>
                  </button>

                  <Button
                    size="sm"
                    className="h-7 text-xs w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                    onClick={handleSubmit}
                    disabled={submitting || !targetId}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    평가 제출
                  </Button>
                </div>
              </div>
            )}

            {/* ── 탭: 협력도 랭킹 ── */}
            {activeTab === "ranking" && (
              <div className="space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : summaries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Handshake className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">아직 평가 데이터가 없어요.</p>
                    <p className="text-[10px] mt-0.5">
                      동료를 평가하면 여기에 결과가 표시됩니다.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* TOP 3 협력왕 */}
                    {summaries.length >= 1 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-yellow-500" />
                          TOP 3 협력왕
                        </p>
                        <div className="flex gap-2">
                          {summaries.slice(0, 3).map((s, idx) => (
                            <div
                              key={s.targetId}
                              className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg border py-2 px-1 ${
                                idx === 0
                                  ? "bg-yellow-50 border-yellow-200"
                                  : idx === 1
                                  ? "bg-gray-50 border-gray-200"
                                  : "bg-orange-50 border-orange-200"
                              }`}
                            >
                              <span className="text-lg">{RANK_MEDALS[idx]}</span>
                              <span className="text-[11px] font-semibold truncate max-w-full px-1 text-center">
                                {s.targetName}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                                <span className="text-[11px] font-bold text-foreground">
                                  {s.overallScore.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-[9px] text-muted-foreground">
                                {s.evaluationCount}명 평가
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* 전체 목록 */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        전체 랭킹
                      </p>
                      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {summaries.map((s, idx) => (
                          <li
                            key={s.targetId}
                            className="rounded-lg border bg-muted/20 p-2.5 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-muted-foreground w-5">
                                  {idx < 3 ? RANK_MEDALS[idx] : `#${idx + 1}`}
                                </span>
                                <span className="text-xs font-semibold">
                                  {s.targetName}
                                </span>
                                <Badge className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-slate-200">
                                  {s.evaluationCount}명
                                </Badge>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <span className="text-xs font-bold text-indigo-600">
                                  {s.overallScore.toFixed(1)}
                                </span>
                              </div>
                            </div>
                            {/* dimension별 바 */}
                            <div className="space-y-1">
                              {COLLAB_DIMENSIONS.map((dim) => (
                                <div key={dim} className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground w-14 shrink-0">
                                    {COLLAB_DIMENSION_LABEL[dim]}
                                  </span>
                                  <div className="flex-1">
                                    <ScoreBar
                                      score={s.averageScores[dim]}
                                      colorClass={DIMENSION_COLORS[dim]}
                                    />
                                  </div>
                                  <span className="text-[10px] font-medium w-5 text-right">
                                    {s.averageScores[dim].toFixed(1)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── 탭: 내가 받은 평가 ── */}
            {activeTab === "myReceived" && (
              <div className="space-y-3">
                {loading ? (
                  <Skeleton className="h-24 w-full rounded-lg" />
                ) : myReceivedEvaluations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Star className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-xs">아직 받은 평가가 없어요.</p>
                    <p className="text-[10px] mt-0.5">
                      동료들이 평가하면 여기에 표시됩니다.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 내 dimension별 평균 요약 */}
                    {myReceivedSummary && (
                      <div className="rounded-lg border bg-indigo-50/50 border-indigo-100 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-indigo-700">
                            나의 협력도 종합
                          </p>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-indigo-700">
                              {myReceivedSummary.overallScore.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              / 5.0
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {COLLAB_DIMENSIONS.map((dim) => {
                            const Icon = DIMENSION_ICONS[dim];
                            return (
                              <div key={dim} className="flex items-center gap-2">
                                <div className="flex items-center gap-1 w-20 shrink-0">
                                  <Icon className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">
                                    {COLLAB_DIMENSION_LABEL[dim]}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <ScoreBar
                                    score={myReceivedSummary.averageScores[dim]}
                                    colorClass={DIMENSION_COLORS[dim]}
                                  />
                                </div>
                                <span className="text-[10px] font-semibold text-indigo-600 w-6 text-right">
                                  {myReceivedSummary.averageScores[dim].toFixed(1)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-right">
                          총 {myReceivedSummary.evaluationCount}명이 평가
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* 개별 평가 목록 */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground">
                        평가 상세 내역
                      </p>
                      <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {myReceivedEvaluations.map((ev) => {
                          const overall =
                            Math.round(
                              (COLLAB_DIMENSIONS.reduce(
                                (sum, d) => sum + ev.scores[d],
                                0
                              ) /
                                COLLAB_DIMENSIONS.length) *
                                10
                            ) / 10;
                          return (
                            <li
                              key={ev.id}
                              className="rounded-lg border bg-muted/20 px-2.5 py-2 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {ev.isAnonymous ? (
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <EyeOff className="h-3 w-3" />
                                      <span>익명</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-medium text-foreground">
                                      {ev.evaluatorId === currentUser.id
                                        ? currentUser.name
                                        : members.find((m) => m.id === ev.evaluatorId)?.name ??
                                          ev.evaluatorId}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-muted-foreground">
                                    {new Date(ev.createdAt).toLocaleDateString(
                                      "ko-KR",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                  <span className="text-xs font-bold text-indigo-600">
                                    {overall.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                              {/* 점수 태그 */}
                              <div className="flex flex-wrap gap-1">
                                {COLLAB_DIMENSIONS.map((dim) => (
                                  <span
                                    key={dim}
                                    className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-white border border-border"
                                  >
                                    {COLLAB_DIMENSION_LABEL[dim]}
                                    <span className="font-semibold text-indigo-600">
                                      {ev.scores[dim]}
                                    </span>
                                  </span>
                                ))}
                              </div>
                              {/* 코멘트 */}
                              {ev.comment && (
                                <p className="text-[11px] text-foreground leading-relaxed pl-0.5">
                                  "{ev.comment}"
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
