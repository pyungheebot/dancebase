"use client";

/**
 * 사이드바 그룹 트리 섹션
 * - 내 그룹 접기/펼치기
 * - 그룹 계층 구조 재귀 렌더링 (SidebarGroupItem)
 * - 프로젝트 항목 렌더링
 * - 새 그룹 / 참여 링크
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useGroups } from "@/hooks/use-groups";
import { useMyProjects } from "@/hooks/use-my-projects";
import { PrefetchLink } from "@/components/shared/prefetch-link";
import { preloadGroupDetail } from "@/lib/swr/preload";
import {
  ChevronDown,
  ChevronRight,
  Hash,
  FolderOpen,
  Share2,
  Plus,
  UserPlus,
} from "lucide-react";

// -----------------------------------------------------------------------
// 타입 정의
// -----------------------------------------------------------------------

type GroupTreeNode = {
  id: string;
  name: string;
  parent_group_id: string | null;
  children: GroupTreeNode[];
};

// -----------------------------------------------------------------------
// 유틸리티 함수
// -----------------------------------------------------------------------

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

/** 평면 그룹 목록을 계층 트리로 변환 */
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

// -----------------------------------------------------------------------
// 그룹 트리 개별 아이템 (재귀 컴포넌트)
// -----------------------------------------------------------------------

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

  const groupIsActive = isActive(`/groups/${node.id}`) && !pathname.includes("/projects/");

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined} aria-label={node.name}>
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
            aria-label={isExpanded ? `${node.name} 접기` : `${node.name} 펼치기`}
            aria-expanded={isExpanded}
            aria-controls={`group-children-${node.id}`}
            className="p-0.5 ml-1 text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-4 ml-1" aria-hidden="true" />
        )}
        <PrefetchLink
          href={`/groups/${node.id}`}
          preloadFn={() => preloadGroupDetail(node.id)}
          onClick={onNavigate}
          aria-current={groupIsActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-sm px-1.5 py-1 text-sm transition-colors flex-1 min-w-0",
            groupIsActive
              ? "bg-sidebar-accent font-medium"
              : "hover:bg-sidebar-accent/60 text-sidebar-foreground/70"
          )}
        >
          <Hash className="h-3.5 w-3.5 opacity-40 shrink-0" aria-hidden="true" />
          <span className="truncate">{node.name}</span>
        </PrefetchLink>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-px" id={`group-children-${node.id}`} role="group">
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
          {projects.map((project) => {
            const projectIsActive = isActive(`/groups/${node.id}/projects/${project.id}`);
            return (
              <Link
                key={project.id}
                href={`/groups/${node.id}/projects/${project.id}`}
                onClick={onNavigate}
                role="treeitem"
                aria-current={projectIsActive ? "page" : undefined}
                style={{ paddingLeft: (depth + 1) * 12 }}
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[13px] transition-colors ml-6",
                  projectIsActive
                    ? "bg-sidebar-accent font-medium"
                    : "hover:bg-sidebar-accent/60 text-sidebar-foreground/60"
                )}
              >
                {project.is_shared ? (
                  <Share2 className="h-3 w-3 opacity-40 shrink-0" aria-hidden="true" />
                ) : (
                  <FolderOpen className="h-3 w-3 opacity-40 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------
// 그룹 트리 섹션 (메인 export)
// -----------------------------------------------------------------------

type SidebarGroupTreeProps = {
  onNavigate?: () => void;
};

export function SidebarGroupTree({ onNavigate }: SidebarGroupTreeProps) {
  const pathname = usePathname();
  const { groups } = useGroups();
  const { projectsByGroup } = useMyProjects();
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groupTree = useMemo(() => buildGroupTree(groups), [groups]);
  const activeAncestorIds = useMemo(
    () => getActiveAncestorIds(groupTree, pathname),
    [groupTree, pathname]
  );

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <div>
      {/* 내 그룹 섹션 헤더 */}
      <button
        onClick={() => setGroupsOpen(!groupsOpen)}
        className="flex items-center gap-1 w-full px-2 py-0.5 text-xs font-medium text-muted-foreground/80 hover:text-foreground transition-colors"
        aria-expanded={groupsOpen}
        aria-controls="sidebar-groups-list"
        aria-label={groupsOpen ? "내 그룹 접기" : "내 그룹 펼치기"}
      >
        {groupsOpen ? (
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        )}
        <span>내 그룹</span>
      </button>

      {groupsOpen && (
        <div className="mt-0.5 space-y-px" id="sidebar-groups-list" role="tree" aria-label="내 그룹 목록">
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

          {/* 새 그룹 / 참여 버튼 */}
          <div className="flex gap-0.5 pl-5 pt-1">
            <Link
              href="/groups/new"
              onClick={onNavigate}
              className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              새 그룹
            </Link>
            <Link
              href="/dashboard?join=true"
              onClick={onNavigate}
              className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-colors"
            >
              <UserPlus className="h-3 w-3" aria-hidden="true" />
              참여
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
