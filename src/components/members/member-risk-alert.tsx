"use client";

import { useState } from "react";
import { AlertTriangle, TrendingDown, Wallet, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemberRisk } from "@/hooks/use-member-risk";
import type { EntityContext } from "@/types/entity-context";

// ============================================
// Props
// ============================================

type MemberRiskAlertProps = {
  ctx: EntityContext;
};

// ============================================
// 위험 등급 스타일 매핑
// ============================================

const RISK_STYLES = {
  high: {
    badge: "bg-red-100 text-red-700 border-red-300",
    label: "높음",
    dot: "bg-red-500",
  },
  medium: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    label: "보통",
    dot: "bg-orange-500",
  },
} as const;

// ============================================
// 컴포넌트
// ============================================

export function MemberRiskAlert({ ctx }: MemberRiskAlertProps) {
  const [open, setOpen] = useState(false);

  // 리더/매니저 권한 확인
  const canView = ctx.permissions.canEdit || ctx.permissions.canManageMembers;

  const { riskMembers, loading } = useMemberRisk(ctx.groupId, ctx.members);

  // 리더/매니저가 아니거나, 로딩 중이거나, 위험 멤버가 없으면 숨김
  if (!canView || loading || riskMembers.length === 0) return null;

  const highCount = riskMembers.filter((m) => m.riskLevel === "high").length;
  const totalCount = riskMembers.length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-orange-200 bg-orange-50/60 mt-4 overflow-hidden">
        {/* 헤더 트리거 */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-3 py-2.5 h-auto rounded-none hover:bg-orange-100/50 text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="text-xs font-semibold text-orange-800">
                출석/납부 주의 멤버
              </span>
              <Badge
                className={`text-[10px] px-1.5 py-0 border ${
                  highCount > 0
                    ? "bg-red-100 text-red-700 border-red-300"
                    : "bg-orange-100 text-orange-700 border-orange-300"
                }`}
              >
                {totalCount}명
              </Badge>
              {highCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border border-red-300">
                  높음 {highCount}
                </Badge>
              )}
            </div>
            {open ? (
              <ChevronUp className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* 멤버 목록 */}
        <CollapsibleContent>
          <div className="border-t border-orange-200 divide-y divide-orange-100">
            {riskMembers.map((member) => {
              const style = RISK_STYLES[member.riskLevel];
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-2.5 px-3 py-2"
                >
                  {/* 아바타 */}
                  <Avatar className="h-6 w-6 shrink-0">
                    {member.avatarUrl && (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* 이름 */}
                  <span className="text-xs font-medium text-gray-800 min-w-0 truncate flex-1">
                    {member.name}
                  </span>

                  {/* 출석률 */}
                  {member.isAttendanceRisk && (
                    <div className="flex items-center gap-1 shrink-0">
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      <span className="text-[11px] text-orange-700 font-medium">
                        {member.attendanceRate}%
                      </span>
                    </div>
                  )}

                  {/* 미납 건수 */}
                  {member.isPaymentRisk && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Wallet className="h-3 w-3 text-red-400" />
                      <span className="text-[11px] text-red-600 font-medium">
                        미납 {member.unpaidCount}건
                      </span>
                    </div>
                  )}

                  {/* 위험 등급 배지 */}
                  <Badge
                    className={`text-[10px] px-1.5 py-0 border shrink-0 ${style.badge}`}
                  >
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${style.dot}`}
                    />
                    {style.label}
                  </Badge>
                </div>
              );
            })}

            {/* 범례 */}
            <div className="px-3 py-2 bg-orange-50/80">
              <p className="text-[10px] text-orange-600 leading-relaxed">
                <span className="font-semibold text-red-600">높음</span>: 출석률 50% 미만 + 미납 1건 이상 &nbsp;|&nbsp;
                <span className="font-semibold text-orange-600">보통</span>: 출석률 50% 미만 또는 미납 1건 이상
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
