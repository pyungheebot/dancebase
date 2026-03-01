"use client";

/**
 * 연습 파트너 매칭 카드 (메인)
 *
 * - 멤버 등록/삭제
 * - 랜덤/수동 매칭
 * - 활성 매칭 해제 및 파트너 평가
 * - 매칭 이력 확인
 *
 * 서브컴포넌트 파일:
 *   practice-partner-types.ts        - 공유 타입/상수
 *   practice-partner-star-rating.tsx - 별점 컴포넌트
 *   practice-partner-dialogs.tsx     - 다이얼로그 3종 (멤버등록/수동매칭/평가)
 *   practice-partner-rows.tsx        - ActiveMatchRow, HistoryMatchRow (React.memo)
 *   practice-partner-sections.tsx    - 카드 내부 섹션 컴포넌트 6종
 */

import { useState } from "react";
import {
  Users,
  ChevronDown,
  ChevronUp,
  Plus,
  Shuffle,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { usePracticePartner } from "@/hooks/use-practice-partner";
import {
  AddMemberDialog,
  ManualMatchDialog,
  RatingDialog,
} from "./practice-partner-dialogs";
import {
  EmptyState,
  MemberList,
  MatchTabNav,
  CurrentMatchTab,
  HistoryTab,
  SummaryFooter,
} from "./practice-partner-sections";
import type { RatingState } from "./practice-partner-types";

// ============================================
// Props 타입
// ============================================

interface PracticePartnerCardProps {
  groupId: string;
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

export function PracticePartnerCard({ groupId }: PracticePartnerCardProps) {
  const {
    members,
    activeMatches,
    endedMatches,
    unmatchedMembers,
    addMember,
    removeMember,
    createMatch,
    endMatch,
    randomMatch,
    ratePartner,
  } = usePracticePartner(groupId);

  // 카드 접힘/펼침 상태
  const [open, setOpen] = useState(true);
  // 탭 상태 (현재 매칭 / 이력)
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  // 다이얼로그 표시 상태
  const [showAddMember, setShowAddMember] = useState(false);
  const [showManualMatch, setShowManualMatch] = useState(false);
  // 평가 다이얼로그 상태 (null이면 닫힘)
  const [ratingState, setRatingState] = useState<RatingState | null>(null);

  // 멤버 ID → 멤버 객체 맵 (ActiveMatchRow에 전달)
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  // ============================================
  // 이벤트 핸들러
  // ============================================

  const handleRandomMatch = () => {
    if (unmatchedMembers.length < 2) {
      toast.error(TOAST.PRACTICE_PARTNER.MIN_MEMBERS);
      return;
    }
    randomMatch();
    toast.success(TOAST.PRACTICE_PARTNER.RANDOM_MATCHED);
  };

  const handleEndMatch = (matchId: string) => {
    endMatch(matchId);
    toast.success(TOAST.PRACTICE_PARTNER.MATCH_RELEASED);
  };

  const handleRemoveMember = (id: string) => {
    removeMember(id);
    toast.success(TOAST.PRACTICE_PARTNER.MEMBER_DELETED);
  };

  const openRating = (
    matchId: string,
    raterId: string,
    raterName: string,
    targetName: string
  ) => {
    setRatingState({ matchId, raterId, raterName, targetName });
  };

  const handleRate = (rating: number, note?: string) => {
    if (!ratingState) return;
    ratePartner(ratingState.matchId, ratingState.raterId, rating, note);
  };

  // ============================================
  // 렌더링
  // ============================================

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div
          className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5"
          aria-label="연습 파트너 매칭 카드 헤더"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-pink-500" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-800">
              연습 파트너 매칭
            </span>
            {activeMatches.length > 0 && (
              <Badge
                className="bg-pink-100 text-[10px] px-1.5 py-0 text-pink-600 hover:bg-pink-100"
                aria-label={`활성 매칭 ${activeMatches.length}쌍`}
              >
                {activeMatches.length}쌍
              </Badge>
            )}
            {unmatchedMembers.length > 0 && (
              <Badge
                className="bg-gray-100 text-[10px] px-1.5 py-0 text-gray-500 hover:bg-gray-100"
                aria-label={`미매칭 ${unmatchedMembers.length}명`}
              >
                미매칭 {unmatchedMembers.length}명
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {open && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] px-2 gap-0.5"
                  onClick={() => setShowAddMember(true)}
                  aria-label="멤버 등록"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  멤버 등록
                </Button>
                {unmatchedMembers.length >= 2 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-0.5"
                      onClick={handleRandomMatch}
                      aria-label="랜덤 매칭"
                    >
                      <Shuffle className="h-3 w-3" aria-hidden="true" />
                      랜덤 매칭
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] px-2 gap-0.5"
                      onClick={() => setShowManualMatch(true)}
                      aria-label="수동 매칭"
                    >
                      <Link2 className="h-3 w-3" aria-hidden="true" />
                      수동 매칭
                    </Button>
                  </>
                )}
              </>
            )}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label={open ? "카드 접기" : "카드 펼치기"}
              >
                {open ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent>
          <div className="rounded-b-lg border border-gray-200 bg-card p-4">
            {members.length === 0 ? (
              <EmptyState onAdd={() => setShowAddMember(true)} />
            ) : (
              <>
                <MemberList members={members} onRemove={handleRemoveMember} />

                <MatchTabNav
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  activeCount={activeMatches.length}
                  historyCount={endedMatches.length}
                />

                {activeTab === "current" && (
                  <CurrentMatchTab
                    activeMatches={activeMatches}
                    unmatchedMembers={unmatchedMembers}
                    memberMap={memberMap}
                    onEnd={handleEndMatch}
                    onRateA={(match) =>
                      openRating(
                        match.id,
                        match.memberAId,
                        match.memberAName,
                        match.memberBName
                      )
                    }
                    onRateB={(match) =>
                      openRating(
                        match.id,
                        match.memberBId,
                        match.memberBName,
                        match.memberAName
                      )
                    }
                    onRandomMatch={handleRandomMatch}
                  />
                )}

                {activeTab === "history" && (
                  <HistoryTab endedMatches={endedMatches} />
                )}

                <SummaryFooter
                  memberCount={members.length}
                  activeCount={activeMatches.length}
                  endedCount={endedMatches.length}
                />
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 다이얼로그 */}
      <AddMemberDialog
        open={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={addMember}
      />
      <ManualMatchDialog
        open={showManualMatch}
        onClose={() => setShowManualMatch(false)}
        unmatched={unmatchedMembers}
        onMatch={createMatch}
      />
      <RatingDialog
        open={!!ratingState}
        onClose={() => setRatingState(null)}
        match={
          ratingState
            ? (activeMatches.find((m) => m.id === ratingState.matchId) ?? null)
            : null
        }
        raterId={ratingState?.raterId ?? ""}
        raterName={ratingState?.raterName ?? ""}
        targetName={ratingState?.targetName ?? ""}
        onRate={handleRate}
      />
    </>
  );
}
