"use client";

// 그룹 멘토 매칭 카드 (메인 컴포넌트)
// - 하위 컴포넌트들을 조합하여 전체 멘토 매칭 UI 구성

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupMentor } from "@/hooks/use-group-mentor";
import { MatchCard } from "./group-mentor-match-card";
import { MentorStatsGrid } from "./group-mentor-stats-grid";
import { MentorStatsTab } from "./group-mentor-mentor-stats";
import { MatchDialog, AddSessionDialog } from "./group-mentor-dialogs";
import {
  FIELDS,
  STATUS_OPTIONS,
  type FilterStatus,
  type FilterField,
  type MatchFormData,
} from "./group-mentor-types";
import type {
  GroupMentorMatch,
  GroupMentorStatus,
  GroupMentorSession,
} from "@/types";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function GroupMentorCard({ groupId }: { groupId: string }) {
  const {
    matches,
    loading,
    addMatch,
    updateMatch,
    deleteMatch,
    updateStatus,
    addSession,
    deleteSession,
    stats,
  } = useGroupMentor(groupId);

  // 카드 접기/펼치기
  const [isOpen, setIsOpen] = useState(true);

  // 필터 상태
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("전체");
  const [filterField, setFilterField] = useState<FilterField>("전체");

  // 다이얼로그 상태
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupMentorMatch | null>(null);
  const [sessionMatchId, setSessionMatchId] = useState<string | null>(null);

  // 필터 적용된 매칭 목록
  const filtered = matches.filter((m) => {
    if (filterStatus !== "전체" && m.status !== filterStatus) return false;
    if (filterField !== "전체" && m.field !== filterField) return false;
    return true;
  });

  // ============================================================
  // 이벤트 핸들러
  // ============================================================

  /** 새 매칭 추가 */
  function handleCreate(data: MatchFormData) {
    addMatch({
      mentorName: data.mentorName,
      menteeName: data.menteeName,
      field: data.field,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status,
    });
    toast.success(TOAST.GROUP_MENTOR_CARD.MATCHING_ADDED);
  }

  /** 기존 매칭 수정 */
  function handleEdit(data: MatchFormData) {
    if (!editTarget) return;
    const ok = updateMatch(editTarget.id, {
      mentorName: data.mentorName,
      menteeName: data.menteeName,
      field: data.field,
      startDate: data.startDate,
      endDate: data.endDate || null,
      status: data.status,
    });
    if (ok) toast.success(TOAST.GROUP_MENTOR_CARD.MATCHING_UPDATED);
    else toast.error(TOAST.UPDATE_ERROR);
  }

  /** 매칭 삭제 */
  function handleDelete(id: string) {
    const ok = deleteMatch(id);
    if (ok) toast.success(TOAST.GROUP_MENTOR_CARD.MATCHING_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  /** 매칭 상태 변경 */
  function handleStatusChange(id: string, status: GroupMentorStatus) {
    updateStatus(id, status);
    toast.success(`상태가 "${status}"으로 변경되었습니다.`);
  }

  /** 세션 추가 */
  function handleAddSession(
    matchId: string,
    session: Omit<GroupMentorSession, "id" | "createdAt">
  ) {
    const result = addSession(matchId, session);
    if (result) toast.success(TOAST.GROUP_MENTOR_CARD.SESSION_RECORDED);
    else toast.error(TOAST.GROUP_MENTOR_CARD.SESSION_ADD_ERROR);
  }

  /** 세션 삭제 */
  function handleDeleteSession(matchId: string, sessionId: string) {
    const ok = deleteSession(matchId, sessionId);
    if (ok) toast.success(TOAST.GROUP_MENTOR_CARD.SESSION_DELETED);
    else toast.error(TOAST.DELETE_ERROR);
  }

  // ============================================================
  // 렌더
  // ============================================================

  return (
    <>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 카드 헤더 (접기/펼치기 트리거) */}
          <CollapsibleTrigger asChild>
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
              aria-controls="mentor-card-content"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" aria-hidden="true" />
                <span className="text-sm font-medium">그룹 멘토 매칭</span>
                {stats.active > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700">
                    진행중 {stats.active}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent id="mentor-card-content">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {/* 요약 통계 그리드 */}
              <MentorStatsGrid stats={stats} />

              {/* 탭: 매칭 목록 / 멘토 통계 */}
              <Tabs defaultValue="list">
                <TabsList className="h-7 text-xs">
                  <TabsTrigger value="list" className="text-xs px-3 h-6">
                    매칭 목록
                  </TabsTrigger>
                  <TabsTrigger value="mentors" className="text-xs px-3 h-6">
                    멘토 통계
                  </TabsTrigger>
                </TabsList>

                {/* ── 매칭 목록 탭 ── */}
                <TabsContent value="list" className="mt-2 space-y-2">
                  {/* 필터 + 매칭 추가 버튼 */}
                  <div
                    className="flex items-center gap-1.5 flex-wrap"
                    role="toolbar"
                    aria-label="매칭 목록 필터"
                  >
                    {/* 상태 필터 */}
                    <Select
                      value={filterStatus}
                      onValueChange={(v) => setFilterStatus(v as FilterStatus)}
                    >
                      <SelectTrigger
                        className="h-7 text-xs w-auto min-w-[72px] px-2"
                        aria-label="상태 필터"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="전체" className="text-xs">
                          전체 상태
                        </SelectItem>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 분야 필터 */}
                    <Select
                      value={filterField}
                      onValueChange={(v) => setFilterField(v as FilterField)}
                    >
                      <SelectTrigger
                        className="h-7 text-xs w-auto min-w-[72px] px-2"
                        aria-label="분야 필터"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="전체" className="text-xs">
                          전체 분야
                        </SelectItem>
                        {FIELDS.map((f) => (
                          <SelectItem key={f} value={f} className="text-xs">
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* 매칭 추가 버튼 */}
                    <div className="ml-auto">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setCreateOpen(true)}
                        aria-label="새 멘토링 매칭 추가"
                      >
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                        매칭 추가
                      </Button>
                    </div>
                  </div>

                  {/* 매칭 목록 */}
                  {loading ? (
                    <div className="text-xs text-muted-foreground text-center py-6" role="status">
                      불러오는 중...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8" role="status">
                      {matches.length === 0
                        ? "아직 멘토링 매칭이 없습니다."
                        : "선택한 필터에 해당하는 매칭이 없습니다."}
                    </div>
                  ) : (
                    <div role="list" aria-label="멘토링 매칭 목록" className="space-y-2">
                      {filtered.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          onEdit={() => setEditTarget(match)}
                          onDelete={() => handleDelete(match.id)}
                          onStatusChange={(status) =>
                            handleStatusChange(match.id, status)
                          }
                          onAddSession={() => setSessionMatchId(match.id)}
                          onDeleteSession={(sessionId) =>
                            handleDeleteSession(match.id, sessionId)
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── 멘토 통계 탭 ── */}
                <TabsContent value="mentors" className="mt-2">
                  <MentorStatsTab stats={stats} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 매칭 추가 다이얼로그 */}
      <MatchDialog
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />

      {/* 매칭 수정 다이얼로그 */}
      {editTarget && (
        <MatchDialog
          open={editTarget !== null}
          mode="edit"
          initial={{
            mentorName: editTarget.mentorName,
            menteeName: editTarget.menteeName,
            field: editTarget.field,
            startDate: editTarget.startDate,
            endDate: editTarget.endDate ?? "",
            status: editTarget.status,
          }}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}

      {/* 세션 추가 다이얼로그 */}
      <AddSessionDialog
        open={sessionMatchId !== null}
        matchId={sessionMatchId}
        onClose={() => setSessionMatchId(null)}
        onSave={handleAddSession}
      />
    </>
  );
}
