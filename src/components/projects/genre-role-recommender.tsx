"use client";

import { useState, useMemo } from "react";
import { Star, Users, Award, Zap, Music } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGenreRoleRecommendation } from "@/hooks/use-genre-role-recommendation";
import type { DanceRole, RoleRecommendation, RoleRecommendationReason } from "@/types";
import type { EntityMember } from "@/types/entity-context";

// ============================================
// 역할 메타데이터
// ============================================

const ALL_ROLES: DanceRole[] = [
  "메인 댄서",
  "서포트 댄서",
  "리드",
  "트레이니",
  "코레오그래퍼",
];

const ROLE_STYLES: Record<DanceRole, { badge: string; icon: React.ReactNode }> = {
  "메인 댄서": {
    badge: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    icon: <Star className="h-3 w-3" />,
  },
  "서포트 댄서": {
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    icon: <Users className="h-3 w-3" />,
  },
  "리드": {
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    icon: <Award className="h-3 w-3" />,
  },
  "트레이니": {
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: <Zap className="h-3 w-3" />,
  },
  "코레오그래퍼": {
    badge: "bg-red-100 text-red-700 hover:bg-red-100",
    icon: <Music className="h-3 w-3" />,
  },
};

// 이유 레이블: ReasonText 수치 표시 보완용 태그
const REASON_TAG_LABELS: Record<RoleRecommendationReason, string> = {
  "출석률 높음": "출석 우수",
  "활동량 높음": "활발",
  "신규 멤버": "신규",
  "피어 피드백 높음": "신뢰도",
  "장기 활동": "장기",
};

// ============================================
// 역할 배지 컴포넌트
// ============================================

function RoleBadge({ role }: { role: DanceRole }) {
  const styles = ROLE_STYLES[role];
  return (
    <Badge
      className={`text-[10px] px-1.5 py-0 font-normal flex items-center gap-0.5 ${styles.badge}`}
    >
      {styles.icon}
      {role}
    </Badge>
  );
}

// ============================================
// 추천 이유 텍스트
// ============================================

function ReasonText({ reasons, attendanceRate, activityScore, memberDays }: {
  reasons: RoleRecommendationReason[];
  attendanceRate: number;
  activityScore: number;
  memberDays: number;
}) {
  const parts: string[] = [];

  if (reasons.includes("출석률 높음")) {
    parts.push(`${REASON_TAG_LABELS["출석률 높음"]} ${attendanceRate}%`);
  }
  if (reasons.includes("활동량 높음") && activityScore > 0) {
    parts.push(`${REASON_TAG_LABELS["활동량 높음"]} ${activityScore}건`);
  }
  if (reasons.includes("장기 활동")) {
    parts.push(`${REASON_TAG_LABELS["장기 활동"]} ${memberDays}일`);
  }
  if (reasons.includes("신규 멤버")) {
    parts.push(`${REASON_TAG_LABELS["신규 멤버"]} (가입 ${memberDays}일)`);
  }
  if (reasons.includes("피어 피드백 높음")) {
    parts.push(REASON_TAG_LABELS["피어 피드백 높음"]);
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
      {parts.join(" · ")}
    </p>
  );
}

// ============================================
// 멤버 행 컴포넌트
// ============================================

function MemberRoleRow({
  rec,
  effectiveRole,
  onRoleChange,
}: {
  rec: RoleRecommendation;
  effectiveRole: DanceRole;
  onRoleChange: (userId: string, role: DanceRole) => void;
}) {
  const initials = rec.name.charAt(0).toUpperCase();
  const isOverridden = rec.overriddenRole !== null && rec.overriddenRole !== rec.recommendedRole;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      {/* 아바타 */}
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* 이름 + 이유 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium truncate">{rec.name}</span>
          {isOverridden && (
            <span className="text-[10px] text-muted-foreground">(변경됨)</span>
          )}
        </div>
        <ReasonText
          reasons={rec.reasons}
          attendanceRate={rec.attendanceRate}
          activityScore={rec.activityScore}
          memberDays={rec.memberDays}
        />
      </div>

      {/* 추천 배지 + 선택 */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <RoleBadge role={rec.recommendedRole} />
        <Select
          value={effectiveRole}
          onValueChange={(v) => onRoleChange(rec.userId, v as DanceRole)}
        >
          <SelectTrigger
            size="sm"
            className="h-6 text-[10px] w-[100px] px-2"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map((role) => (
              <SelectItem key={role} value={role} className="text-xs">
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================
// 빈 상태
// ============================================

function RecommenderEmptyState({ memberCount }: { memberCount: number }) {
  if (memberCount === 0) {
    return (
      <EmptyState
        icon={Users}
        title="멤버가 없습니다"
        description="역할 추천을 위해 멤버가 필요합니다."
      />
    );
  }

  return (
    <EmptyState
      icon={Star}
      title="데이터를 불러오는 중입니다"
      description="출석 및 활동 데이터를 분석하고 있습니다."
    />
  );
}

// ============================================
// 역할별 요약
// ============================================

function RoleSummary({ roleMap }: { roleMap: Record<DanceRole, number> }) {
  const entries = ALL_ROLES.filter((r) => (roleMap[r] ?? 0) > 0);
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 pt-1 pb-3 border-b">
      {entries.map((role) => (
        <div key={role} className="flex items-center gap-1">
          <RoleBadge role={role} />
          <span className="text-[10px] text-muted-foreground">
            {roleMap[role]}명
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// GenreRoleRecommender (메인 컴포넌트)
// ============================================

type GenreRoleRecommenderProps = {
  groupId: string;
  members: EntityMember[];
  trigger?: React.ReactNode;
};

export function GenreRoleRecommender({
  groupId,
  members,
  trigger,
}: GenreRoleRecommenderProps) {
  const [open, setOpen] = useState(false);

  const {
    recommendations,
    loading,
    state,
    getEffectiveRole,
    applyAll,
    resetAll,
  } = useGenreRoleRecommendation(groupId, members);

  // 현재 Override 포함 역할 맵 (행 관리용 로컬 상태 역할)
  const [localOverrides, setLocalOverrides] = useState<Record<string, DanceRole>>({});

  // Dialog 열릴 때 저장된 assignments로 로컬 override 초기화
  function handleOpenChange(next: boolean) {
    if (next) {
      setLocalOverrides({ ...state.assignments });
    }
    setOpen(next);
  }

  function handleRoleChange(userId: string, role: DanceRole) {
    setLocalOverrides((prev) => ({ ...prev, [userId]: role }));
  }

  function getDisplayRole(rec: RoleRecommendation): DanceRole {
    return localOverrides[rec.userId] ?? getEffectiveRole(rec.userId, rec.recommendedRole);
  }

  // 역할별 카운트 (요약용)
  const roleMap = useMemo((): Record<DanceRole, number> => {
    const map = {} as Record<DanceRole, number>;
    for (const rec of recommendations) {
      const role = localOverrides[rec.userId] ?? getEffectiveRole(rec.userId, rec.recommendedRole);
      map[role] = (map[role] ?? 0) + 1;
    }
    return map;
  }, [recommendations, localOverrides, getEffectiveRole]);

  function handleApply() {
    // 최종 assignments 구성: 추천과 다른 경우만 저장
    const finalAssignments: Record<string, DanceRole> = {};
    for (const rec of recommendations) {
      const chosen = localOverrides[rec.userId] ?? rec.recommendedRole;
      finalAssignments[rec.userId] = chosen;
    }
    applyAll(finalAssignments);
    toast.success("역할 배정이 저장되었습니다.");
    setOpen(false);
  }

  function handleReset() {
    setLocalOverrides({});
    resetAll();
    toast.success("역할 배정이 초기화되었습니다.");
  }

  const hasSaved = state.savedAt !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <Star className="h-3 w-3 mr-1" />
            역할 추천
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-md p-0 gap-0">
        {/* 헤더 */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-purple-500 shrink-0" />
            <DialogTitle className="text-sm font-semibold">
              장르 역할 추천
            </DialogTitle>
            {recommendations.length > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 hover:bg-purple-100 ml-auto">
                {recommendations.length}명
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            출석률·활동 데이터 기반으로 프로젝트 역할을 추천합니다.
          </p>
          {hasSaved && state.savedAt && (
            <p className="text-[10px] text-muted-foreground/60">
              마지막 저장:{" "}
              {new Date(state.savedAt).toLocaleString("ko-KR", {
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </DialogHeader>

        {/* 역할 요약 */}
        {recommendations.length > 0 && (
          <div className="px-5 pt-3">
            <RoleSummary roleMap={roleMap} />
          </div>
        )}

        {/* 본문 */}
        <ScrollArea className="h-[360px] px-5">
          {loading ? (
            <div className="flex flex-col gap-2 py-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg border bg-muted/30 animate-pulse"
                />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <RecommenderEmptyState memberCount={members.length} />
          ) : (
            <div className="py-1">
              {recommendations.map((rec) => (
                <MemberRoleRow
                  key={rec.userId}
                  rec={rec}
                  effectiveRole={getDisplayRole(rec)}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* 푸터 */}
        <DialogFooter className="px-5 py-3 border-t gap-2 flex-row justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={handleReset}
            disabled={loading || recommendations.length === 0}
          >
            초기화
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              닫기
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleApply}
              disabled={loading || recommendations.length === 0}
            >
              <Award className="h-3 w-3 mr-1" />
              적용
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
