"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSchedules } from "@/hooks/use-schedule";
import { useEntityDashboardSettings } from "@/hooks/use-entity-dashboard-settings";
import { DashboardSettingsDialog } from "@/components/groups/dashboard-settings-dialog";
import { ScheduleCard, AttendanceCard, PostsCard, FinanceCard } from "@/components/dashboard/dashboard-cards";
import { SubgroupsCard } from "@/components/dashboard/subgroups-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { Users, ChevronRight } from "lucide-react";
import { getDisplayName } from "@/lib/entity-utils";
import type { EntityContext } from "@/types/entity-context";
import type {
  FinanceRole,
  BoardPostWithDetails,
  FinanceTransaction,
  AttendanceWithProfile,
  DashboardCardId,
  ProjectDashboardCardId,
} from "@/types";
import {
  DASHBOARD_CARDS as GROUP_CARDS,
  DEFAULT_DASHBOARD_CARDS as GROUP_DEFAULT_CARDS,
  PROJECT_DASHBOARD_CARDS as PROJECT_CARDS,
  DEFAULT_PROJECT_DASHBOARD_CARDS as PROJECT_DEFAULT_CARDS,
} from "@/types";

type DashboardContentProps = {
  ctx: EntityContext;
  financeRole?: FinanceRole | null;
};

export function DashboardContent({ ctx, financeRole }: DashboardContentProps) {
  const isGroup = ctx.entityType === "group";
  const { basePath, groupId, projectId, entityId, members, features } = ctx;

  // 일정 훅
  const { schedules, loading: schedulesLoading } = useSchedules(groupId, projectId);

  // 대시보드 설정 훅 - 그룹/프로젝트 분기
  const filterFn = useMemo(() => {
    if (isGroup) {
      return (card: { id: string; visible: boolean }) => {
        if (card.id === "finance" && !ctx.permissions.canViewFinance) return false;
        return true;
      };
    } else {
      return (card: { id: string; visible: boolean }) => {
        const featureId = card.id as keyof typeof features;
        if (featureId in features && !features[featureId]) return false;
        return true;
      };
    }
  }, [isGroup, ctx.permissions.canViewFinance, features]);

  const disabledFn = useMemo(() => {
    if (isGroup) {
      return (cardId: string) => {
        const isFinanceDisabled = cardId === "finance" && !ctx.permissions.canViewFinance;
        return {
          disabled: isFinanceDisabled,
          reason: isFinanceDisabled ? "접근 권한 없음" : undefined,
        };
      };
    } else {
      return (cardId: string) => {
        const featureId = cardId as keyof typeof features;
        const isFeatureDisabled = featureId in features ? !features[featureId] : false;
        return {
          disabled: isFeatureDisabled,
          reason: isFeatureDisabled ? "비활성화된 기능" : undefined,
        };
      };
    }
  }, [isGroup, ctx.permissions.canViewFinance, features]);

  const { visibleCards, allCards, saveSettings, saving } = useEntityDashboardSettings({
    entityId,
    memberTable: isGroup ? "group_members" : "project_members",
    memberIdField: isGroup ? "group_id" : "project_id",
    cards: isGroup ? GROUP_CARDS : PROJECT_CARDS,
    defaultCards: isGroup ? GROUP_DEFAULT_CARDS : PROJECT_DEFAULT_CARDS,
    filterFn,
    disabledFn,
  });

  // 대시보드 데이터
  const [recentPosts, setRecentPosts] = useState<BoardPostWithDetails[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<FinanceTransaction[]>([]);
  const [nextScheduleAttendance, setNextScheduleAttendance] = useState<AttendanceWithProfile[]>([]);

  const fetchDashboard = useCallback(async () => {
    const supabase = createClient();

    // 게시글 + 거래내역 병렬 조회
    let postsQuery;
    let txnsQuery;

    if (isGroup) {
      // 모든 기능의 독립 프로젝트 ID를 한 번에 조회
      const { data: allIndep } = await supabase.rpc(
        "get_all_independent_project_ids",
        { p_group_id: groupId }
      );

      type IndependentEntity = { entity_id: string; feature: string };
      const excludeBoardProjectIds = (allIndep || [])
        .filter((e: IndependentEntity) => e.feature === "board")
        .map((e: IndependentEntity) => e.entity_id);
      const excludeFinanceProjectIds = (allIndep || [])
        .filter((e: IndependentEntity) => e.feature === "finance")
        .map((e: IndependentEntity) => e.entity_id);

      postsQuery = supabase
        .from("board_posts")
        .select("*, profiles(id, name, avatar_url), comment_count:board_comments(count), projects(id, name)")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (excludeBoardProjectIds.length > 0) {
        postsQuery = postsQuery.not("project_id", "in", `(${excludeBoardProjectIds.join(",")})`);
      }

      txnsQuery = supabase
        .from("finance_transactions")
        .select("*")
        .eq("group_id", groupId)
        .order("transaction_date", { ascending: false })
        .limit(3);
      if (excludeFinanceProjectIds.length > 0) {
        txnsQuery = txnsQuery.not("project_id", "in", `(${excludeFinanceProjectIds.join(",")})`);
      }
    } else {
      postsQuery = supabase
        .from("board_posts")
        .select("*, profiles(id, name, avatar_url), comment_count:board_comments(count)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(3);

      txnsQuery = supabase
        .from("finance_transactions")
        .select("*")
        .eq("project_id", projectId!)
        .order("transaction_date", { ascending: false })
        .limit(3);
    }

    const [postsRes, txnsRes] = await Promise.all([postsQuery, txnsQuery]);

    if (postsRes.data) {
      type RawPost = (typeof postsRes.data)[number];
      setRecentPosts(
        postsRes.data.map((p: RawPost) => ({
          ...p,
          comment_count: Array.isArray(p.comment_count)
            ? (p.comment_count[0] as { count: number })?.count ?? 0
            : 0,
        })) as unknown as BoardPostWithDetails[]
      );
    }
    if (txnsRes.data) setRecentTransactions(txnsRes.data as FinanceTransaction[]);
  }, [groupId, projectId, isGroup]);

  // 다음 일정 출석 현황
  const fetchNextAttendance = useCallback(async () => {
    const now = new Date();
    const nextSchedule = schedules
      .filter((s) => new Date(s.ends_at) >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

    if (nextSchedule) {
      const supabase = createClient();
      const { data } = await supabase
        .from("attendance")
        .select("*, profiles(*)")
        .eq("schedule_id", nextSchedule.id);
      if (data) setNextScheduleAttendance(data as AttendanceWithProfile[]);
    }
  }, [schedules]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (!schedulesLoading && schedules.length > 0) {
      fetchNextAttendance();
    }
  }, [schedulesLoading, schedules, fetchNextAttendance]);

  // 일정 데이터
  const now = new Date();
  const upcomingSchedules = schedules
    .filter((s) => new Date(s.ends_at) >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 3);
  const nextSchedule = upcomingSchedules[0];

  // 그룹 멤버 카드용 리더 목록
  const leaders = members.filter((m) => m.role === "leader");

  return (
    <>
      <div className={`flex justify-end ${isGroup ? "mb-3" : "-mt-2 mb-2"}`}>
        <DashboardSettingsDialog
          allCards={allCards}
          saving={saving}
          onSave={saveSettings}
        />
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${isGroup ? "gap-3" : "gap-2"}`}>
        {visibleCards.map((card) => {
          if (isGroup) {
            const cardId = card.id as DashboardCardId;
            switch (cardId) {
              case "upcoming_schedule":
                return <ScheduleCard key={cardId} schedules={upcomingSchedules} basePath={basePath} />;
              case "attendance":
                return <AttendanceCard key={cardId} schedule={nextSchedule || null} attendance={nextScheduleAttendance} memberCount={members.length} basePath={basePath} />;
              case "recent_posts":
                return <PostsCard key={cardId} posts={recentPosts} basePath={basePath} showProject />;
              case "finance":
                return <FinanceCard key={cardId} transactions={recentTransactions} basePath={basePath} />;
              case "members":
                return (
                  <div key={cardId} className="rounded border">
                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b bg-muted/30">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                        <Users className="h-3 w-3" />
                        멤버
                      </span>
                      <Link
                        href={`${basePath}/members`}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        전체 <ChevronRight className="h-2.5 w-2.5 inline" />
                      </Link>
                    </div>
                    <div className="px-2.5 py-1.5">
                      <p className="text-xs mb-1">
                        <span className="font-semibold tabular-nums">{members.length}</span>
                        <span className="text-muted-foreground">명</span>
                      </p>
                      {leaders.length > 0 && (
                        <div className="space-y-px">
                          {leaders.map((leader) => (
                            <div
                              key={leader.id}
                              className="flex items-center gap-1.5 text-[11px] hover:bg-muted rounded px-1.5 py-0.5 -mx-1.5"
                            >
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="text-[8px]">
                                  {getDisplayName(leader)?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <UserPopoverMenu
                                userId={leader.userId}
                                displayName={getDisplayName(leader)}
                                groupId={groupId}
                                className="hover:underline"
                              >
                                {getDisplayName(leader)}
                              </UserPopoverMenu>
                              <Badge variant="secondary" className="text-[8px] px-1 py-0">그룹장</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              case "subgroups":
                return <SubgroupsCard key={cardId} groupId={groupId} basePath={basePath} />;
              default:
                return null;
            }
          } else {
            const cardId = card.id as ProjectDashboardCardId;
            switch (cardId) {
              case "schedule":
                return <ScheduleCard key={cardId} schedules={upcomingSchedules} basePath={basePath} />;
              case "attendance":
                return <AttendanceCard key={cardId} schedule={nextSchedule || null} attendance={nextScheduleAttendance} memberCount={members.length} basePath={basePath} />;
              case "board":
                return <PostsCard key={cardId} posts={recentPosts} basePath={basePath} />;
              case "finance":
                return <FinanceCard key={cardId} transactions={recentTransactions} basePath={basePath} />;
              default:
                return null;
            }
          }
        })}
      </div>
    </>
  );
}
