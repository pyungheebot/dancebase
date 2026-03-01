"use client";

/**
 * 그룹 연습 평가표 - 세션 상세 패널 및 세션 목록 아이템
 *
 * - MemberResultItem: 멤버 평가 결과 행 (React.memo)
 * - SessionDetailPanel: 세션 내 기준 관리 + 멤버 평가표
 * - SessionListItem: 세션 목록의 개별 행 (React.memo)
 */

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  TrendingUp,
  X,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { PracticeEvalScore, PracticeEvalSession } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import {
  type MemberTrendPoint,
  scoreTextColor,
  scoreBarColor,
  calcMaxTotal,
} from "./practice-evaluation-types";
import { MemberTrendChart } from "./practice-evaluation-stats";
import { MemberEvalDialog } from "./practice-evaluation-dialogs";

// ─── 멤버 결과 아이템 ─────────────────────────────────────────

interface MemberResultItemProps {
  result: PracticeEvalSession["results"][number];
  rank: number;
  maxTotal: number;
  criteria: PracticeEvalSession["criteria"];
  trend: MemberTrendPoint[];
  onDelete: (memberName: string) => void;
}

export const MemberResultItem = React.memo(function MemberResultItem({
  result,
  rank,
  maxTotal,
  criteria,
  trend,
  onDelete,
}: MemberResultItemProps) {
  const [isTrendOpen, setIsTrendOpen] = useState(false);
  const ratio = maxTotal > 0 ? result.totalScore / maxTotal : 0;

  const rankLabel =
    rank === 0
      ? { label: "1위", cls: "text-yellow-500" }
      : rank === 1
      ? { label: "2위", cls: "text-gray-400" }
      : rank === 2
      ? { label: "3위", cls: "text-orange-400" }
      : { label: `${rank + 1}위`, cls: "text-gray-300" };

  const trendButtonLabel = isTrendOpen
    ? `${result.memberName} 성장 추이 닫기`
    : `${result.memberName} 성장 추이 보기`;

  return (
    <article
      aria-label={`${result.memberName} 평가 결과`}
      className="border border-gray-100 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        {/* 순위 */}
        <span className={`text-[10px] font-bold ${rankLabel.cls}`} aria-label={rankLabel.label}>
          {rankLabel.label}
        </span>

        <span className="text-xs font-medium text-gray-700 flex-1">
          {result.memberName}
        </span>

        <span
          className={`text-xs font-bold ${scoreTextColor(ratio)}`}
          aria-label={`총점 ${result.totalScore}점 (최대 ${maxTotal}점)`}
        >
          {result.totalScore}
          <span className="text-[10px] font-normal text-gray-400">
            /{maxTotal}
          </span>
        </span>

        {/* 성장 추이 토글 */}
        <button
          type="button"
          onClick={() => setIsTrendOpen((v) => !v)}
          className="text-gray-300 hover:text-indigo-400 transition-colors"
          aria-label={trendButtonLabel}
          aria-expanded={isTrendOpen}
          aria-controls={`trend-${result.memberName}`}
        >
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(result.memberName)}
          className="text-gray-300 hover:text-red-400 transition-colors"
          aria-label={`${result.memberName} 평가 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>

      {/* 총점 바 */}
      <div
        className="w-full bg-gray-100 rounded-full h-1.5"
        role="progressbar"
        aria-valuenow={result.totalScore}
        aria-valuemin={0}
        aria-valuemax={maxTotal}
        aria-label={`${result.memberName} 점수`}
      >
        <div
          className={`h-1.5 rounded-full ${scoreBarColor(ratio)} transition-all`}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      {/* 기준별 점수 */}
      <ul role="list" className="flex flex-wrap gap-1" aria-label="기준별 점수">
        {criteria.map((cr) => {
          const sc = result.scores.find((s) => s.criteriaId === cr.id);
          const crRatio = cr.maxScore > 0 ? (sc?.score ?? 0) / cr.maxScore : 0;
          return (
            <li
              key={cr.id}
              role="listitem"
              className="text-[10px] bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5"
              title={sc?.comment}
              aria-label={`${cr.name}: ${sc?.score ?? 0}점 (최대 ${cr.maxScore}점)${sc?.comment ? ` - ${sc.comment}` : ""}`}
            >
              <span className="text-gray-500">{cr.name}</span>{" "}
              <span className={`font-medium ${scoreTextColor(crRatio)}`}>
                {sc?.score ?? 0}
              </span>
              <span className="text-gray-300">/{cr.maxScore}</span>
            </li>
          );
        })}
      </ul>

      {/* 피드백 */}
      {result.feedback && (
        <p className="text-[10px] text-gray-500 bg-indigo-50 rounded px-2 py-1">
          {result.feedback}
        </p>
      )}

      {/* 성장 추이 */}
      <div
        id={`trend-${result.memberName}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {isTrendOpen && (
          <div className="pt-1">
            <p className="text-[10px] text-gray-400 mb-1">최근 5회 점수 추이</p>
            <MemberTrendChart trend={trend} maxPossible={maxTotal} />
          </div>
        )}
      </div>
    </article>
  );
});

// ─── 세션 상세 패널 ───────────────────────────────────────────

interface SessionDetailPanelProps {
  session: PracticeEvalSession;
  memberNames: string[];
  onSaveMember: (
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ) => boolean;
  onDeleteMember: (sessionId: string, memberName: string) => boolean;
  onAddCriteria: (
    sessionId: string,
    criteria: { name: string; maxScore: number }
  ) => boolean;
  onDeleteCriteria: (sessionId: string, criteriaId: string) => boolean;
  getMemberTrend: (memberName: string) => MemberTrendPoint[];
}

export function SessionDetailPanel({
  session,
  memberNames,
  onSaveMember,
  onDeleteMember,
  onAddCriteria,
  onDeleteCriteria,
  getMemberTrend,
}: SessionDetailPanelProps) {
  const [newCriteriaName, setNewCriteriaName] = useState("");
  const [newCriteriaMax, setNewCriteriaMax] = useState(10);

  const maxTotal = calcMaxTotal(session.criteria);

  function handleAddCriteria() {
    if (!newCriteriaName.trim()) return;
    const ok = onAddCriteria(session.id, {
      name: newCriteriaName.trim(),
      maxScore: newCriteriaMax,
    });
    if (ok) {
      setNewCriteriaName("");
      setNewCriteriaMax(10);
    }
  }

  const sortedResults = [...session.results].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  return (
    <div className="space-y-4 pt-2">
      {/* 기준 관리 */}
      <section aria-label="평가 기준 관리" className="bg-gray-50 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-gray-600">평가 기준 관리</p>
        <ul role="list" className="flex flex-wrap gap-1" aria-label="등록된 평가 기준">
          {session.criteria.map((cr) => (
            <li
              key={cr.id}
              role="listitem"
              className="flex items-center gap-1 bg-card border border-gray-200 rounded px-2 py-0.5"
            >
              <span className="text-[10px] text-gray-600">{cr.name}</span>
              <span className="text-[10px] text-gray-400">/{cr.maxScore}점</span>
              <button
                type="button"
                onClick={() => onDeleteCriteria(session.id, cr.id)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-0.5"
                aria-label={`${cr.name} 기준 삭제`}
              >
                <X className="h-2.5 w-2.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1" role="group" aria-label="새 기준 추가">
          <Input
            id={`new-criteria-${session.id}`}
            value={newCriteriaName}
            onChange={(e) => setNewCriteriaName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCriteria()}
            placeholder="새 기준명"
            className="text-[10px] h-6 flex-1"
            aria-label="새 기준 이름"
          />
          <Input
            type="number"
            value={newCriteriaMax}
            onChange={(e) => setNewCriteriaMax(Math.max(1, Number(e.target.value)))}
            min={1}
            className="text-[10px] h-6 w-16"
            aria-label="최대 점수"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 text-[10px] px-2"
            onClick={handleAddCriteria}
            aria-label="기준 추가"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* 멤버 평가표 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">
          멤버별 평가표{" "}
          <span className="text-gray-400 font-normal">
            ({session.results.length}명)
          </span>
        </p>
        <MemberEvalDialog
          session={session}
          memberNames={memberNames}
          onSave={onSaveMember}
        />
      </div>

      {/* 멤버 결과 목록 */}
      {sortedResults.length === 0 ? (
        <p
          className="text-xs text-gray-400 text-center py-3"
          role="status"
          aria-live="polite"
        >
          아직 평가된 멤버가 없습니다.
        </p>
      ) : (
        <ul
          role="list"
          className="space-y-2"
          aria-label="멤버 평가 결과 순위"
          aria-live="polite"
        >
          {sortedResults.map((result, rank) => (
            <li key={result.memberName} role="listitem">
              <MemberResultItem
                result={result}
                rank={rank}
                maxTotal={maxTotal}
                criteria={session.criteria}
                trend={getMemberTrend(result.memberName)}
                onDelete={(name) => onDeleteMember(session.id, name)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* 세션 메모 */}
      {session.notes && (
        <div className="bg-yellow-50 border border-yellow-100 rounded p-2" role="note">
          <p className="text-[10px] text-yellow-700">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

// ─── 세션 목록 아이템 ─────────────────────────────────────────

interface SessionListItemProps {
  session: PracticeEvalSession;
  isExpanded: boolean;
  memberNames: string[];
  onToggle: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onSaveMember: (
    sessionId: string,
    memberName: string,
    scores: PracticeEvalScore[],
    feedback?: string
  ) => boolean;
  onDeleteMember: (sessionId: string, memberName: string) => boolean;
  onAddCriteria: (
    sessionId: string,
    criteria: { name: string; maxScore: number }
  ) => boolean;
  onDeleteCriteria: (sessionId: string, criteriaId: string) => boolean;
  getMemberTrend: (memberName: string) => MemberTrendPoint[];
}

export const SessionListItem = React.memo(function SessionListItem({
  session,
  isExpanded,
  memberNames,
  onToggle,
  onDelete,
  onSaveMember,
  onDeleteMember,
  onAddCriteria,
  onDeleteCriteria,
  getMemberTrend,
}: SessionListItemProps) {
  const maxTotal = calcMaxTotal(session.criteria);
  const avgScore =
    session.results.length > 0
      ? Math.round(
          session.results.reduce((s, r) => s + r.totalScore, 0) /
            session.results.length
        )
      : null;

  const panelId = `session-panel-${session.id}`;

  return (
    <article
      className="border border-gray-100 rounded-lg overflow-hidden"
      aria-label={`평가 세션: ${session.title}`}
    >
      {/* 세션 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors text-left"
        onClick={() => onToggle(session.id)}
        aria-expanded={isExpanded}
        aria-controls={panelId}
      >
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 min-w-0">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="shrink-0">{formatYearMonthDay(session.date)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">
            {session.title}
          </p>
          <p className="text-[10px] text-gray-400">평가자: {session.evaluator}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {avgScore !== null && (
            <Badge className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-50">
              평균 {avgScore}/{maxTotal}
            </Badge>
          )}
          <div
            className="flex items-center gap-1 text-[10px] text-gray-400"
            aria-label={`${session.results.length}명 평가`}
          >
            <Users className="h-3 w-3" aria-hidden="true" />
            {session.results.length}명
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="text-gray-200 hover:text-red-400 transition-colors"
            aria-label={`${session.title} 세션 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* 세션 상세 패널 */}
      <div
        id={panelId}
        role="region"
        aria-label={`${session.title} 상세`}
        hidden={!isExpanded}
      >
        {isExpanded && (
          <div className="border-t border-gray-100 px-3 pb-3">
            <SessionDetailPanel
              session={session}
              memberNames={memberNames}
              onSaveMember={onSaveMember}
              onDeleteMember={onDeleteMember}
              onAddCriteria={onAddCriteria}
              onDeleteCriteria={onDeleteCriteria}
              getMemberTrend={getMemberTrend}
            />
          </div>
        )}
      </div>
    </article>
  );
});
