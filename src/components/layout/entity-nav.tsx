"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { EntityContext, FeatureFlags } from "@/types/entity-context";
import { usePendingJoinRequestCount } from "@/hooks/use-join-requests";
import {
  LayoutDashboard,
  MessageSquare,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  Users,
  Wallet,
  Settings,
  ArrowLeft,
  Network,
  ChevronRight,
  UserPlus,
} from "lucide-react";

type EntityNavProps = {
  ctx: EntityContext;
};

type TabDef = {
  key: string;
  feature: keyof FeatureFlags | null;
  label: string;
  icon: React.ElementType;
  path: string;
  groupOnly?: boolean;
};

const ALL_TABS: TabDef[] = [
  { key: "dashboard", feature: null, label: "대시보드", icon: LayoutDashboard, path: "" },
  { key: "board", feature: "board", label: "게시판", icon: MessageSquare, path: "/board" },
  { key: "projects", feature: "projects", label: "프로젝트", icon: FolderKanban, path: "/projects", groupOnly: true },
  { key: "subgroups", feature: "subgroups", label: "하위그룹", icon: Network, path: "/subgroups", groupOnly: true },
  { key: "schedule", feature: "schedule", label: "일정", icon: Calendar, path: "/schedule" },
  { key: "attendance", feature: "attendance", label: "출석", icon: ClipboardCheck, path: "/attendance" },
  { key: "members", feature: "members", label: "멤버", icon: Users, path: "/members" },
  { key: "finances", feature: "finance", label: "회비", icon: Wallet, path: "/finances" },
  { key: "join-requests", feature: "joinRequests", label: "가입 신청", icon: UserPlus, path: "/join-requests", groupOnly: true },
  { key: "settings", feature: "settings", label: "설정", icon: Settings, path: "/settings" },
];

export function EntityNav({ ctx }: EntityNavProps) {
  const pathname = usePathname();
  const { basePath, breadcrumbs, entityType, features, permissions } = ctx;

  const isProject = entityType === "project";
  const isGroupLeader = !isProject && permissions.canEdit;

  // 리더인 그룹에서만 pending 가입 신청 수 조회
  const { count: pendingCount } = usePendingJoinRequestCount(
    ctx.groupId,
    isGroupLeader && features.joinRequests,
  );

  const visibleTabs = ALL_TABS.filter((tab) => {
    // 그룹 전용 탭은 프로젝트에서 숨김
    if (tab.groupOnly && isProject) return false;

    // feature 플래그 필터
    if (tab.feature && !features[tab.feature]) return false;

    // 회비: 그룹은 canViewFinance 권한도 필요 (일반 멤버는 숨김)
    if (tab.key === "finances" && !isProject && !permissions.canViewFinance) return false;

    // 설정: canManageSettings 권한 필요 (리더만 접근 가능, 일반 멤버·서브리더 숨김)
    if (tab.key === "settings" && !permissions.canManageSettings) return false;

    // 가입 신청: 리더만 접근 가능
    if (tab.key === "join-requests" && !permissions.canManageSettings) return false;

    // 가입 신청: join_policy가 approval인 경우에만 표시
    if (tab.key === "join-requests" && ctx.raw.group?.join_policy !== "approval") return false;

    return true;
  });

  const isActive = (path: string) => {
    const fullPath = basePath + path;
    if (path === "") return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  // 현재 활성 탭 (브레드크럼 끝에 표시할 현재 페이지명)
  const activeTab = visibleTabs.find((tab) => isActive(tab.path)) ?? null;
  // 대시보드(루트) 탭은 별도 표시 없이 생략
  const currentPageLabel = activeTab && activeTab.key !== "dashboard" ? activeTab.label : null;

  const navClass = isProject
    ? "border-b mb-3 -mx-3 px-3 flex gap-px overflow-x-auto scrollbar-none"
    : "border-b mb-4 flex gap-1 overflow-x-auto scrollbar-none px-6 -mx-6";

  const linkClass = (active: boolean) =>
    isProject
      ? cn(
          "flex items-center gap-1 px-2 py-1.5 text-[11px] whitespace-nowrap border-b-2 transition-colors",
          active
            ? "border-primary text-primary font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )
      : cn(
          "flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-2 text-xs md:text-sm whitespace-nowrap border-b-2 transition-colors",
          active
            ? "border-foreground text-foreground font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        );

  const iconClass = isProject ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <>
      {(breadcrumbs.length > 0 || currentPageLabel) && (
        <nav aria-label="경로 탐색" className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5 overflow-x-auto scrollbar-none">
          <ol className="flex items-center gap-1 list-none p-0 m-0">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1 shrink-0">
                {i === 0 && <ArrowLeft className="h-2.5 w-2.5" aria-hidden="true" />}
                {i > 0 && <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />}
                <Link href={crumb.href} className="hover:text-foreground whitespace-nowrap">
                  {crumb.label}
                </Link>
              </li>
            ))}
            {currentPageLabel && (
              <li className="flex items-center gap-1 shrink-0" aria-current="page">
                <ChevronRight className="h-2.5 w-2.5" aria-hidden="true" />
                <span className="text-foreground font-bold whitespace-nowrap">
                  {currentPageLabel}
                </span>
              </li>
            )}
          </ol>
        </nav>
      )}
      <div className="relative">
        <nav className={navClass} aria-label="그룹 네비게이션" role="tablist">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            const showBadge = tab.key === "join-requests" && isGroupLeader && pendingCount > 0;
            const tabId = `entity-tab-${tab.key}`;
            const panelId = `entity-panel-${tab.key}`;
            return (
              <Link
                key={tab.path}
                id={tabId}
                href={basePath + tab.path}
                className={linkClass(active)}
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
                aria-controls={panelId}
                aria-label={tab.label + (showBadge ? ` (미처리 ${pendingCount > 99 ? "99+" : pendingCount}건)` : "")}
              >
                <Icon className={iconClass} aria-hidden="true" />
                {isProject ? (
                  tab.label
                ) : (
                  <>
                    <span className="hidden md:inline">{tab.label}</span>
                  </>
                )}
                {showBadge && (
                  <span
                    className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none ml-0.5"
                    aria-hidden="true"
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* 오른쪽 끝 그라데이션 fade - 모바일에서만 표시 */}
        {!isProject && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent md:hidden" />
        )}
      </div>
    </>
  );
}
