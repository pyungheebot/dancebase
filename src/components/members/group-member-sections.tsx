"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp } from "lucide-react";
import { lazyLoad } from "@/lib/dynamic-import";
import type { EntityContext } from "@/types/entity-context";

// ============================================
// Dynamic imports — 그룹 멤버 분석/관리 섹션
// ============================================

const InactiveMembersSection     = lazyLoad(() => import("@/components/members/inactive-members-section").then(m => ({ default: m.InactiveMembersSection })), { skeletonHeight: "h-32" });
const MemberActivityReport       = lazyLoad(() => import("@/components/members/member-activity-report").then(m => ({ default: m.MemberActivityReport })), { skeletonHeight: "h-32" });
const MemberActivityTrendChart   = lazyLoad(() => import("@/components/members/member-activity-trend-chart").then(m => ({ default: m.MemberActivityTrendChart })), { skeletonHeight: "h-24" });
const SkillMatrixSection         = lazyLoad(() => import("@/components/members/skill-matrix-section").then(m => ({ default: m.SkillMatrixSection })), { skeletonHeight: "h-32" });
const SkillMatrixCard            = lazyLoad(() => import("@/components/groups/skill-matrix-card").then(m => ({ default: m.SkillMatrixCard })), { skeletonHeight: "h-32" });
const ContactVerificationSection = lazyLoad(() => import("@/components/members/contact-verification-section").then(m => ({ default: m.ContactVerificationSection })), { skeletonHeight: "h-32" });
const ContactVerifyBanner        = lazyLoad(() => import("@/components/members/contact-verify-banner").then(m => ({ default: m.ContactVerifyBanner })), { skeletonHeight: "h-12" });
const RolePromotionSection       = lazyLoad(() => import("@/components/members/role-promotion-section").then(m => ({ default: m.RolePromotionSection })), { skeletonHeight: "h-32" });
const MemberRiskAlert            = lazyLoad(() => import("@/components/members/member-risk-alert").then(m => ({ default: m.MemberRiskAlert })), { noLoading: true });
const MentorMenteeSection        = lazyLoad(() => import("@/components/members/mentor-mentee-section").then(m => ({ default: m.MentorMenteeSection })), { skeletonHeight: "h-32" });

// ============================================
// Props
// ============================================

type GroupMemberSectionsProps = {
  /** 엔티티 컨텍스트 */
  ctx: EntityContext;
  /** 현재 사용자 ID */
  currentUserId: string;
  /** 데이터 갱신 콜백 */
  onUpdate: () => void;
};

// ============================================
// 컴포넌트
// ============================================

/**
 * 그룹 멤버 페이지의 분석/관리 섹션 모음.
 * 위험 알림, 비활성 멤버, 역할 승격, 활동 리포트, 스킬 매트릭스,
 * 멘토-멘티, 연락처 확인, 활동 추세 차트를 포함합니다.
 */
export function GroupMemberSections({
  ctx,
  currentUserId,
  onUpdate,
}: GroupMemberSectionsProps) {
  // 활동 추세 차트용 선택 멤버 (이 컴포넌트 내에서만 필요한 UI 상태)
  const [trendUserId, setTrendUserId] = useState<string>("");

  return (
    <>
      {/* 출석/납부 위험 멤버 경고 (리더/매니저 전용, 위험 멤버 없으면 숨김) */}
      <MemberRiskAlert ctx={ctx} />

      {/* 비활성 멤버 섹션 (리더 전용, 비활성 멤버 없으면 숨김) */}
      <InactiveMembersSection ctx={ctx} />

      {/* 역할 자동 승격 제안 (canEdit 권한 + 멤버 존재 시) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <RolePromotionSection
          groupId={ctx.groupId}
          members={ctx.members}
          onUpdate={onUpdate}
        />
      )}

      {/* 멤버 활동 리포트 (canEdit 권한) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <MemberActivityReport
          groupId={ctx.groupId}
          groupName={ctx.header.name}
          members={ctx.members}
        />
      )}

      {/* 멤버 역량 맵 (canEdit 권한) */}
      {ctx.permissions.canEdit && ctx.members.length > 0 && (
        <SkillMatrixSection
          groupId={ctx.groupId}
          members={ctx.members}
          canEdit={ctx.permissions.canEdit}
        />
      )}

      {/* 기술 매트릭스 (목표 레벨/평가일 포함 - localStorage 기반) */}
      <SkillMatrixCard groupId={ctx.groupId} />

      {/* 멘토-멘티 매칭 */}
      {ctx.members.length > 0 && (
        <MentorMenteeSection
          groupId={ctx.groupId}
          members={ctx.members}
          canManage={ctx.permissions.canEdit}
        />
      )}

      {/* 연락처 재확인 배너 (일반 멤버 전용) */}
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
              <Select value={trendUserId} onValueChange={setTrendUserId}>
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
    </>
  );
}
