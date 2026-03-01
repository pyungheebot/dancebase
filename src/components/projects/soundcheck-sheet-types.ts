/**
 * 사운드체크 시트 - 공유 타입, 상수, 유틸 함수
 * 모든 서브컴포넌트에서 공통으로 사용하는 정의를 한 곳에 모아둡니다.
 */

import type { SoundcheckChannel } from "@/types";

// ============================================================
// 채널 유형 레이블 & 색상
// ============================================================

export const CHANNEL_TYPE_LABELS: Record<SoundcheckChannel["type"], string> = {
  vocal: "보컬",
  instrument: "악기",
  playback: "플레이백",
  sfx: "효과음",
  monitor: "모니터",
};

export const CHANNEL_TYPE_COLORS: Record<SoundcheckChannel["type"], string> = {
  vocal: "bg-blue-100 text-blue-700 border-blue-300",
  instrument: "bg-green-100 text-green-700 border-green-300",
  playback: "bg-purple-100 text-purple-700 border-purple-300",
  sfx: "bg-orange-100 text-orange-700 border-orange-300",
  monitor: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

export const CHANNEL_TYPE_OPTIONS: SoundcheckChannel["type"][] = [
  "vocal",
  "instrument",
  "playback",
  "sfx",
  "monitor",
];

// ============================================================
// 폼 데이터 타입
// ============================================================

/** 시트 추가/수정 폼 */
export type SheetFormData = {
  sheetName: string;
  engineer: string;
  checkDate: string;
  overallNotes: string;
};

/** 채널 추가/수정 폼 */
export type ChannelFormData = {
  channelNumber: string;
  source: string;
  type: SoundcheckChannel["type"];
  volume: string;
  pan: string;
  eq: string;
  notes: string;
};

// ============================================================
// 빈 폼 생성 함수
// ============================================================

/** 비어있는 시트 폼 초기값 */
export function emptySheetForm(): SheetFormData {
  return {
    sheetName: "",
    engineer: "",
    checkDate: "",
    overallNotes: "",
  };
}

/** 비어있는 채널 폼 초기값 */
export function emptyChannelForm(): ChannelFormData {
  return {
    channelNumber: "",
    source: "",
    type: "vocal",
    volume: "80",
    pan: "0",
    eq: "",
    notes: "",
  };
}

// ============================================================
// 유틸 함수
// ============================================================

/**
 * 팬 값을 표시용 문자열로 변환합니다.
 * 0 → "C", 양수 → "R{n}", 음수 → "L{n}"
 */
export function formatPan(pan: number): string {
  if (pan === 0) return "C";
  if (pan > 0) return `R${pan}`;
  return `L${Math.abs(pan)}`;
}
