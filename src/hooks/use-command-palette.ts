"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CommandItem, RecentPage } from "@/types";

const RECENT_PAGES_KEY = "dancebase:recent-pages";
const MAX_RECENT_PAGES = 5;

const STATIC_COMMANDS: CommandItem[] = [
  {
    id: "nav-dashboard",
    label: "대시보드",
    href: "/dashboard",
    type: "navigation",
    group: "빠른 이동",
    icon: "Home",
    shortcut: "D",
  },
  {
    id: "nav-messages",
    label: "쪽지",
    href: "/messages",
    type: "navigation",
    group: "빠른 이동",
    icon: "MessageSquare",
    shortcut: "M",
  },
  {
    id: "nav-schedules",
    label: "전체 일정",
    href: "/schedules",
    type: "navigation",
    group: "빠른 이동",
    icon: "Calendar",
    shortcut: "S",
  },
  {
    id: "nav-profile",
    label: "프로필 설정",
    href: "/profile",
    type: "navigation",
    group: "빠른 이동",
    icon: "User",
    shortcut: "P",
  },
  {
    id: "nav-groups",
    label: "그룹 탐색",
    href: "/explore",
    type: "navigation",
    group: "빠른 이동",
    icon: "Users",
  },
  {
    id: "action-new-group",
    label: "그룹 만들기",
    href: "/groups/new",
    type: "action",
    group: "액션",
    icon: "Plus",
  },
  {
    id: "action-edit-profile",
    label: "프로필 편집",
    href: "/profile",
    type: "action",
    group: "액션",
    icon: "User",
  },
];

function loadRecentPages(): RecentPage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentPage[];
  } catch {
    return [];
  }
}

export function saveRecentPage(href: string, label: string) {
  if (typeof window === "undefined") return;
  try {
    const pages = loadRecentPages().filter((p) => p.href !== href);
    const updated: RecentPage[] = [
      { href, label, visitedAt: Date.now() },
      ...pages,
    ].slice(0, MAX_RECENT_PAGES);
    localStorage.setItem(RECENT_PAGES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // 팔레트가 열릴 때 최근 방문 페이지 로드
  useEffect(() => {
    if (open) {
      setRecentPages(loadRecentPages());
    }
  }, [open]);

  // 키보드 단축키 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // 최근 방문 페이지를 CommandItem 형태로 변환
  const recentCommands: CommandItem[] = useMemo(
    () =>
      recentPages.map((p) => ({
        id: `recent-${p.href}`,
        label: p.label,
        href: p.href,
        type: "recent" as const,
        group: "최근 방문",
        icon: "Clock",
      })),
    [recentPages]
  );

  // 전체 명령 목록
  const allCommands: CommandItem[] = useMemo(
    () => [...STATIC_COMMANDS, ...recentCommands],
    [recentCommands]
  );

  // 검색어 기반 필터링
  const filteredCommands: CommandItem[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return allCommands;
    return allCommands.filter((cmd) =>
      cmd.label.toLowerCase().includes(trimmed)
    );
  }, [allCommands, query]);

  // 그룹별로 묶기
  const groupedCommands = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const cmd of filteredCommands) {
      if (!map.has(cmd.group)) map.set(cmd.group, []);
      map.get(cmd.group)!.push(cmd);
    }
    return map;
  }, [filteredCommands]);

  return {
    open,
    setOpen,
    query,
    setQuery,
    openPalette,
    closePalette,
    filteredCommands,
    groupedCommands,
  };
}
