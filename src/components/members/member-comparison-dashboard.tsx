"use client";

import { useState } from "react";
import { BarChart3, Users, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberComparison } from "@/hooks/use-member-comparison";
import type { EntityMember } from "@/types/entity-context";
import type { MemberComparisonData } from "@/types";

// ── 멤버별 고정 색상 팔레트 (최대 5명) ──
const MEMBER_COLORS = [
  { bg: "bg-blue-500",   text: "text-blue-600",   hex: "#3b82f6" },
  { bg: "bg-violet-500", text: "text-violet-600",  hex: "#8b5cf6" },
  { bg: "bg-emerald-500",text: "text-emerald-600", hex: "#10b981" },
  { bg: "bg-orange-500", text: "text-orange-600",  hex: "#f97316" },
  { bg: "bg-rose-500",   text: "text-rose-600",    hex: "#f43f5e" },
] as const;

const MAX_SELECTION = 5;

// ── 아바타 컴포넌트 ──
function MemberAvatar({
  name,
  avatarUrl,
  colorIdx,
  size = "sm",
}: {
  name: string;
  avatarUrl: string | null;
  colorIdx: number;
  size?: "sm" | "xs";
}) {
  const color = MEMBER_COLORS[colorIdx % MEMBER_COLORS.length];
  const sizeClass = size === "sm" ? "h-6 w-6 text-[11px]" : "h-5 w-5 text-[10px]";

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color.hex }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}

// ── 가로 바 차트 행 컴포넌트 ──
function BarChartRow({
  label,
  avatarUrl,
  value,
  maxValue,
  colorIdx,
  suffix = "",
}: {
  label: string;
  avatarUrl: string | null;
  value: number;
  maxValue: number;
  colorIdx: number;
  suffix?: string;
}) {
  const color = MEMBER_COLORS[colorIdx % MEMBER_COLORS.length];
  const widthPct = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 2;

  return (
    <div className="flex items-center gap-2">
      {/* 아바타 + 이름 */}
      <div className="flex items-center gap-1.5 w-20 shrink-0">
        <MemberAvatar
          name={label}
          avatarUrl={avatarUrl}
          colorIdx={colorIdx}
          size="xs"
        />
        <span className="text-[11px] text-muted-foreground truncate">{label}</span>
      </div>

      {/* 바 */}
      <div className="flex-1 h-4 bg-muted/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${widthPct}%`,
            backgroundColor: color.hex,
            opacity: 0.85,
          }}
        />
      </div>

      {/* 수치 */}
      <span
        className={`text-xs font-semibold tabular-nums w-10 text-right shrink-0 ${color.text}`}
      >
        {value}{suffix}
      </span>
    </div>
  );
}

// ── 차트 섹션 컴포넌트 ──
function ComparisonSection({
  title,
  data,
  getValue,
  suffix = "",
}: {
  title: string;
  data: { item: MemberComparisonData; colorIdx: number }[];
  getValue: (d: MemberComparisonData) => number;
  suffix?: string;
}) {
  const maxValue = Math.max(...data.map((d) => getValue(d.item)), 1);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <div className="space-y-1.5">
        {data.map(({ item, colorIdx }) => (
          <BarChartRow
            key={item.userId}
            label={item.name}
            avatarUrl={item.avatarUrl}
            value={getValue(item)}
            maxValue={maxValue}
            colorIdx={colorIdx}
            suffix={suffix}
          />
        ))}
      </div>
    </div>
  );
}

// ── 스켈레톤 로딩 ──
function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 shrink-0" />
                <Skeleton className="h-4 flex-1 rounded-full" />
                <Skeleton className="h-4 w-8 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 멤버 선택 체크박스 아이템 ──
function MemberSelectItem({
  member,
  colorIdx,
  checked,
  disabled,
  onToggle,
}: {
  member: EntityMember;
  colorIdx: number;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const displayName = member.nickname || member.profile.name;

  return (
    <label
      className={[
        "flex items-center gap-2 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors",
        checked
          ? "border-primary/40 bg-primary/5"
          : "border-transparent bg-muted/30 hover:bg-muted/60",
        disabled && !checked ? "opacity-40 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled && !checked}
        className="shrink-0"
      />
      <MemberAvatar
        name={displayName}
        avatarUrl={member.profile.avatar_url}
        colorIdx={colorIdx}
        size="sm"
      />
      <span className="text-xs truncate">{displayName}</span>
    </label>
  );
}

// ── 메인 컴포넌트 ──

interface MemberComparisonDashboardProps {
  groupId: string;
  members: EntityMember[];
}

export function MemberComparisonDashboard({
  groupId,
  members,
}: MemberComparisonDashboardProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const { comparisonData, loading } = useMemberComparison(
    groupId,
    selectedIds,
    members
  );

  // 선택된 멤버에 대한 색상 인덱스 매핑
  const colorMap: Record<string, number> = {};
  selectedIds.forEach((id, idx) => {
    colorMap[id] = idx;
  });

  const handleToggle = (userId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, userId];
    });
  };

  // 비교 데이터에 색상 인덱스 주입
  const dataWithColor = comparisonData.map((item) => ({
    item,
    colorIdx: colorMap[item.userId] ?? 0,
  }));

  const hasSelection = selectedIds.length > 0;
  const hasData = comparisonData.length > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] px-2"
        >
          <BarChart3 className="h-3 w-3 mr-0.5" />
          활동 비교
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 gap-0"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            멤버 활동 비교
          </SheetTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            최근 30일 기준 · 최대 {MAX_SELECTION}명 선택
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* 멤버 선택 영역 */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">비교할 멤버 선택</span>
                {hasSelection && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {selectedIds.length} / {MAX_SELECTION}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setCollapsed((prev) => !prev)}
                aria-label={collapsed ? "펼치기" : "접기"}
              >
                <ChevronDown
                  className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
                  style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                />
              </Button>
            </div>

            {!collapsed && (
              <div className="grid grid-cols-2 gap-1.5">
                {members.map((member, idx) => {
                  const isChecked = selectedIds.includes(member.userId);
                  const isDisabled =
                    !isChecked && selectedIds.length >= MAX_SELECTION;
                  // 선택된 멤버에게는 선택 순서에 따른 색상 인덱스 부여
                  const colorIdx = isChecked
                    ? (colorMap[member.userId] ?? idx)
                    : idx;

                  return (
                    <MemberSelectItem
                      key={member.userId}
                      member={member}
                      colorIdx={colorIdx}
                      checked={isChecked}
                      disabled={isDisabled}
                      onToggle={() => handleToggle(member.userId)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t mx-4 my-2" />

          {/* 비교 차트 영역 */}
          <div className="px-4 pb-6 space-y-6">
            {!hasSelection ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    멤버를 선택하세요
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    최대 {MAX_SELECTION}명의 활동 지표를 비교할 수 있습니다
                  </p>
                </div>
              </div>
            ) : loading ? (
              <ComparisonSkeleton />
            ) : !hasData ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  최근 30일 활동 데이터가 없습니다
                </p>
              </div>
            ) : (
              <>
                {/* 출석률 비교 */}
                <ComparisonSection
                  title="출석률"
                  data={dataWithColor}
                  getValue={(d) => d.attendanceRate}
                  suffix="%"
                />

                {/* RSVP 응답률 비교 */}
                <ComparisonSection
                  title="RSVP 응답률"
                  data={dataWithColor}
                  getValue={(d) => d.rsvpRate}
                  suffix="%"
                />

                {/* 게시글 수 비교 */}
                <ComparisonSection
                  title="게시글 수"
                  data={dataWithColor}
                  getValue={(d) => d.postCount}
                  suffix="건"
                />

                {/* 댓글 수 비교 */}
                <ComparisonSection
                  title="댓글 수"
                  data={dataWithColor}
                  getValue={(d) => d.commentCount}
                  suffix="건"
                />
              </>
            )}
          </div>
        </div>

        {/* 하단 선택 초기화 버튼 */}
        {hasSelection && (
          <div className="px-4 py-3 border-t shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground"
              onClick={() => setSelectedIds([])}
            >
              선택 초기화
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
