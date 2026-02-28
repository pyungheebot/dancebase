"use client";

import { useState, useMemo } from "react";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { createClient } from "@/lib/supabase/client";
import { MemberList } from "@/components/groups/member-list";
import { InviteModal } from "@/components/groups/invite-modal";
import { MemberCategoryManager } from "@/components/groups/member-category-manager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPopoverMenu } from "@/components/user/user-popover-menu";
import { SubgroupInviteFromParent } from "@/components/subgroups/subgroup-invite-from-parent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Download, Plus, Search, Tags, Trash2, TrendingUp, Users } from "lucide-react";
import { InviteGroupMembersDialog } from "@/components/members/invite-group-members-dialog";
import { MemberAdvancedFilter } from "@/components/members/member-advanced-filter";
import { useMemberFilter } from "@/hooks/use-member-filter";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export-csv";
import { getCategoryColorClasses } from "@/types";
import { EmptyState } from "@/components/shared/empty-state";
import { InactiveMembersSection } from "@/components/members/inactive-members-section";
import { MemberComparisonDashboard } from "@/components/members/member-comparison-dashboard";
import { MemberActivityReport } from "@/components/members/member-activity-report";
import { MemberActivityTrendChart } from "@/components/members/member-activity-trend-chart";
import { SkillMatrixSection } from "@/components/members/skill-matrix-section";
import { SkillMatrixCard } from "@/components/groups/skill-matrix-card";
import { ContactVerificationSection } from "@/components/members/contact-verification-section";
import { ContactVerifyBanner } from "@/components/members/contact-verify-banner";
import { RolePromotionSection } from "@/components/members/role-promotion-section";
import { MemberRiskAlert } from "@/components/members/member-risk-alert";
import { MentorMenteeSection } from "@/components/members/mentor-mentee-section";
import { MyFeedbackSheet } from "@/components/members/peer-feedback-dialog";
import { RewardPointsShop } from "@/components/members/reward-points-shop";
import { DynamicTeamManager } from "@/components/members/dynamic-team-manager";
import { PartnerMatchingPanel } from "@/components/members/partner-matching-panel";
import { SkillTreeCard } from "@/components/members/skill-tree-card";
import { DanceWorkshopCard } from "@/components/members/dance-workshop-card";
import { DanceAuditionCard } from "@/components/members/dance-audition-card";
import { DanceClassLogCard } from "@/components/members/dance-class-log-card";
import { DanceNetworkingCard } from "@/components/members/dance-networking-card";
import { InjuryLogCard } from "@/components/members/injury-log-card";
import { DanceStyleAnalysisCard } from "@/components/members/dance-style-analysis-card";
import { RoutineBuilderCard } from "@/components/members/routine-builder-card";
import { InspirationBoardCard } from "@/components/members/inspiration-board-card";
import { DanceMusicCard } from "@/components/members/dance-music-card";
import { DanceGoalCard } from "@/components/members/dance-goal-card";
import { DanceConditionJournalCard } from "@/components/members/dance-condition-journal-card";
import { DanceVideoPortfolioCard } from "@/components/members/dance-video-portfolio-card";
import { DanceClassReviewCard } from "@/components/members/dance-class-review-card";
import { DanceCompetitionCard } from "@/components/members/dance-competition-card";
import { DanceStyleProfileCard } from "@/components/members/dance-style-profile-card";
import { DanceDiaryCard } from "@/components/members/dance-diary-card";
import { DanceCertificationCard } from "@/components/members/dance-certification-card";
import type { EntityContext, EntityMember } from "@/types/entity-context";
import type { GroupMemberWithProfile, MemberCategory, Profile } from "@/types";

type MembersContentProps = {
  ctx: EntityContext;
  currentUserId: string;
  categories?: MemberCategory[];
  categoryMap?: Record<string, string>;
  categoryColorMap?: Record<string, string>;
  inviteCode?: string;
  parentMembers?: EntityMember[];
  onUpdate: () => void;
};

export function MembersContent({
  ctx,
  currentUserId,
  categories = [],
  categoryMap = {},
  categoryColorMap = {},
  inviteCode,
  parentMembers = [],
  onUpdate,
}: MembersContentProps) {
  const isGroup = ctx.entityType === "group";

  if (isGroup) {
    return (
      <GroupMembersContent
        ctx={ctx}
        currentUserId={currentUserId}
        categories={categories}
        inviteCode={inviteCode}
        onUpdate={onUpdate}
      />
    );
  }

  return (
    <ProjectMembersContent
      ctx={ctx}
      currentUserId={currentUserId}
      parentMembers={parentMembers}
      onUpdate={onUpdate}
    />
  );
}

// ============================================
// 공통 유틸
// ============================================

/** EntityMember role → 한글 */
function roleLabel(role: string): string {
  if (role === "leader") return "리더";
  if (role === "sub_leader") return "서브리더";
  return "멤버";
}

// ============================================
// 그룹 멤버 콘텐츠
// ============================================

function GroupMembersContent({
  ctx,
  currentUserId,
  categories,
  inviteCode,
  onUpdate,
}: {
  ctx: EntityContext;
  currentUserId: string;
  categories: MemberCategory[];
  inviteCode?: string;
  onUpdate: () => void;
}) {
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");

  // 고급 필터
  const {
    filter: advFilter,
    activeCount: advActiveCount,
    toggleRole: advToggleRole,
    setJoinedFrom: advSetJoinedFrom,
    setJoinedTo: advSetJoinedTo,
    setAttendanceMin: advSetAttendanceMin,
    setAttendanceMax: advSetAttendanceMax,
    resetFilter: advResetFilter,
  } = useMemberFilter();

  // 활동 추세 차트용 선택 멤버
  const [trendUserId, setTrendUserId] = useState<string>("");

  // 일괄 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRemoveOpen, setBulkRemoveOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // 스크롤 위치 복원
  useScrollRestore();

  const supabase = createClient();

  const canManage = ctx.permissions.canManageMembers;

  // 현재 사용자의 group_member id (자기 자신은 선택 불가)
  const currentUserMemberId = useMemo(
    () => ctx.members.find((m) => m.userId === currentUserId)?.id ?? null,
    [ctx.members, currentUserId]
  );

  const handleExportCsv = () => {
    const headers = ["이름", "역할", "가입일"];
    const rows = ctx.members.map((m) => [
      m.nickname || m.profile.name,
      roleLabel(m.role),
      m.joinedAt ? m.joinedAt.slice(0, 10) : "",
    ]);
    exportToCsv(`멤버목록_${ctx.header.name}`, headers, rows);
    toast.success("CSV 파일이 다운로드되었습니다");
  };

  // NormalizedMember → GroupMemberWithProfile 역변환
  const allMembersForList: GroupMemberWithProfile[] = ctx.members.map((m) => ({
    id: m.id,
    group_id: ctx.groupId,
    user_id: m.userId,
    role: m.role,
    joined_at: m.joinedAt,
    nickname: m.nickname,
    category_id: m.categoryId ?? null,
    profiles: {
      ...({} as Profile),
      id: m.profile.id,
      name: m.profile.name,
      avatar_url: m.profile.avatar_url,
      dance_genre: m.profile.dance_genre ?? [],
    },
  }));

  const filteredMembers = useMemo(() => {
    let result = allMembersForList;

    // 카테고리 필터
    if (selectedCategory !== "all") {
      result =
        selectedCategory === "none"
          ? result.filter(
              (m) => !m.category_id || !categories.some((c) => c.id === m.category_id)
            )
          : result.filter((m) => m.category_id === selectedCategory);
    }

    // 검색어 필터
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => {
        const displayName = (m.nickname || m.profiles.name || "").toLowerCase();
        return displayName.includes(query);
      });
    }

    // 역할 필터 (기본 Select)
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }

    // 고급 필터 — 역할 (체크박스 복수 선택)
    if (advFilter.roles.length > 0) {
      result = result.filter((m) =>
        advFilter.roles.includes(m.role as "leader" | "sub_leader" | "member")
      );
    }

    // 고급 필터 — 가입일 범위
    if (advFilter.joinedFrom) {
      result = result.filter(
        (m) => m.joined_at && m.joined_at.slice(0, 10) >= advFilter.joinedFrom
      );
    }
    if (advFilter.joinedTo) {
      result = result.filter(
        (m) => m.joined_at && m.joined_at.slice(0, 10) <= advFilter.joinedTo
      );
    }

    // 정렬
    result = [...result].sort((a, b) => {
      if (sortOrder === "name") {
        const nameA = (a.nickname || a.profiles.name || "").toLowerCase();
        const nameB = (b.nickname || b.profiles.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "ko");
      }
      if (sortOrder === "joined") {
        return (a.joined_at || "").localeCompare(b.joined_at || "");
      }
      return 0;
    });

    return result;
  }, [allMembersForList, selectedCategory, categories, searchQuery, roleFilter, sortOrder, advFilter]);

  const isGrouped =
    selectedCategory === "all" &&
    !searchQuery.trim() &&
    roleFilter === "all" &&
    advActiveCount === 0;
  const myRole = ctx.permissions.canEdit ? "leader" : "member";

  // 선택 가능한 멤버 ids (자기 자신 제외)
  const selectableIds = useMemo(
    () => filteredMembers.filter((m) => m.id !== currentUserMemberId).map((m) => m.id),
    [filteredMembers, currentUserMemberId]
  );

  const allSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const handleToggleSelect = (memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleBulkRoleChange = async (newRole: "leader" | "sub_leader" | "member") => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("group_members")
      .update({ role: newRole })
      .in("id", ids);
    setBulkLoading(false);
    if (error) {
      toast.error("역할 변경에 실패했습니다");
      return;
    }
    const roleLabel = newRole === "leader" ? "그룹장" : newRole === "sub_leader" ? "부그룹장" : "멤버";
    toast.success(`${ids.length}명의 역할이 ${roleLabel}(으)로 변경되었습니다`);
    setSelectedIds(new Set());
    onUpdate();
  };

  const handleBulkRemoveConfirm = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .in("id", ids);
    setBulkLoading(false);
    setBulkRemoveOpen(false);
    if (error) {
      toast.error("멤버 제거에 실패했습니다");
      return;
    }
    toast.success(`${ids.length}명이 제거되었습니다`);
    setSelectedIds(new Set());
    onUpdate();
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1 mb-2">
        {ctx.members.length > 1 && (
          <MemberComparisonDashboard
            groupId={ctx.groupId}
            members={ctx.members}
          />
        )}
        <MyFeedbackSheet
          groupId={ctx.groupId}
          currentUserId={currentUserId}
        />
        <RewardPointsShop
          groupId={ctx.groupId}
          currentUserId={currentUserId}
          members={ctx.members}
          canEdit={ctx.permissions.canEdit}
        />
        <DynamicTeamManager
          groupId={ctx.groupId}
          members={ctx.members}
        />
        <PartnerMatchingPanel groupId={ctx.groupId} />
        {ctx.permissions.canManageMembers && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[11px] px-2"
            onClick={handleExportCsv}
          >
            <Download className="h-3 w-3 mr-0.5" />
            CSV 내보내기
          </Button>
        )}
        {ctx.permissions.canEdit && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[11px] px-2"
              onClick={() => setCategoryManagerOpen(true)}
            >
              <Tags className="h-3 w-3 mr-0.5" />
              카테고리
            </Button>
            {ctx.parentGroupId && (
              <SubgroupInviteFromParent
                subgroupId={ctx.groupId}
                parentGroupId={ctx.parentGroupId}
                currentMemberIds={new Set(ctx.members.map((m) => m.userId))}
                onInvited={onUpdate}
              />
            )}
            {inviteCode && <InviteModal inviteCode={inviteCode} />}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-medium">멤버 관리</h2>
        {categories.length > 0 && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-28 h-6 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="none">카테고리 없음</SelectItem>
              {categories.map((cat) => {
                const cc = getCategoryColorClasses(cat.color || "gray");
                return (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${cc.bg} ${cc.border} border`}
                      />
                      {cat.name}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 검색 / 역할 필터 / 정렬 툴바 */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="멤버 검색"
            className="h-7 pl-6 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-24 h-7 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="leader">리더</SelectItem>
            <SelectItem value="sub_leader">서브리더</SelectItem>
            <SelectItem value="member">멤버</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-24 h-7 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">이름순</SelectItem>
            <SelectItem value="joined">가입일순</SelectItem>
          </SelectContent>
        </Select>
        <MemberAdvancedFilter
          filter={advFilter}
          activeCount={advActiveCount}
          onToggleRole={advToggleRole}
          onSetJoinedFrom={advSetJoinedFrom}
          onSetJoinedTo={advSetJoinedTo}
          onSetAttendanceMin={advSetAttendanceMin}
          onSetAttendanceMax={advSetAttendanceMax}
          onReset={advResetFilter}
        />
      </div>

      {/* 일괄 선택 툴바 — canManageMembers일 때만 */}
      {canManage && filteredMembers.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded border bg-muted/40">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleToggleSelectAll}
            className="shrink-0"
            aria-label="전체 선택"
          />
          <span className="text-xs text-muted-foreground flex-1">
            {someSelected ? `${selectedIds.size}명 선택됨` : "전체 선택"}
          </span>
          {someSelected && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  disabled={bulkLoading}
                >
                  일괄 작업
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs">
                    역할 변경
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="text-xs"
                      onSelect={() => handleBulkRoleChange("leader")}
                    >
                      그룹장
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs"
                      onSelect={() => handleBulkRoleChange("sub_leader")}
                    >
                      부그룹장
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs"
                      onSelect={() => handleBulkRoleChange("member")}
                    >
                      멤버
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs"
                  variant="destructive"
                  onSelect={() => setBulkRemoveOpen(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  멤버 제거
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <MemberList
        members={filteredMembers}
        myRole={myRole}
        currentUserId={currentUserId}
        groupId={ctx.groupId}
        categories={categories}
        grouped={isGrouped}
        onUpdate={onUpdate}
        selectable={canManage}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      <ConfirmDialog
        open={bulkRemoveOpen}
        onOpenChange={(open) => {
          if (!open) setBulkRemoveOpen(false);
        }}
        title="멤버 일괄 제거"
        description={`선택한 ${selectedIds.size}명을 그룹에서 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleBulkRemoveConfirm}
        destructive
      />

      <MemberCategoryManager
        groupId={ctx.groupId}
        categories={categories}
        members={allMembersForList}
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onUpdate={onUpdate}
      />

      {/* 출석/납부 위험 멤버 경고 (리더/매니저 전용, 위험 멤버 없으면 숨김) */}
      <MemberRiskAlert ctx={ctx} />

      {/* 비활성 멤버 섹션 (리더 전용, 비활성 멤버가 없으면 숨김) */}
      <InactiveMembersSection ctx={ctx} />

      {/* 역할 자동 승격 제안 (canEdit 권한 + 멤버가 있는 경우에만 표시) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <RolePromotionSection
          groupId={ctx.groupId}
          members={ctx.members}
          onUpdate={onUpdate}
        />
      )}

      {/* 멤버 활동 리포트 (canEdit 권한인 경우에만 표시) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <MemberActivityReport
          groupId={ctx.groupId}
          groupName={ctx.header.name}
          members={ctx.members}
        />
      )}

      {/* 멤버 역량 맵 (canEdit 권한인 경우에만 표시) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <SkillMatrixSection
          groupId={ctx.groupId}
          members={ctx.members}
          canEdit={ctx.permissions.canEdit}
        />
      )}

      {/* 기술 매트릭스 (목표 레벨/평가일 포함 - localStorage 기반) */}
      <SkillMatrixCard groupId={ctx.groupId} />

      {/* 멘토-멘티 매칭 (canEdit 권한인 경우에만 관리 가능, 멤버가 있을 때만 표시) */}
      {ctx.members.length > 0 && (
        <MentorMenteeSection
          groupId={ctx.groupId}
          members={ctx.members}
          canManage={ctx.permissions.canEdit}
        />
      )}

      {/* 연락처 재확인 배너 (미확인 멤버에게만 표시) */}
      {!ctx.permissions.canEdit && (
        <div className="mt-4">
          <ContactVerifyBanner
            groupId={ctx.groupId}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* 연락처 재확인 관리 섹션 (리더/서브리더 전용) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <ContactVerificationSection ctx={ctx} />
      )}

      {/* 멤버 활동 추세 차트 */}
      {ctx.members.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                활동 추세
              </CardTitle>
              <Select
                value={trendUserId}
                onValueChange={setTrendUserId}
              >
                <SelectTrigger className="w-32 h-6 text-[11px]">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ctx.members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.nickname || m.profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {trendUserId ? (
              <MemberActivityTrendChart
                groupId={ctx.groupId}
                userId={trendUserId}
                weeks={8}
              />
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-6">
                멤버를 선택하면 최근 8주간 활동 추세를 확인할 수 있습니다
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 멤버 스킬 트리 (개인 스킬 성장 시각화) */}
      <SkillTreeCard
        groupId={ctx.groupId}
        userId={currentUserId}
        canEdit={ctx.permissions.canEdit}
      />

      {/* 댄스 워크숍 이력 (개인 워크숍/마스터클래스 참석 이력) */}
      <DanceWorkshopCard memberId={currentUserId} />

      {/* 댄스 오디션 기록 (오디션 참가 이력 및 결과 관리) */}
      <DanceAuditionCard memberId={currentUserId} />

      {/* 댄스 수업 수강 기록 (그룹 내부/외부 수업 이력 관리) */}
      <DanceClassLogCard memberId={currentUserId} />

      {/* 댄스 네트워킹 연락처 (댄스 업계 인맥 관리) */}
      <DanceNetworkingCard memberId={currentUserId} />

      {/* 댄스 부상 기록 (부상 이력 및 재활 상태 추적) */}
      <InjuryLogCard memberId={currentUserId} />

      {/* 댄스 스타일 분석 (개인 댄스 스타일 특성 기록) */}
      <DanceStyleAnalysisCard memberId={currentUserId} />

      {/* 댄스 루틴 빌더 (개인 연습 루틴 구성) */}
      <RoutineBuilderCard memberId={currentUserId} />
      <InspirationBoardCard memberId={currentUserId} />
      <DanceMusicCard memberId={currentUserId} />
      <DanceGoalCard memberId={currentUserId} />
      <DanceConditionJournalCard memberId={currentUserId} />
      <DanceVideoPortfolioCard memberId={currentUserId} />
      <DanceClassReviewCard memberId={currentUserId} />

      {/* 댄스 대회 참가 기록 (대회/컴피티션 참가 이력) */}
      <DanceCompetitionCard memberId={currentUserId} />
      <DanceStyleProfileCard memberId={currentUserId} />
      <DanceDiaryCard memberId={currentUserId} />
      <DanceCertificationCard memberId={currentUserId} />
    </>
  );
}

// ============================================
// 프로젝트 멤버 콘텐츠
// ============================================

function ProjectMembersContent({
  ctx,
  currentUserId,
  parentMembers,
  onUpdate,
}: {
  ctx: EntityContext;
  currentUserId: string;
  parentMembers: EntityMember[];
  onUpdate: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("name");

  // 고급 필터
  const {
    filter: advFilter,
    activeCount: advActiveCount,
    toggleRole: advToggleRole,
    setJoinedFrom: advSetJoinedFrom,
    setJoinedTo: advSetJoinedTo,
    setAttendanceMin: advSetAttendanceMin,
    setAttendanceMax: advSetAttendanceMax,
    resetFilter: advResetFilter,
  } = useMemberFilter();

  // 스크롤 위치 복원
  useScrollRestore();

  const supabase = createClient();

  const handleExportCsv = () => {
    const headers = ["이름", "역할", "가입일"];
    const rows = ctx.members.map((m) => [
      m.nickname || m.profile.name,
      roleLabel(m.role),
      m.joinedAt ? m.joinedAt.slice(0, 10) : "",
    ]);
    exportToCsv(`멤버목록_${ctx.header.name}`, headers, rows);
    toast.success("CSV 파일이 다운로드되었습니다");
  };

  const projectMemberIds = new Set(ctx.members.map((m) => m.userId));
  const availableMembers = parentMembers.filter((m) => !projectMemberIds.has(m.userId));

  const handleAddMember = async () => {
    if (!selectedUserId || !ctx.projectId) return;
    setSubmitting(true);

    await supabase.from("project_members").insert({
      project_id: ctx.projectId,
      user_id: selectedUserId,
      role: "member",
    });

    setSelectedUserId("");
    setSubmitting(false);
    setAddOpen(false);
    onUpdate();
  };

  const handleRemoveConfirm = async () => {
    if (!removeTargetId || !ctx.projectId) return;
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", ctx.projectId)
      .eq("user_id", removeTargetId);
    if (error) {
      toast.error("멤버 제거에 실패했습니다");
    } else {
      toast.success("멤버가 제거되었습니다");
      onUpdate();
    }
    setRemoveTargetId(null);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId);
    onUpdate();
  };

  const displayedMembers = useMemo(() => {
    let result = [...ctx.members];

    // 검색어 필터
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => {
        const displayName = (m.nickname || m.profile.name || "").toLowerCase();
        return displayName.includes(query);
      });
    }

    // 역할 필터 (기본 Select)
    if (roleFilter !== "all") {
      result = result.filter((m) => m.role === roleFilter);
    }

    // 고급 필터 — 역할 (체크박스 복수 선택)
    if (advFilter.roles.length > 0) {
      result = result.filter((m) =>
        advFilter.roles.includes(m.role as "leader" | "sub_leader" | "member")
      );
    }

    // 고급 필터 — 가입일 범위
    if (advFilter.joinedFrom) {
      result = result.filter(
        (m) => m.joinedAt && m.joinedAt.slice(0, 10) >= advFilter.joinedFrom
      );
    }
    if (advFilter.joinedTo) {
      result = result.filter(
        (m) => m.joinedAt && m.joinedAt.slice(0, 10) <= advFilter.joinedTo
      );
    }

    // 정렬
    result = result.sort((a, b) => {
      if (sortOrder === "name") {
        const nameA = (a.nickname || a.profile.name || "").toLowerCase();
        const nameB = (b.nickname || b.profile.name || "").toLowerCase();
        return nameA.localeCompare(nameB, "ko");
      }
      if (sortOrder === "joined") {
        return (a.joinedAt || "").localeCompare(b.joinedAt || "");
      }
      return 0;
    });

    return result;
  }, [ctx.members, searchQuery, roleFilter, sortOrder, advFilter]);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">멤버 ({ctx.members.length})</h2>
        <div className="flex items-center gap-1">
          {ctx.permissions.canManageMembers && ctx.members.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleExportCsv}
            >
              <Download className="h-3 w-3 mr-1" />
              CSV 내보내기
            </Button>
          )}
          {ctx.permissions.canManageMembers && ctx.projectId && availableMembers.length > 0 && (
            <InviteGroupMembersDialog
              projectId={ctx.projectId}
              projectMemberIds={new Set(ctx.members.map((m) => m.userId))}
              groupMembers={parentMembers}
              onInvited={onUpdate}
            />
          )}
          {ctx.permissions.canEdit && availableMembers.length > 0 && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                멤버 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>멤버 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="멤버를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.nickname || m.profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={handleAddMember}
                  disabled={!selectedUserId || submitting}
                >
                  {submitting ? "추가 중..." : "추가"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* 검색 / 역할 필터 / 정렬 툴바 */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="멤버 검색"
            className="h-7 pl-6 text-xs"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-24 h-7 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="leader">리더</SelectItem>
            <SelectItem value="sub_leader">서브리더</SelectItem>
            <SelectItem value="member">멤버</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-24 h-7 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">이름순</SelectItem>
            <SelectItem value="joined">가입일순</SelectItem>
          </SelectContent>
        </Select>
        <MemberAdvancedFilter
          filter={advFilter}
          activeCount={advActiveCount}
          onToggleRole={advToggleRole}
          onSetJoinedFrom={advSetJoinedFrom}
          onSetJoinedTo={advSetJoinedTo}
          onSetAttendanceMin={advSetAttendanceMin}
          onSetAttendanceMax={advSetAttendanceMax}
          onReset={advResetFilter}
        />
      </div>

      {displayedMembers.length === 0 && ctx.members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="프로젝트 멤버가 없습니다"
          description="그룹 멤버를 추가해 프로젝트에 참여시켜보세요."
          action={
            ctx.permissions.canEdit && availableMembers.length > 0
              ? { label: "멤버 추가", onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : displayedMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="검색 결과가 없습니다"
          description="검색어나 필터를 변경해보세요."
        />
      ) : (
      <div className="rounded-lg border divide-y">
        {displayedMembers.map((member) => {
            const displayName = member.nickname || member.profile.name;
            return (
              <div key={member.id} className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <UserPopoverMenu
                    userId={member.userId}
                    displayName={displayName}
                    groupId={ctx.groupId}
                    className="text-sm truncate hover:underline text-left"
                  >
                    {displayName}
                  </UserPopoverMenu>
                  {member.role === "leader" && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      프로젝트장
                    </Badge>
                  )}
                </div>
                {ctx.permissions.canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Select
                      value={member.role}
                      onValueChange={(val) => handleRoleChange(member.id, val)}
                    >
                      <SelectTrigger className="h-6 w-20 text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leader">리더</SelectItem>
                        <SelectItem value="member">멤버</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => setRemoveTargetId(member.userId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      )}

      <ConfirmDialog
        open={!!removeTargetId}
        onOpenChange={(open) => {
          if (!open) setRemoveTargetId(null);
        }}
        title="멤버 제거"
        description="이 멤버를 프로젝트에서 제거하시겠습니까?"
        onConfirm={handleRemoveConfirm}
        destructive
      />
    </>
  );
}
