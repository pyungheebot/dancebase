"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EntityContext } from "@/types/entity-context";
import type { Group } from "@/types";
import { useGroupSettings } from "@/hooks/use-group-settings";
import { ActivityLogSection } from "@/components/settings/activity-log-section";
import { ReminderSettingsSection } from "@/components/settings/reminder-settings-section";
import { PermissionAuditSection } from "@/components/settings/permission-audit-section";
import { NotificationPreferencesSection } from "@/components/settings/notification-preferences-section";
import { NotificationRulesBuilder } from "@/components/settings/notification-rules-builder";
import { GroupRulesEditor } from "@/components/groups/group-rules-editor";
import { PaymentMethodManager } from "@/components/finance/payment-method-manager";
import { GroupBasicSection } from "@/components/settings/group-basic-section";
import { GroupInviteSection } from "@/components/settings/group-invite-section";
import { GroupMemberManageSection } from "@/components/settings/group-member-manage-section";
import { GroupCategorySection } from "@/components/settings/group-category-section";
import { GroupDangerSection } from "@/components/settings/group-danger-section";

type GroupSettingsContentProps = {
  ctx: EntityContext;
  group: Group;
};

export function GroupSettingsContent({ ctx, group }: GroupSettingsContentProps) {
  const s = useGroupSettings(ctx, group);
  const { features } = ctx;

  return (
    <>
      {/* 상위 그룹 정보 (하위그룹인 경우) */}
      {ctx.parentGroupId && ctx.breadcrumbs.length > 0 && (
        <div className="mb-2 text-xs text-muted-foreground">
          상위 그룹:{" "}
          <Link
            href={ctx.breadcrumbs[ctx.breadcrumbs.length - 1].href}
            className="inline-flex items-center gap-0.5 text-foreground hover:underline"
          >
            {ctx.breadcrumbs[ctx.breadcrumbs.length - 1].label}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <h2 className="text-xs font-medium mb-2">그룹 설정</h2>

      <div className="space-y-4 max-w-2xl">
        {/* 멤버 관리 (가입 신청 + 권한 관리) */}
        <GroupMemberManageSection
          ctx={ctx}
          joinRequests={s.joinRequests}
          processingRequest={s.processingRequest}
          updatingRoleUserId={s.updatingRoleUserId}
          currentUserId={s.user?.id}
          isGroupLeader={s.isGroupLeader}
          showJoinRequests={features.joinRequests && group?.join_policy === "approval"}
          onApproveRequest={s.handleApproveRequest}
          onRejectRequest={s.handleRejectRequest}
          onRoleChange={s.handleRoleChange}
        />

        {/* 기본 정보 (이미지 + 폼 + 저장 버튼) */}
        <GroupBasicSection
          group={group}
          groupForm={s.groupForm}
          avatarPreview={s.avatarPreview}
          avatarUploading={s.avatarUploading}
          saving={s.saving}
          onGroupFieldChange={(key, value) => s.setGroupForm((prev) => ({ ...prev, [key]: value }))}
          onAvatarChange={s.handleAvatarChange}
          onSave={s.handleSave}
          message={s.message}
        />

        {/* 초대 코드 */}
        {features.memberInvite && group && (
          <GroupInviteSection
            group={group}
            inviteCodeEnabled={s.inviteCodeEnabled}
            inviteCodeExpiry={s.inviteCodeExpiry}
            regenerating={s.regenerating}
            savingInviteSettings={s.savingInviteSettings}
            onInviteCodeEnabledChange={s.setInviteCodeEnabled}
            onInviteCodeExpiryChange={s.setInviteCodeExpiry}
            onRegenerate={s.handleRegenerateInviteCode}
            onSaveInviteSettings={s.handleSaveInviteSettings}
          />
        )}

        {/* 게시판 카테고리 (리더 전용) */}
        {s.isGroupLeader && features.board && (
          <GroupCategorySection
            boardCategoryList={s.boardCategoryList}
            newCategoryName={s.newCategoryName}
            addingCategory={s.addingCategory}
            deletingCategoryId={s.deletingCategoryId}
            onNewCategoryNameChange={s.setNewCategoryName}
            onAddCategory={s.handleAddCategory}
            onDeleteCategory={s.handleDeleteCategory}
          />
        )}

        {/* 정산 수단 관리 (리더 전용) */}
        {s.isGroupLeader && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-semibold">정산 수단 관리</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground mb-3">
                멤버에게 정산 요청 시 표시될 계좌 또는 간편결제 정보를 등록합니다.
              </p>
              <PaymentMethodManager groupId={ctx.groupId} />
            </CardContent>
          </Card>
        )}

        {/* 그룹 규칙/공지 배너 (리더/서브리더) */}
        {(ctx.permissions.canEdit || ctx.permissions.canManageMembers) && (
          <GroupRulesEditor
            groupId={ctx.groupId}
            canEdit={ctx.permissions.canEdit || ctx.permissions.canManageMembers}
          />
        )}

        {/* 알림 설정 (리더 전용) */}
        {s.isGroupLeader && (
          <ReminderSettingsSection entityType="group" entityId={ctx.groupId} />
        )}

        {/* 개인 알림 구독 설정 (모든 멤버) */}
        <NotificationPreferencesSection groupId={ctx.groupId} userId={s.user?.id} />

        {/* 알림 규칙 빌더 (리더 전용) */}
        {s.isGroupLeader && <NotificationRulesBuilder groupId={ctx.groupId} />}

        {/* 활동 기록 (리더 전용) */}
        {s.isGroupLeader && (
          <ActivityLogSection entityType="group" entityId={ctx.groupId} />
        )}

        {/* 권한 감사 로그 (리더 전용) */}
        {s.isGroupLeader && <PermissionAuditSection groupId={ctx.groupId} />}

        {/* 위험 구역 (탈퇴/해산) */}
        <GroupDangerSection
          group={group}
          isGroupLeader={s.isGroupLeader}
          leavingGroup={s.leavingGroup}
          dissolvingGroup={s.dissolvingGroup}
          onLeaveGroup={s.handleLeaveGroup}
          onDissolveGroup={s.handleDissolveGroup}
        />
      </div>
    </>
  );
}
