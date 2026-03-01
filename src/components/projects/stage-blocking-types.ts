// ============================================================
// 무대 동선 노트 - 공유 상수 및 유틸리티
// ============================================================

import type {
  StageBlockingPosition,
  StageBlockingDirection,
} from "@/types";
import type { AddMemberMoveInput } from "@/hooks/use-stage-blocking";

// ── 위치별 레이블/약어/색상 설정 ──
export const POSITION_CONFIG: Record<
  StageBlockingPosition,
  { label: string; short: string; color: string }
> = {
  upstage_left:     { label: "상수 좌",   short: "UL", color: "bg-purple-100 text-purple-700 border-purple-200" },
  upstage_center:   { label: "상수 중앙", short: "UC", color: "bg-purple-100 text-purple-700 border-purple-200" },
  upstage_right:    { label: "상수 우",   short: "UR", color: "bg-purple-100 text-purple-700 border-purple-200" },
  center_left:      { label: "센터 좌",   short: "CL", color: "bg-blue-100 text-blue-700 border-blue-200" },
  center:           { label: "센터",      short: "C",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  center_right:     { label: "센터 우",   short: "CR", color: "bg-blue-100 text-blue-700 border-blue-200" },
  downstage_left:   { label: "하수 좌",   short: "DL", color: "bg-green-100 text-green-700 border-green-200" },
  downstage_center: { label: "하수 중앙", short: "DC", color: "bg-green-100 text-green-700 border-green-200" },
  downstage_right:  { label: "하수 우",   short: "DR", color: "bg-green-100 text-green-700 border-green-200" },
  wing_left:        { label: "윙 좌",     short: "WL", color: "bg-orange-100 text-orange-700 border-orange-200" },
  wing_right:       { label: "윙 우",     short: "WR", color: "bg-orange-100 text-orange-700 border-orange-200" },
  custom:           { label: "직접 입력", short: "?",  color: "bg-gray-100 text-gray-700 border-gray-200" },
};

// ── 이동 방향별 레이블 설정 ──
export const DIRECTION_CONFIG: Record<StageBlockingDirection, { label: string }> = {
  forward:  { label: "앞으로" },
  backward: { label: "뒤로" },
  left:     { label: "왼쪽" },
  right:    { label: "오른쪽" },
  diagonal: { label: "대각선" },
  circle:   { label: "원형" },
  stay:     { label: "정지" },
  exit:     { label: "퇴장" },
  enter:    { label: "등장" },
};

// ── 위치 선택 옵션 순서 ──
export const POSITION_OPTIONS: StageBlockingPosition[] = [
  "upstage_left", "upstage_center", "upstage_right",
  "center_left", "center", "center_right",
  "downstage_left", "downstage_center", "downstage_right",
  "wing_left", "wing_right", "custom",
];

// ── 이동 방향 선택 옵션 순서 ──
export const DIRECTION_OPTIONS: StageBlockingDirection[] = [
  "forward", "backward", "left", "right", "diagonal", "circle", "stay", "enter", "exit",
];

// ── 범례에 표시할 핵심 위치 목록 ──
export const LEGEND_POSITIONS: StageBlockingPosition[] = [
  "upstage_left", "upstage_center", "upstage_right",
  "center_left", "center", "center_right",
  "downstage_left", "downstage_center", "downstage_right",
];

// ── 멤버별 배지 색상 (최대 10명) ──
export const MEMBER_COLORS = [
  "bg-red-100 text-red-700 border-red-200",
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-yellow-100 text-yellow-700 border-yellow-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-pink-100 text-pink-700 border-pink-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-orange-100 text-orange-700 border-orange-200",
  "bg-teal-100 text-teal-700 border-teal-200",
  "bg-cyan-100 text-cyan-700 border-cyan-200",
];

/**
 * 멤버 이름으로 색상 클래스를 반환합니다.
 * 전체 이름 목록에서 인덱스를 찾아 MEMBER_COLORS를 순환합니다.
 */
export function getMemberColor(memberName: string, allNames: string[]): string {
  const idx = allNames.indexOf(memberName);
  return MEMBER_COLORS[idx % MEMBER_COLORS.length];
}

// ── 빈 멤버 동선 입력 기본값 ──
export const EMPTY_MEMBER_MOVE: AddMemberMoveInput = {
  memberName: "",
  fromPosition: "center",
  toPosition: "center",
};
