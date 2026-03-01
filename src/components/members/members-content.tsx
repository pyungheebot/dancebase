"use client";

import { useState, useMemo, Suspense } from "react";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useTableFilter } from "@/hooks/use-table-filter";
import { useFormSubmission } from "@/hooks/use-form-submission";
import { useMemberFilter } from "@/hooks/use-member-filter";
import { useGroupMemberList } from "@/hooks/use-group-member-list";
import { createClient } from "@/lib/supabase/client";
import { MemberList } from "@/components/groups/member-list";
import { InviteModal } from "@/components/groups/invite-modal";
import { MemberCategoryManager } from "@/components/groups/member-category-manager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubgroupInviteFromParent } from "@/components/subgroups/subgroup-invite-from-parent";
import { Download, Plus, Tags, Users } from "lucide-react";
import { MemberDanceCards } from "@/components/members/member-dance-cards";
import { GroupMemberSections } from "@/components/members/group-member-sections";
import { ProjectMemberListView } from "@/components/members/project-member-list-view";
import { InviteGroupMembersDialog } from "@/components/members/invite-group-members-dialog";
import { MemberBulkActions } from "@/components/members/member-bulk-actions";
import { MemberListHeader } from "@/components/members/member-list-header";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { exportToCsv } from "@/lib/export/csv-exporter";
import { getCategoryColorClasses } from "@/types";
import { lazyLoad } from "@/lib/dynamic-import";
import { filterAndSortEntityMembers } from "@/lib/members/filter";
import type { EntityContext, EntityMember } from "@/types/entity-context";
import type { MemberCategory } from "@/types";

// ============================================
// Dynamic imports — 상단 액션 버튼 (클릭 전까지 로딩 불필요)
// ============================================

const MemberComparisonDashboard  = lazyLoad(() => import("@/components/members/member-comparison-dashboard").then(m => ({ default: m.MemberComparisonDashboard })), { skeletonHeight: "h-8" });
const MyFeedbackSheet            = lazyLoad(() => import("@/components/members/peer-feedback-dialog").then(m => ({ default: m.MyFeedbackSheet })), { noLoading: true });
const RewardPointsShop           = lazyLoad(() => import("@/components/members/reward-points-shop").then(m => ({ default: m.RewardPointsShop })), { noLoading: true });
const DynamicTeamManager         = lazyLoad(() => import("@/components/members/dynamic-team-manager").then(m => ({ default: m.DynamicTeamManager })), { noLoading: true });
const PartnerMatchingPanel       = lazyLoad(() => import("@/components/members/partner-matching-panel").then(m => ({ default: m.PartnerMatchingPanel })), { noLoading: true });


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
// 진입점 Props & 컴포넌트
// ============================================

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
  categoryMap: _categoryMap = {},
  categoryColorMap: _categoryColorMap = {},
  inviteCode,
  parentMembers = [],
  onUpdate,
}: MembersContentProps) {
  const isGroup = ctx.entityType === "group";

  if (isGroup) {
    return (
      <Suspense fallback={null}>
        <GroupMembersContent
          ctx={ctx}
          currentUserId={currentUserId}
          categories={categories}
          inviteCode={inviteCode}
          onUpdate={onUpdate}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
      <ProjectMembersContent
        ctx={ctx}
        currentUserId={currentUserId}
        parentMembers={parentMembers}
        onUpdate={onUpdate}
      />
    </Suspense>
  );
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
  // 스크롤 위치 복원
  useScrollRestore();

  // 상태 로직 전체를 훅으로 위임
  const {
    categoryManagerOpen,
    setCategoryManagerOpen,
    selectedCategory,
    setSelectedCategory,
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    advFilter,
    advActiveCount,
    advToggleRole,
    advSetJoinedFrom,
    advSetJoinedTo,
    advSetAttendanceMin,
    advSetAttendanceMax,
    advResetFilter,
    selectedIds,
    allSelected,
    someSelected,
    handleToggleSelectAll,
    handleToggleSelect,
    bulkLoading,
    bulkRemoveOpen,
    setBulkRemoveOpen,
    handleBulkRoleChange,
    handleBulkRemoveConfirm,
    filteredMembers,
    allMembersForList,
    isGrouped,
    handleExportCsv,
  } = useGroupMemberList(ctx, currentUserId, categories, onUpdate);

  const canManage = ctx.permissions.canManageMembers;
  const myRole = ctx.permissions.canEdit ? "leader" : "member";

  return (
    <>
      {/* 상단 액션 버튼 영역 */}
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

      {/* 카테고리 선택 */}
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
      <MemberListHeader
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        roleFilter={filters.role}
        onRoleFilterChange={(v) => setFilter("role", v)}
        sortOrder={filters.sort}
        onSortOrderChange={(v) => setFilter("sort", v)}
        advFilter={advFilter}
        advActiveCount={advActiveCount}
        onAdvToggleRole={advToggleRole}
        onAdvSetJoinedFrom={advSetJoinedFrom}
        onAdvSetJoinedTo={advSetJoinedTo}
        onAdvSetAttendanceMin={advSetAttendanceMin}
        onAdvSetAttendanceMax={advSetAttendanceMax}
        onAdvReset={advResetFilter}
      />

      {/* 일괄 선택 툴바 — canManageMembers이고 멤버가 있을 때만 */}
      {canManage && filteredMembers.length > 0 && (
        <MemberBulkActions
          allSelected={allSelected}
          someSelected={someSelected}
          selectedCount={selectedIds.size}
          bulkLoading={bulkLoading}
          onToggleSelectAll={handleToggleSelectAll}
          onBulkRoleChange={handleBulkRoleChange}
          onBulkRemoveOpen={() => setBulkRemoveOpen(true)}
        />
      )}

      {/* 멤버 목록 */}
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

      {/* 일괄 제거 확인 다이얼로그 */}
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

      {/* 카테고리 관리 시트 */}
      <MemberCategoryManager
        groupId={ctx.groupId}
        categories={categories}
        members={allMembersForList}
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        onUpdate={onUpdate}
      />

      {/* 분석/관리 섹션 모음 (위험 알림, 비활성, 역할 승격, 리포트, 스킬, 멘토, 연락처, 추세) */}
      <GroupMemberSections
        ctx={ctx}
        currentUserId={currentUserId}
        onUpdate={onUpdate}
      />

      {/* 개인 댄스 카드 섹션 (22개 카드, dynamic import로 초기 번들 분리) */}
      <MemberDanceCards
        userId={currentUserId}
        groupId={ctx.groupId}
        canEdit={ctx.permissions.canEdit}
      />
    </>
  );
}

// ============================================
// 프로젝트 멤버 콘텐츠
// ============================================

function ProjectMembersContent({
  ctx,
  currentUserId: _currentUserId,
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
  // 멤버 추가 pending 관리
  const { pending: submitting, submit: submitAddMember } = useFormSubmission();
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);

  // 검색/필터/정렬 (URL 동기화 + 디바운싱)
  const {
    filters,
    setFilter,
    searchInput,
    setSearchInput,
    debouncedSearch,
  } = useTableFilter(
    { q: "", role: "all", sort: "name" },
    { searchKey: "q", debounceMs: 500 }
  );

  const roleFilter = filters.role;
  const sortOrder = filters.sort;
  const searchQuery = debouncedSearch;

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
    toast.success(TOAST.MEMBERS.CSV_DOWNLOADED);
  };

  const projectMemberIds = new Set(ctx.members.map((m) => m.userId));
  const availableMembers = parentMembers.filter((m) => !projectMemberIds.has(m.userId));

  const handleAddMember = async () => {
    if (!selectedUserId || !ctx.projectId) return;
    await submitAddMember(async () => {
      const { error } = await supabase.from("project_members").insert({
        project_id: ctx.projectId!,
        user_id: selectedUserId,
        role: "member",
      });
      if (error) throw error;
      setSelectedUserId("");
      setAddOpen(false);
      onUpdate();
    });
  };

  const handleRemoveConfirm = async () => {
    if (!removeTargetId || !ctx.projectId) return;
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("project_id", ctx.projectId)
      .eq("user_id", removeTargetId);
    if (error) {
      toast.error(TOAST.MEMBERS.MEMBER_REMOVE_ERROR);
    } else {
      toast.success(TOAST.MEMBERS.MEMBER_REMOVED);
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

  const displayedMembers = useMemo(
    () => filterAndSortEntityMembers(ctx.members, { searchQuery, roleFilter, sortOrder, advFilter }),
    [ctx.members, searchQuery, roleFilter, sortOrder, advFilter]
  );

  return (
    <>
      {/* 헤더: 멤버 수 + 액션 버튼 */}
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
      <MemberListHeader
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        roleFilter={roleFilter}
        onRoleFilterChange={(v) => setFilter("role", v)}
        sortOrder={sortOrder}
        onSortOrderChange={(v) => setFilter("sort", v)}
        advFilter={advFilter}
        advActiveCount={advActiveCount}
        onAdvToggleRole={advToggleRole}
        onAdvSetJoinedFrom={advSetJoinedFrom}
        onAdvSetJoinedTo={advSetJoinedTo}
        onAdvSetAttendanceMin={advSetAttendanceMin}
        onAdvSetAttendanceMax={advSetAttendanceMax}
        onAdvReset={advResetFilter}
      />

      {/* 멤버 목록 */}
      <ProjectMemberListView
        displayedMembers={displayedMembers}
        totalMemberCount={ctx.members.length}
        groupId={ctx.groupId}
        canEdit={ctx.permissions.canEdit}
        canAddMember={ctx.permissions.canEdit && availableMembers.length > 0}
        onRoleChange={handleRoleChange}
        onRemove={setRemoveTargetId}
        onAddOpen={() => setAddOpen(true)}
      />

      {/* 멤버 제거 확인 다이얼로그 */}
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
