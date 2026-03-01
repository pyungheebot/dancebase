"use client";

/**
 * 연습 파트너 매칭 카드 - 섹션 컴포넌트
 *
 * - EmptyState: 멤버 없을 때 빈 상태
 * - MemberList: 등록 멤버 목록
 * - MatchTabNav: 현재 매칭 / 이력 탭 내비게이션
 * - CurrentMatchTab: 현재 매칭 탭 컨텐츠
 * - HistoryTab: 매칭 이력 탭 컨텐츠
 * - SummaryFooter: 하단 현황 요약
 */

import { Users, Plus, Link2, Shuffle, Clock, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_COLORS,
} from "@/hooks/use-practice-partner";
import { ActiveMatchRow, HistoryMatchRow } from "./practice-partner-rows";
import type {
  PracticePartnerMember,
  PracticePartnerMatch,
} from "./practice-partner-types";

// ============================================
// 빈 상태 컴포넌트
// ============================================

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="py-6 flex flex-col items-center gap-2 text-muted-foreground"
      role="status"
      aria-label="등록된 멤버 없음"
    >
      <Users className="h-8 w-8 opacity-30" aria-hidden="true" />
      <p className="text-xs">아직 등록된 멤버가 없습니다.</p>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
        멤버 등록
      </Button>
    </div>
  );
}

// ============================================
// 등록 멤버 목록 컴포넌트
// ============================================

export function MemberList({
  members,
  onRemove,
}: {
  members: PracticePartnerMember[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
        등록 멤버 ({members.length}명)
      </p>
      <div
        className="flex flex-wrap gap-1.5"
        role="list"
        aria-label="등록된 멤버 목록"
      >
        {members.map((m) => (
          <div
            key={m.id}
            role="listitem"
            className="flex items-center gap-1.5 rounded border bg-muted/30 px-2 py-1 group"
            aria-label={`${m.name}, ${SKILL_LEVEL_LABELS[m.skillLevel]}`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium leading-none">{m.name}</span>
              <span
                className={`text-[9px] rounded border px-1 py-0 inline-block ${SKILL_LEVEL_COLORS[m.skillLevel]}`}
              >
                {SKILL_LEVEL_LABELS[m.skillLevel]}
              </span>
            </div>
            {/* 매칭 중 배지 */}
            {m.currentMatchId && (
              <Badge className="text-[9px] px-1 py-0 bg-green-100 text-green-600 hover:bg-green-100">
                매칭중
              </Badge>
            )}
            {/* 가능 시간 미리보기 */}
            {m.availableTimes.length > 0 && (
              <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                <span>{m.availableTimes.slice(0, 2).join(", ")}</span>
                {m.availableTimes.length > 2 && (
                  <span>+{m.availableTimes.length - 2}</span>
                )}
              </div>
            )}
            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={() => onRemove(m.id)}
              className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ml-1"
              aria-label={`${m.name} 멤버 삭제`}
              title="멤버 삭제"
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 탭 내비게이션 컴포넌트
// ============================================

export function MatchTabNav({
  activeTab,
  onTabChange,
  activeCount,
  historyCount,
}: {
  activeTab: "current" | "history";
  onTabChange: (tab: "current" | "history") => void;
  activeCount: number;
  historyCount: number;
}) {
  return (
    <div className="flex gap-1 mb-3" role="tablist" aria-label="매칭 탭">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "current"}
        onClick={() => onTabChange("current")}
        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
          activeTab === "current"
            ? "bg-pink-100 text-pink-700 border-pink-300 font-medium"
            : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
        }`}
      >
        <Link2 className="h-3 w-3" aria-hidden="true" />
        현재 매칭
        {activeCount > 0 && (
          <span className="text-[10px] opacity-70">({activeCount})</span>
        )}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "history"}
        onClick={() => onTabChange("history")}
        className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
          activeTab === "history"
            ? "bg-gray-200 text-gray-700 border-gray-400 font-medium"
            : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:bg-muted"
        }`}
      >
        <History className="h-3 w-3" aria-hidden="true" />
        매칭 이력
        {historyCount > 0 && (
          <span className="text-[10px] opacity-70">({historyCount})</span>
        )}
      </button>
    </div>
  );
}

// ============================================
// 현재 매칭 탭 컨텐츠
// ============================================

export function CurrentMatchTab({
  activeMatches,
  unmatchedMembers,
  memberMap,
  onEnd,
  onRateA,
  onRateB,
  onRandomMatch,
}: {
  activeMatches: PracticePartnerMatch[];
  unmatchedMembers: PracticePartnerMember[];
  memberMap: Record<string, PracticePartnerMember>;
  onEnd: (matchId: string) => void;
  onRateA: (match: PracticePartnerMatch) => void;
  onRateB: (match: PracticePartnerMatch) => void;
  onRandomMatch: () => void;
}) {
  return (
    <>
      {activeMatches.length === 0 ? (
        /* 매칭 없음 안내 */
        <div
          className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground"
          role="status"
          aria-label="활성 매칭 없음"
        >
          <Link2 className="h-7 w-7 opacity-30" aria-hidden="true" />
          <p className="text-xs">현재 활성 매칭이 없습니다.</p>
          {unmatchedMembers.length >= 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onRandomMatch}
            >
              <Shuffle className="h-3 w-3" aria-hidden="true" />
              랜덤 매칭 시작
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5" role="list" aria-label="현재 매칭 목록">
          {activeMatches.map((match) => (
            <ActiveMatchRow
              key={match.id}
              match={match}
              memberA={memberMap[match.memberAId]}
              memberB={memberMap[match.memberBId]}
              onEnd={() => onEnd(match.id)}
              onRateA={() => onRateA(match)}
              onRateB={() => onRateB(match)}
            />
          ))}
        </div>
      )}

      {/* 미매칭 멤버 알림 */}
      {unmatchedMembers.length > 0 && (
        <div
          className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-muted-foreground flex items-center gap-1"
          aria-label={`미매칭 멤버 ${unmatchedMembers.length}명`}
        >
          <span>미매칭:</span>
          {unmatchedMembers.map((m, i) => (
            <span key={m.id}>
              <span className="font-medium text-foreground">{m.name}</span>
              {i < unmatchedMembers.length - 1 ? ", " : ""}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// ============================================
// 매칭 이력 탭 컨텐츠
// ============================================

export function HistoryTab({
  endedMatches,
}: {
  endedMatches: PracticePartnerMatch[];
}) {
  return endedMatches.length === 0 ? (
    <div
      className="py-5 flex flex-col items-center gap-1.5 text-muted-foreground"
      role="status"
      aria-label="매칭 이력 없음"
    >
      <History className="h-7 w-7 opacity-30" aria-hidden="true" />
      <p className="text-xs">매칭 이력이 없습니다.</p>
    </div>
  ) : (
    <div className="space-y-1" role="list" aria-label="매칭 이력 목록">
      {[...endedMatches]
        .sort(
          (a, b) =>
            new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime()
        )
        .map((match) => (
          <HistoryMatchRow key={match.id} match={match} />
        ))}
    </div>
  );
}

// ============================================
// 하단 요약 컴포넌트
// ============================================

export function SummaryFooter({
  memberCount,
  activeCount,
  endedCount,
}: {
  memberCount: number;
  activeCount: number;
  endedCount: number;
}) {
  return (
    <div
      className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[10px] text-muted-foreground"
      aria-label="매칭 현황 요약"
    >
      <span>
        멤버 <strong className="text-foreground">{memberCount}</strong>명
      </span>
      <span>
        현재 매칭 <strong className="text-foreground">{activeCount}</strong>쌍
      </span>
      {endedCount > 0 && (
        <span>
          종료된 매칭 <strong className="text-foreground">{endedCount}</strong>건
        </span>
      )}
    </div>
  );
}
