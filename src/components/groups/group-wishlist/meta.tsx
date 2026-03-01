import {
  Music2,
  Wrench,
  Shirt,
  MapPin,
  CalendarDays,
  MoreHorizontal,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type {
  GroupWishCategory,
  GroupWishPriority,
  GroupWishStatus,
} from "@/types";
import type { CategoryMeta, PriorityMeta, StatusMeta } from "./types";

// ─── 카테고리 메타 ────────────────────────────────────────────

export const CATEGORY_META: Record<GroupWishCategory, CategoryMeta> = {
  practice_song: {
    label: "연습곡",
    icon: <Music2 className="h-3 w-3" />,
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    barColor: "bg-purple-400",
  },
  equipment: {
    label: "장비",
    icon: <Wrench className="h-3 w-3" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    barColor: "bg-blue-400",
  },
  costume: {
    label: "의상",
    icon: <Shirt className="h-3 w-3" />,
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    barColor: "bg-pink-400",
  },
  venue: {
    label: "장소",
    icon: <MapPin className="h-3 w-3" />,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    barColor: "bg-green-400",
  },
  event: {
    label: "이벤트",
    icon: <CalendarDays className="h-3 w-3" />,
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    barColor: "bg-orange-400",
  },
  other: {
    label: "기타",
    icon: <MoreHorizontal className="h-3 w-3" />,
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    barColor: "bg-gray-400",
  },
};

// ─── 우선순위 메타 ────────────────────────────────────────────

export const PRIORITY_META: Record<GroupWishPriority, PriorityMeta> = {
  high: { label: "높음", badge: "bg-red-100 text-red-600 hover:bg-red-100" },
  medium: { label: "중간", badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  low: { label: "낮음", badge: "bg-gray-100 text-gray-500 hover:bg-gray-100" },
};

// ─── 상태 메타 ────────────────────────────────────────────────

export const STATUS_META: Record<GroupWishStatus, StatusMeta> = {
  proposed: {
    label: "제안",
    badge: "bg-blue-100 text-blue-600 hover:bg-blue-100",
    icon: <ClipboardList className="h-3 w-3" />,
  },
  reviewing: {
    label: "검토중",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "승인",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "완료",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "반려",
    badge: "bg-red-100 text-red-500 hover:bg-red-100",
    icon: <XCircle className="h-3 w-3" />,
  },
};
