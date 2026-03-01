"use client";

import { useState } from "react";
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroupChallengeCard } from "@/hooks/use-group-challenge-card";
import type {
  DanceGroupChallengeCategory,
  DanceGroupChallengeEntry,
} from "@/types";

// 서브컴포넌트
import { CATEGORY_LABELS } from "./group-challenge/types";
import type { ChallengeTab } from "./group-challenge/types";
import { CategoryBarChart } from "./group-challenge/category-bar-chart";
import { ChallengeItem } from "./group-challenge/challenge-item";
import { ChallengeDetailDialog } from "./group-challenge/challenge-detail-dialog";
import { ChallengeFormDialog } from "./group-challenge/challenge-form-dialog";

// ─── 메인 컴포넌트 ───────────────────────────────────────────

export function GroupChallengeCard({ groupId }: { groupId: string }) {
  const {
    activeChallenges,
    upcomingChallenges,
    completedList,
    total,
    completionRate,
    categoryCounts,
    popularCategory,
    loading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    addParticipant,
    updateParticipantStatus,
    removeParticipant,
  } = useGroupChallengeCard(groupId);

  const [isOpen, setIsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DanceGroupChallengeEntry | null>(null);
  const [detailTarget, setDetailTarget] = useState<DanceGroupChallengeEntry | null>(null);
  const [activeTab, setActiveTab] = useState<ChallengeTab>("active");
  const [showChart, setShowChart] = useState(false);

  const tabItems =
    activeTab === "active"
      ? activeChallenges
      : activeTab === "upcoming"
      ? upcomingChallenges
      : completedList;

  const handleEdit = (challenge: DanceGroupChallengeEntry) => {
    setEditTarget(challenge);
  };

  const handleEditSubmit = (values: {
    title: string;
    description: string;
    category: DanceGroupChallengeCategory;
    startDate: string;
    endDate: string;
  }): boolean => {
    if (!editTarget) return false;
    const result = updateChallenge(editTarget.id, values);
    if (result) setEditTarget(null);
    return result;
  };

  const tabListId = "challenge-tabs";

  const emptyMessage =
    activeTab === "active"
      ? "진행 중인 챌린지가 없습니다"
      : activeTab === "upcoming"
      ? "예정된 챌린지가 없습니다"
      : "완료된 챌린지가 없습니다";

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="border rounded-lg bg-card shadow-sm">
          {/* 헤더 */}
          <CollapsibleTrigger asChild>
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg"
              role="button"
              aria-expanded={isOpen}
              aria-controls="challenge-collapsible-content"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsOpen((v) => !v);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                <span className="text-sm font-semibold">그룹 챌린지</span>
                {activeChallenges.length > 0 && (
                  <Badge className="h-4 px-1.5 text-[10px] bg-green-600">
                    진행중 {activeChallenges.length}
                  </Badge>
                )}
                {total > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    총 {total}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!loading && total > 0 && (
                  <span className="text-[10px] text-muted-foreground" aria-label={`완료율 ${completionRate}퍼센트`}>
                    완료율 {completionRate}%
                  </span>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent id="challenge-collapsible-content">
            <Separator />
            <div className="p-3 space-y-3">
              {/* 통계 요약 */}
              {total > 0 && (
                <dl
                  className="grid grid-cols-3 gap-2"
                  aria-label="챌린지 통계 요약"
                >
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <dt className="text-[10px] text-muted-foreground">총 챌린지</dt>
                    <dd className="text-xs font-bold text-foreground">{total}</dd>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <dt className="text-[10px] text-muted-foreground">완료율</dt>
                    <dd className="text-xs font-bold text-green-600">{completionRate}%</dd>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2 text-center">
                    <dt className="text-[10px] text-muted-foreground">인기 카테고리</dt>
                    <dd className="text-xs font-bold text-purple-600 truncate">
                      {popularCategory ? CATEGORY_LABELS[popularCategory] : "-"}
                    </dd>
                  </div>
                </dl>
              )}

              {/* 차트 토글 */}
              {total > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground px-2"
                    onClick={() => setShowChart((v) => !v)}
                    aria-expanded={showChart}
                    aria-controls="category-chart"
                  >
                    <BarChart2 className="h-3 w-3 mr-1" aria-hidden="true" />
                    카테고리별 통계{showChart ? " 접기" : " 보기"}
                  </Button>
                  {showChart && (
                    <div id="category-chart" className="mt-2 p-2 bg-muted/30 rounded-md">
                      <CategoryBarChart categoryCounts={categoryCounts} />
                    </div>
                  )}
                </div>
              )}

              {/* 툴바 */}
              <div className="flex items-center justify-between">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as ChallengeTab)}
                >
                  <TabsList id={tabListId} className="h-7" role="tablist" aria-label="챌린지 상태 필터">
                    <TabsTrigger value="active" className="text-[10px] px-2 h-6">
                      진행중{activeChallenges.length > 0 && ` (${activeChallenges.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className="text-[10px] px-2 h-6">
                      예정{upcomingChallenges.length > 0 && ` (${upcomingChallenges.length})`}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="text-[10px] px-2 h-6">
                      완료{completedList.length > 0 && ` (${completedList.length})`}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                  챌린지 추가
                </Button>
              </div>

              {/* 챌린지 목록 */}
              <Tabs value={activeTab}>
                <TabsContent value={activeTab} className="mt-0">
                  {loading ? (
                    <div
                      className="text-center py-6 text-xs text-muted-foreground"
                      role="alert"
                      aria-live="polite"
                      aria-busy="true"
                    >
                      로딩 중...
                    </div>
                  ) : tabItems.length === 0 ? (
                    <div className="text-center py-6 space-y-2" role="alert" aria-live="polite">
                      <Trophy className="h-8 w-8 mx-auto text-muted-foreground/40" aria-hidden="true" />
                      <p className="text-xs text-muted-foreground">{emptyMessage}</p>
                      {activeTab === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setCreateOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                          첫 챌린지 만들기
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ul
                      className="space-y-2"
                      role="list"
                      aria-label={`${activeTab === "active" ? "진행중" : activeTab === "upcoming" ? "예정" : "완료"} 챌린지 목록`}
                    >
                      {tabItems.map((challenge) => (
                        <li key={challenge.id}>
                          <ChallengeItem
                            challenge={challenge}
                            onEdit={handleEdit}
                            onDelete={deleteChallenge}
                            onViewDetail={setDetailTarget}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* 생성 다이얼로그 */}
      <ChallengeFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createChallenge}
        mode="create"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <ChallengeFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEditSubmit}
          initialValues={{
            title: editTarget.title,
            description: editTarget.description,
            category: editTarget.category,
            startDate: editTarget.startDate,
            endDate: editTarget.endDate,
          }}
          mode="edit"
        />
      )}

      {/* 상세 다이얼로그 */}
      {detailTarget && (
        <ChallengeDetailDialog
          challenge={detailTarget}
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          onAddParticipant={addParticipant}
          onUpdateParticipantStatus={updateParticipantStatus}
          onRemoveParticipant={removeParticipant}
        />
      )}
    </>
  );
}
