"use client";

/**
 * 사이드바 컨테이너
 * 서브컴포넌트를 조합하여 전체 사이드바 레이아웃을 구성한다.
 *
 * 서브컴포넌트:
 * - SidebarHeader  : 유저 아바타 + 계정 메뉴 Popover
 * - SidebarMainNav : 대시보드/일정/탐색/통계/메시지 링크
 * - SidebarGroupTree: 그룹/프로젝트 트리 (재귀 구조)
 * - SidebarFooter  : 화면 설정 Popover (테마, 글꼴)
 */

import { SidebarHeader } from "./sidebar-header";
import { SidebarMainNav } from "./sidebar-main-nav";
import { SidebarGroupTree } from "./sidebar-group-tree";
import { SidebarFooter } from "./sidebar-footer";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  return (
    <div className="flex flex-col h-full w-full text-sidebar-foreground">
      {/* 유저 정보 + 계정 메뉴 */}
      <SidebarHeader onNavigate={onNavigate} />

      {/* 메인 네비게이션 + 그룹 트리 */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-4" aria-label="메인 메뉴" id="sidebar">
        <SidebarMainNav onNavigate={onNavigate} />
        <SidebarGroupTree onNavigate={onNavigate} />
      </nav>

      {/* 하단 화면 설정 */}
      <SidebarFooter />
    </div>
  );
}
