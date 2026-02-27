"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  UserPlus,
  X,
  Users2,
} from "lucide-react";
import { useAttendanceComparisonDetail } from "@/hooks/use-attendance-comparison-detail";
import type { EntityContext } from "@/types/entity-context";

// 멤버별 고유 색상 팔레트 (최대 5명)
const MEMBER_COLORS = [
  {
    bar: "bg-blue-500",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    bar: "bg-orange-500",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  {
    bar: "bg-purple-500",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  {
    bar: "bg-pink-500",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700 border-pink-200",
    dot: "bg-pink-500",
  },
] as const;

const MAX_SELECT = 5;

function getLocalStorageKey(groupId: string) {
  return `dancebase:att-compare:${groupId}`;
}

function loadFromStorage(groupId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getLocalStorageKey(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function saveToStorage(groupId: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getLocalStorageKey(groupId),
      JSON.stringify(ids)
    );
  } catch {
    // storage 오류 무시
  }
}

// 로딩 스켈레톤
function ComparisonSkeleton() {
  return (
    <div className="space-y-3">
      {/* 테이블 스켈레톤 */}
      <div className="border rounded-md overflow-hidden">
        <div className="bg-muted/40 px-3 py-2 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-3 py-2.5 grid grid-cols-5 gap-2 border-t">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-3 w-full" />
            ))}
          </div>
        ))}
      </div>
      {/* 막대 차트 스켈레톤 */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  ctx: EntityContext;
};

export function AttendanceComparisonDetailCard({ ctx }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const initialized = useRef(false);

  // 멤버 표시 이름 맵 (userId -> { name, avatarUrl })
  const memberMap = useMemo<
    Record<string, { name: string; avatarUrl: string | null }>
  >(() => {
    return Object.fromEntries(
      ctx.members.map((m) => [
        m.userId,
        {
          name: m.nickname ?? m.profile.name,
          avatarUrl: m.profile.avatar_url,
        },
      ])
    );
  }, [ctx.members]);

  // localStorage에서 초기값 복원 (마운트 시 1회)
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const stored = loadFromStorage(ctx.groupId);
    // 그룹 멤버로 여전히 존재하는 userId만 유지
    const validIds = stored.filter((id) =>
      ctx.members.some((m) => m.userId === id)
    );
    setSelectedUserIds(validIds.slice(0, MAX_SELECT));
  }, [ctx.groupId, ctx.members]);

  // 선택 변경 시 localStorage 동기화
  useEffect(() => {
    if (!initialized.current) return;
    saveToStorage(ctx.groupId, selectedUserIds);
  }, [ctx.groupId, selectedUserIds]);

  // 선택되지 않은 멤버 목록 (드롭다운에 표시)
  const availableMembers = useMemo(
    () => ctx.members.filter((m) => !selectedUserIds.includes(m.userId)),
    [ctx.members, selectedUserIds]
  );

  const handleAdd = (userId: string) => {
    if (selectedUserIds.length >= MAX_SELECT) return;
    setSelectedUserIds((prev) => [...prev, userId]);
  };

  const handleRemove = (userId: string) => {
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  // 색상 맵 (선택 순서 기준)
  const colorMap = useMemo(
    () =>
      Object.fromEntries(
        selectedUserIds.map((id, idx) => [
          id,
          MEMBER_COLORS[idx % MEMBER_COLORS.length],
        ])
      ),
    [selectedUserIds]
  );

  const { data, loading } = useAttendanceComparisonDetail(
    ctx.groupId,
    selectedUserIds,
    memberMap,
    ctx.projectId
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        {/* 카드 헤더 */}
        <CardHeader className="pb-2">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left group">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                멤버 출석 비교
                <span className="text-xs font-normal text-muted-foreground">
                  (2~5명 선택)
                </span>
              </CardTitle>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* 멤버 선택 영역 */}
            <div className="flex flex-wrap items-center gap-2">
              {/* 선택된 멤버 Badge */}
              {selectedUserIds.map((userId) => {
                const color = colorMap[userId];
                const name = memberMap[userId]?.name ?? userId;
                return (
                  <Badge
                    key={userId}
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 gap-1 ${color.badge} flex items-center`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${color.dot} shrink-0`}
                    />
                    {name}
                    <button
                      onClick={() => handleRemove(userId)}
                      className="ml-0.5 hover:opacity-70 transition-opacity"
                      aria-label={`${name} 제거`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}

              {/* 멤버 추가 드롭다운 */}
              {selectedUserIds.length < MAX_SELECT &&
                availableMembers.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                      >
                        <UserPlus className="h-3 w-3" />
                        멤버 추가
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-60 overflow-y-auto">
                      {availableMembers.map((member) => (
                        <DropdownMenuItem
                          key={member.userId}
                          onSelect={() => handleAdd(member.userId)}
                          className="text-xs"
                        >
                          {member.nickname ?? member.profile.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

              {/* 최대 선택 안내 */}
              {selectedUserIds.length >= MAX_SELECT && (
                <span className="text-[11px] text-muted-foreground">
                  최대 {MAX_SELECT}명 선택됨
                </span>
              )}
            </div>

            {/* 선택 없음 안내 */}
            {selectedUserIds.length === 0 && (
              <div className="py-8 text-center border rounded-md bg-muted/20">
                <Users2 className="h-7 w-7 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  비교할 멤버를 추가하세요 (최소 2명)
                </p>
              </div>
            )}

            {/* 멤버 1명만 선택 시 안내 */}
            {selectedUserIds.length === 1 && !loading && (
              <div className="py-4 text-center border rounded-md bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  멤버를 1명 이상 더 추가하면 비교 데이터가 표시됩니다
                </p>
              </div>
            )}

            {/* 로딩 스켈레톤 */}
            {selectedUserIds.length >= 2 && loading && <ComparisonSkeleton />}

            {/* 데이터 없음 */}
            {selectedUserIds.length >= 2 &&
              !loading &&
              !data.hasData &&
              data.members.length > 0 && (
                <div className="py-4 text-center border rounded-md">
                  <p className="text-xs text-muted-foreground">
                    출석 기록이 없습니다
                  </p>
                </div>
              )}

            {/* 비교 테이블 + 막대 차트 */}
            {selectedUserIds.length >= 2 && !loading && data.members.length > 0 && (
              <div className="space-y-4">
                {/* ===== 비교 테이블 ===== */}
                <div className="border rounded-md overflow-hidden text-xs">
                  {/* 헤더 행 */}
                  <div className="grid grid-cols-5 bg-muted/40 px-3 py-2 font-medium text-muted-foreground">
                    <div>멤버</div>
                    <div className="text-right">출석률</div>
                    <div className="text-right">출석</div>
                    <div className="text-right">결석</div>
                    <div className="text-right">지각</div>
                  </div>

                  {/* 데이터 행 */}
                  {data.members.map((member) => {
                    const color = colorMap[member.userId];
                    return (
                      <div
                        key={member.userId}
                        className="grid grid-cols-5 px-3 py-2.5 border-t items-center"
                      >
                        {/* 멤버 이름 */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`inline-block w-2 h-2 rounded-full shrink-0 ${color.dot}`}
                          />
                          <span className="truncate font-medium">
                            {member.name}
                          </span>
                        </div>

                        {/* 출석률 */}
                        <div
                          className={`text-right font-bold tabular-nums ${color.text}`}
                        >
                          {member.attendanceRate}%
                        </div>

                        {/* 출석 횟수 */}
                        <div className="text-right tabular-nums text-green-700">
                          {member.presentCount}
                        </div>

                        {/* 결석 횟수 */}
                        <div className="text-right tabular-nums text-red-600">
                          {member.absentCount}
                        </div>

                        {/* 지각 횟수 */}
                        <div className="text-right tabular-nums text-yellow-600">
                          {member.lateCount}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ===== CSS 막대 차트 (출석률) ===== */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-medium text-muted-foreground">
                    출석률 비교
                  </p>
                  {data.members.map((member) => {
                    const color = colorMap[member.userId];
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center gap-2"
                      >
                        {/* 이름 레이블 */}
                        <div className="w-20 shrink-0 text-[11px] truncate text-right text-muted-foreground">
                          {member.name}
                        </div>

                        {/* 막대 */}
                        <div className="flex-1 bg-muted rounded-full overflow-hidden h-4">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${color.bar}`}
                            style={{
                              width: `${Math.max(member.attendanceRate, member.attendanceRate > 0 ? 2 : 0)}%`,
                            }}
                          />
                        </div>

                        {/* 퍼센트 */}
                        <div
                          className={`w-9 shrink-0 text-[11px] font-bold tabular-nums text-right ${color.text}`}
                        >
                          {member.attendanceRate}%
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 안내 텍스트 */}
                <p className="text-[11px] text-muted-foreground">
                  * 출석률 = (출석 + 지각) / 전체 일정 수 × 100
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
