import type { ComponentType } from "react";
import type { ProgramSectionType } from "@/types/localStorage/stage";
import {
  Image as ImageIcon,
  MessageCircle,
  List,
  Users,
  Handshake,
  FileText,
  Award,
} from "lucide-react";

export type { ProgramSectionType };

// ============================================================
// 상수
// ============================================================

export const ALL_SECTION_TYPES: ProgramSectionType[] = [
  "cover",
  "greeting",
  "program_list",
  "performer_intro",
  "sponsor",
  "notes",
  "credits",
];

// ============================================================
// 헬퍼 함수
// ============================================================

export function sectionTypeLabel(type: ProgramSectionType): string {
  switch (type) {
    case "cover":
      return "표지";
    case "greeting":
      return "인사말";
    case "program_list":
      return "프로그램 목록";
    case "performer_intro":
      return "출연자 소개";
    case "sponsor":
      return "후원사";
    case "notes":
      return "안내사항";
    case "credits":
      return "크레딧";
  }
}

export function sectionTypeBadgeClass(type: ProgramSectionType): string {
  switch (type) {
    case "cover":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
    case "greeting":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "program_list":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800";
    case "performer_intro":
      return "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800";
    case "sponsor":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800";
    case "notes":
      return "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
    case "credits":
      return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
  }
}

export function formatShowDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

// ============================================================
// SectionTypeIcon - 아이콘 맵 (서버/클라이언트 공통)
// ============================================================

export const SECTION_TYPE_ICON_MAP = {
  cover: ImageIcon,
  greeting: MessageCircle,
  program_list: List,
  performer_intro: Users,
  sponsor: Handshake,
  notes: FileText,
  credits: Award,
} as const satisfies Record<ProgramSectionType, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>>;
