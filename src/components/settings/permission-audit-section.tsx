"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserMinus,
  ShieldPlus,
  ShieldMinus,
} from "lucide-react";
import { usePermissionAudits } from "@/hooks/use-permission-audits";
import type { PermissionAudit } from "@/types";

type ActionFilter = PermissionAudit["action"] | "all";

const ACTION_LABELS: Record<PermissionAudit["action"], string> = {
  role_change: "역할 변경",
  member_add: "멤버 추가",
  member_remove: "멤버 제거",
  permission_grant: "권한 부여",
  permission_revoke: "권한 박탈",
};

const ACTION_FILTER_OPTIONS: { value: ActionFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "role_change", label: "역할 변경" },
  { value: "member_add", label: "멤버 추가" },
  { value: "member_remove", label: "멤버 제거" },
  { value: "permission_grant", label: "권한 부여" },
  { value: "permission_revoke", label: "권한 박탈" },
];

function getActionIcon(action: PermissionAudit["action"]) {
  switch (action) {
    case "role_change":
      return <UserCog className="h-3.5 w-3.5" />;
    case "member_add":
      return <UserPlus className="h-3.5 w-3.5" />;
    case "member_remove":
      return <UserMinus className="h-3.5 w-3.5" />;
    case "permission_grant":
      return <ShieldPlus className="h-3.5 w-3.5" />;
    case "permission_revoke":
      return <ShieldMinus className="h-3.5 w-3.5" />;
  }
}

function getActionBadgeClass(action: PermissionAudit["action"]): string {
  switch (action) {
    case "role_change":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "member_add":
      return "bg-green-100 text-green-700 border-green-200";
    case "member_remove":
      return "bg-red-100 text-red-700 border-red-200";
    case "permission_grant":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "permission_revoke":
      return "bg-orange-100 text-orange-700 border-orange-200";
  }
}

function getActionDotClass(action: PermissionAudit["action"]): string {
  switch (action) {
    case "role_change":
      return "bg-blue-400";
    case "member_add":
      return "bg-green-400";
    case "member_remove":
      return "bg-red-400";
    case "permission_grant":
      return "bg-purple-400";
    case "permission_revoke":
      return "bg-orange-400";
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRoleLabel(value: string | null): string {
  if (!value) return "알 수 없음";
  switch (value) {
    case "leader": return "리더";
    case "sub_leader": return "부리더";
    case "member": return "멤버";
    default: return value;
  }
}

function buildDescription(
  action: PermissionAudit["action"],
  actorName: string,
  targetName: string,
  oldValue: string | null,
  newValue: string | null,
  description: string | null
): string {
  if (description) return description;

  switch (action) {
    case "role_change":
      if (oldValue && newValue) {
        return `${actorName}님이 ${targetName}님의 역할을 ${getRoleLabel(oldValue)}에서 ${getRoleLabel(newValue)}로 변경했습니다`;
      }
      return `${actorName}님이 ${targetName}님의 역할을 변경했습니다`;
    case "member_add":
      return `${actorName}님이 ${targetName}님을 그룹에 추가했습니다`;
    case "member_remove":
      return `${actorName}님이 ${targetName}님을 그룹에서 제거했습니다`;
    case "permission_grant":
      return `${actorName}님이 ${targetName}님에게 ${newValue ?? "권한"}을 부여했습니다`;
    case "permission_revoke":
      return `${actorName}님이 ${targetName}님의 ${oldValue ?? "권한"}을 박탈했습니다`;
  }
}

type PermissionAuditSectionProps = {
  groupId: string;
};

export function PermissionAuditSection({ groupId }: PermissionAuditSectionProps) {
  const { audits, loading } = usePermissionAudits(groupId);
  const [filter, setFilter] = useState<ActionFilter>("all");

  const filtered = filter === "all"
    ? audits
    : audits.filter((a) => a.action === filter);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            권한 감사 로그
            {!loading && audits.length > 0 && (
              <span className="text-muted-foreground font-normal">
                (최근 {audits.length}건)
              </span>
            )}
          </CardTitle>
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as ActionFilter)}
          >
            <SelectTrigger className="h-7 text-xs w-[110px]">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <ShieldCheck className="h-8 w-8 opacity-30" />
            <p className="text-xs">
              {filter === "all" ? "기록된 권한 변경이 없습니다" : "해당 유형의 기록이 없습니다"}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* 타임라인 세로선 */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

            <div className="space-y-3">
              {filtered.map((audit) => {
                const actorName = audit.actor?.name ?? "알 수 없음";
                const targetName = audit.target?.name ?? "알 수 없음";
                const desc = buildDescription(
                  audit.action,
                  actorName,
                  targetName,
                  audit.old_value,
                  audit.new_value,
                  audit.description
                );

                return (
                  <div key={audit.id} className="flex items-start gap-3 pl-1">
                    {/* 타임라인 도트 + 아이콘 */}
                    <div
                      className={`relative z-10 flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0 mt-0.5 ${getActionDotClass(audit.action)} text-white`}
                    >
                      {getActionIcon(audit.action)}
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 border ${getActionBadgeClass(audit.action)}`}
                        >
                          {ACTION_LABELS[audit.action]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDateTime(audit.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
