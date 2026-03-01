"use client";

// ─── 캘린더 히트맵 서브컴포넌트 ──────────────────────────────────────────────
// 월별 날짜 격자에 감정 색상으로 일기 작성 여부를 시각화

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { DiaryCardEntry } from "@/types";
import {
  EMOTION_MAP,
  getDaysInMonth,
  getFirstDayOfWeek,
  getTodayStr,
} from "./dance-diary-types";

// 한국어 요일 헤더
const DAYS_KOR = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarHeatmapProps {
  year: number;
  month: number;
  /** 날짜별 일기 존재 여부 맵 { "YYYY-MM-DD": true } */
  heatmap: Record<string, boolean>;
  /** 해당 월의 일기 항목 목록 (감정 색상 표시용) */
  entries: DiaryCardEntry[];
  /** 현재 선택된 날짜 (YYYY-MM-DD) */
  selectedDate: string;
  /** 날짜 클릭 콜백 */
  onSelectDate: (date: string) => void;
}

/**
 * 월별 캘린더 히트맵
 * - 일기가 있는 날은 감정 색상으로 배경 표시
 * - 오늘 날짜는 굵게 + primary 색상
 * - 선택된 날짜는 ring 표시
 * - 각 날짜 버튼에 aria-label로 날짜 및 일기 정보 제공
 */
export const CalendarHeatmap = memo(function CalendarHeatmap({
  year,
  month,
  heatmap,
  entries,
  selectedDate,
  onSelectDate,
}: CalendarHeatmapProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);
  const today = getTodayStr();

  // 날짜별 감정 맵 (해당 월만)
  const emotionMap = new Map<string, (typeof EMOTION_MAP)[keyof typeof EMOTION_MAP]["value"]>();
  for (const e of entries) {
    if (e.date.startsWith(`${year}-${String(month).padStart(2, "0")}`)) {
      emotionMap.set(e.date, e.emotion);
    }
  }

  // 빈 칸 + 날짜 셀 배열 생성
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none" role="grid" aria-label={`${year}년 ${month}월 달력`}>
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1" role="row">
        {DAYS_KOR.map((d) => (
          <div
            key={d}
            role="columnheader"
            aria-label={`${d}요일`}
            className="text-center text-[10px] text-muted-foreground py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 격자 */}
      <div className="grid grid-cols-7 gap-0.5" role="rowgroup">
        {cells.map((day, idx) => {
          // 빈 칸 (월 시작 전 여백)
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="aspect-square"
                role="gridcell"
                aria-hidden="true"
              />
            );
          }

          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEntry = heatmap[dateStr];
          const emotion = emotionMap.get(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;

          // 접근성용 aria-label 구성
          const emotionLabel = emotion ? EMOTION_MAP[emotion].label : null;
          const ariaLabel = [
            `${year}년 ${month}월 ${day}일`,
            isToday ? "(오늘)" : null,
            hasEntry ? `일기 있음${emotionLabel ? ` - ${emotionLabel}` : ""}` : "일기 없음",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={dateStr}
              type="button"
              role="gridcell"
              aria-label={ariaLabel}
              aria-selected={isSelected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "aspect-square rounded flex items-center justify-center text-[10px] relative transition-all hover:bg-muted",
                isSelected && "ring-2 ring-primary",
                isToday && !isSelected && "font-bold text-primary"
              )}
            >
              {/* 감정 배경색 레이어 */}
              {hasEntry && emotion && (
                <span
                  className={cn(
                    "absolute inset-0.5 rounded opacity-25",
                    EMOTION_MAP[emotion].color
                  )}
                  aria-hidden="true"
                />
              )}
              {/* 감정 없이 기록만 있는 경우 인디고 배경 */}
              {hasEntry && !emotion && (
                <span
                  className="absolute inset-0.5 rounded opacity-20 bg-indigo-400"
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
