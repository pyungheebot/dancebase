"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { CommandItem, RecentPage } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

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
    label: "메시지",
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
  return loadFromStorage<RecentPage[]>(RECENT_PAGES_KEY, []);
}

export function saveRecentPage(href: string, label: string) {
  const pages = loadRecentPages().filter((p) => p.href !== href);
  const updated: RecentPage[] = [
    { href, label, visitedAt: Date.now() },
    ...pages,
  ].slice(0, MAX_RECENT_PAGES);
  saveToStorage(RECENT_PAGES_KEY, updated);
}

function isInputFocused(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  const editable = (e.target as HTMLElement)?.isContentEditable;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || editable === true;
}

export function useCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentPages] = useState<RecentPage[]>([]);
  const [goMode, setGoMode] = useState(false);
  const goTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // 팔레트가 열릴 때 최근 방문 페이지 로드

  // 키보드 단축키 등록
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Cmd+K: 커맨드 팔레트 토글
      if (modifier && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      // Escape: 팔레트 닫기
      if (e.key === "Escape") {
        setOpen(false);
        setGoMode(false);
        clearTimeout(goTimerRef.current);
        return;
      }

      // 팔레트가 열려 있거나 input에 포커스가 있으면 이하 단축키 무시
      if (open || isInputFocused(e)) return;

      // G 키: Go-to 모드 진입
      if (e.key === "g" || e.key === "G") {
        e.preventDefault();
        setGoMode(true);
        clearTimeout(goTimerRef.current);
        goTimerRef.current = setTimeout(() => setGoMode(false), 500);
        return;
      }

      // Go-to 모드에서 목적지 키 처리
      if (goMode) {
        const routes: Record<string, string> = {
          d: "/dashboard",
          m: "/messages",
          s: "/schedules",
          p: "/profile",
        };
        const route = routes[e.key.toLowerCase()];
        if (route) {
          e.preventDefault();
          router.push(route);
        }
        setGoMode(false);
        clearTimeout(goTimerRef.current);
        return;
      }

      // `/` 키: 페이지 내 검색 input에 포커스
      if (e.key === "/") {
        const searchInput = document.querySelector<HTMLElement>("[data-search-input]");
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
        return;
      }

      // `?` 키: 단축키 도움말 (커맨드 팔레트를 "단축키" 검색으로 열기)
      if (e.key === "?") {
        e.preventDefault();
        setQuery("단축키");
        setOpen(true);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(goTimerRef.current);
    };
  }, [open, goMode, router]);

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
