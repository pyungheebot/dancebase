"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useGroups } from "@/hooks/use-groups";
import { useMyProjects } from "@/hooks/use-my-projects";
import { useSettings, type Theme } from "@/hooks/use-settings";
import { useUnreadCount } from "@/hooks/use-messages";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutDashboard,

  Plus,
  Calendar,
  UserCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Compass,
  BarChart3,
  Mail,
  Settings,
  Sun,
  Moon,
  Eye,
  Type,
  LogOut,
  FolderOpen,
  Hash,
  Share2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useMemo } from "react";

type GroupTreeNode = {
  id: string;
  name: string;
  parent_group_id: string | null;
  children: GroupTreeNode[];
};

/** 현재 pathname에 해당하는 그룹의 모든 조상 그룹 ID를 반환 */
function getActiveAncestorIds(tree: GroupTreeNode[], pathname: string): Set<string> {
  const ids = new Set<string>();
  function walk(node: GroupTreeNode, ancestors: string[]): boolean {
    const isSelf = pathname === `/groups/${node.id}` || pathname.startsWith(`/groups/${node.id}/`);
    let descendantActive = false;
    for (const child of node.children) {
      if (walk(child, [...ancestors, node.id])) descendantActive = true;
    }
    if (isSelf || descendantActive) {
      for (const a of ancestors) ids.add(a);
      return true;
    }
    return false;
  }
  for (const root of tree) walk(root, []);
  return ids;
}

function buildGroupTree(groups: { id: string; name: string; parent_group_id?: string | null }[]): GroupTreeNode[] {
  const nodeMap = new Map<string, GroupTreeNode>();
  for (const g of groups) {
    nodeMap.set(g.id, { id: g.id, name: g.name, parent_group_id: g.parent_group_id ?? null, children: [] });
  }

  const roots: GroupTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_group_id && nodeMap.has(node.parent_group_id)) {
      nodeMap.get(node.parent_group_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "high-contrast", label: "고대비", icon: Eye },
];

type SidebarProps = {
  onNavigate?: () => void;
};

function UnreadCount() {
  const { count } = useUnreadCount();
  if (count <= 0) return null;
  return (
    <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px] leading-none font-normal">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}

function SidebarGroupItem({
  node,
  depth,
  projectsByGroup,
  expandedGroups,
  setExpandedGroups,
  activeAncestorIds,
  isActive,
  pathname,
  onNavigate,
}: {
  node: GroupTreeNode;
  depth: number;
  projectsByGroup: Record<string, { id: string; name: string; is_shared?: boolean }[]>;
  expandedGroups: Record<string, boolean>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeAncestorIds: Set<string>;
  isActive: (href: string) => boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const projects = projectsByGroup[node.id] || [];
  const hasChildren = node.children.length > 0 || projects.length > 0;
  const isExpanded = expandedGroups[node.id] ?? (isActive(`/groups/${node.id}`) || activeAncestorIds.has(node.id));
  const paddingLeft = depth * 12;

  return (
    <div>
      <div className="flex items-center group" style={{ paddingLeft }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() =>
              setExpandedGroups((prev) => ({
                ...prev,
                [node.id]: !isExpanded,
              }))
            }
            className="p-0.5 ml-1 text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4 ml-1" />
        )}
        <Link
          href={`/groups/${node.id}`}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-sm transition-colors flex-1 min-w-0",
            isActive(`/groups/${node.id}`) &&
              !pathname.includes("/projects/")
              ? "bg-sidebar-accent font-medium"
              : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70"
          )}
        >
          <Hash className="h-3.5 w-3.5 opacity-40 shrink-0" />
          <span className="truncate">{node.name}</span>
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-px">
          {node.children.map((child) => (
            <SidebarGroupItem
              key={child.id}
              node={child}
              depth={depth + 1}
              projectsByGroup={projectsByGroup}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
              activeAncestorIds={activeAncestorIds}
              isActive={isActive}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/groups/${node.id}/projects/${project.id}`}
              onClick={onNavigate}
              style={{ paddingLeft: (depth + 1) * 12 }}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[13px] transition-colors ml-6",
                isActive(`/groups/${node.id}/projects/${project.id}`)
                  ? "bg-sidebar-accent font-medium"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/60"
              )}
            >
              {project.is_shared ? (
                <Share2 className="h-3 w-3 opacity-40 shrink-0" />
              ) : (
                <FolderOpen className="h-3 w-3 opacity-40 shrink-0" />
              )}
              <span className="truncate">{project.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { groups } = useGroups();
  const { projectsByGroup } = useMyProjects();
  const { theme, fontScale, setTheme, setFontScale } = useSettings();
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const groupTree = useMemo(() => buildGroupTree(groups), [groups]);
  const activeAncestorIds = useMemo(() => getActiveAncestorIds(groupTree, pathname), [groupTree, pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const mainNav: NavItem[] = [
    {
      label: "대시보드",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4 opacity-60" />,
    },
    {
      label: "전체 일정",
      href: "/schedules",
      icon: <Calendar className="h-4 w-4 opacity-60" />,
    },
    {
      label: "그룹 탐색",
      href: "/explore",
      icon: <Compass className="h-4 w-4 opacity-60" />,
    },
    {
      label: "출석 통계",
      href: "/stats",
      icon: <BarChart3 className="h-4 w-4 opacity-60" />,
    },
    {
      label: "메시지",
      href: "/messages",
      icon: <Mail className="h-4 w-4 opacity-60" />,
    },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex flex-col h-full w-full text-sidebar-foreground">
      {/* 유저 정보 */}
      <div className="px-3 pt-3 pb-1">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 w-full rounded-sm px-1.5 py-1 hover:bg-sidebar-accent transition-colors text-left">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] bg-gradient-to-br from-orange-400 to-pink-500 text-white font-bold rounded-sm">
                  {profile?.name?.charAt(0)?.toUpperCase() || "G"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium truncate flex-1">
                {profile?.name || "Groop"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-40" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-52 p-1">
            <Link
              href={user ? `/users/${user.id}` : "#"}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <UserCircle className="h-4 w-4 opacity-60" />
              내 프로필
            </Link>
            <Link
              href="/profile"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4 opacity-60" />
              프로필 설정
            </Link>
            <div className="h-px bg-border my-1" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors w-full text-left text-muted-foreground"
            >
              <LogOut className="h-4 w-4 opacity-60" />
              로그아웃
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1 text-sm transition-colors",
                isActive(item.href)
                  ? "bg-sidebar-accent font-medium"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70"
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.label === "메시지" && <UnreadCount />}
            </Link>
          ))}
        </div>

        {/* 내 그룹 섹션 */}
        <div>
          <button
            onClick={() => setGroupsOpen(!groupsOpen)}
            className="flex items-center gap-1 w-full px-2 py-0.5 text-xs font-medium text-muted-foreground/80 hover:text-foreground transition-colors"
            aria-expanded={groupsOpen}
          >
            {groupsOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            내 그룹
          </button>

          {groupsOpen && (
            <div className="mt-0.5 space-y-px">
              {groupTree.map((node) => (
                <SidebarGroupItem
                  key={node.id}
                  node={node}
                  depth={0}
                  projectsByGroup={projectsByGroup}
                  expandedGroups={expandedGroups}
                  setExpandedGroups={setExpandedGroups}
                  activeAncestorIds={activeAncestorIds}
                  isActive={isActive}
                  pathname={pathname}
                  onNavigate={onNavigate}
                />
              ))}

              <div className="flex gap-0.5 pl-5 pt-1">
                <Link
                  href="/groups/new"
                  onClick={onNavigate}
                  className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  새 그룹
                </Link>
                <Link
                  href="/dashboard?join=true"
                  onClick={onNavigate}
                  className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
                >
                  <UserPlus className="h-3 w-3" />
                  참여
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 하단 설정 */}
      <div className="px-2 pb-2 pt-1">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 transition-colors w-full">
              <Settings className="h-4 w-4 opacity-50" />
              화면 설정
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-52">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">테마</p>
                <div className="grid grid-cols-3 gap-0.5">
                  {THEME_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setTheme(opt.value)}
                        className={cn(
                          "flex items-center justify-center gap-1 rounded-sm px-1.5 py-1 text-xs transition-colors",
                          theme === opt.value
                            ? "bg-accent font-medium"
                            : "hover:bg-accent text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Type className="h-3.5 w-3.5" />
                    글꼴
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(fontScale * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">가</span>
                  <Slider
                    value={[fontScale]}
                    min={0.75}
                    max={1.25}
                    step={0.05}
                    onValueChange={([v]) => setFontScale(v)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">가</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
