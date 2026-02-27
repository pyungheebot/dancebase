"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { EntityContext, FeatureFlags } from "@/types/entity-context";
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
  { key: "settings", feature: "settings", label: "설정", icon: Settings, path: "/settings" },
];

export function EntityNav({ ctx }: EntityNavProps) {
  const pathname = usePathname();
  const { basePath, breadcrumbs, entityType, features, permissions } = ctx;

  const isProject = entityType === "project";

  const visibleTabs = ALL_TABS.filter((tab) => {
    // 그룹 전용 탭은 프로젝트에서 숨김
    if (tab.groupOnly && isProject) return false;

    // feature 플래그 필터
    if (tab.feature && !features[tab.feature]) return false;

    // 회비: 그룹은 canViewFinance 권한도 필요
    if (tab.key === "finances" && !isProject && !permissions.canViewFinance) return false;

    // 설정: canEdit 권한 필요
    if (tab.key === "settings" && !permissions.canEdit) return false;

    return true;
  });

  const isActive = (path: string) => {
    const fullPath = basePath + path;
    if (path === "") return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  const navClass = isProject
    ? "border-b mb-3 -mx-3 px-3 flex gap-px overflow-x-auto"
    : "border-b mb-4 flex gap-1 overflow-x-auto px-6 -mx-6";

  const linkClass = (active: boolean) =>
    isProject
      ? cn(
          "flex items-center gap-1 px-2 py-1.5 text-[11px] whitespace-nowrap border-b-2 transition-colors",
          active
            ? "border-primary text-primary font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        )
      : cn(
          "flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors",
          active
            ? "border-foreground text-foreground font-medium"
            : "border-transparent text-muted-foreground hover:text-foreground"
        );

  const iconClass = isProject ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <>
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1.5 overflow-x-auto">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 shrink-0">
              {i === 0 && <ArrowLeft className="h-2.5 w-2.5" />}
              {i > 0 && <ChevronRight className="h-2.5 w-2.5" />}
              <Link href={crumb.href} className="hover:text-foreground whitespace-nowrap">
                {crumb.label}
              </Link>
            </span>
          ))}
        </div>
      )}
      <nav className={navClass}>
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              href={basePath + tab.path}
              className={linkClass(active)}
            >
              <Icon className={iconClass} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
