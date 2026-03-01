"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  PracticeEntry,
  PracticeJournalData,
  PracticeWeeklyDigest,
  PracticeWeeklyDigestStat,
} from "@/types";

// ============================================================
// 유틸리티
// ============================================================

function getStorageKey(userId: string): string {
  return `dancebase:practice-journal:${userId}`;
}

function loadJournalData(userId: string): PracticeJournalData {
  if (typeof window === "undefined") {
    return { entries: [], weeklyGoalMinutes: 180 };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return { entries: [], weeklyGoalMinutes: 180 };
    return JSON.parse(raw) as PracticeJournalData;
  } catch {
    return { entries: [], weeklyGoalMinutes: 180 };
  }
}

/** YYYY-MM-DD 형식으로 변환 */
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 기준 날짜의 주 월요일 반환 */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일
  const diff = (day + 6) % 7; // 월요일 기준 오프셋
  d.setDate(d.getDate() - diff);
  return d;
}

/** 이번 주 [월요일, 일요일] 반환 */
function getCurrentWeekRange(): [Date, Date] {
  const monday = getWeekMonday(new Date());
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return [monday, sunday];
}

/** 전주 [월요일, 일요일] 반환 */
function getPrevWeekRange(): [Date, Date] {
  const thisMonday = getWeekMonday(new Date());
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(thisMonday.getDate() - 1);
  prevSunday.setHours(23, 59, 59, 999);
  const prevMonday = getWeekMonday(prevSunday);
  return [prevMonday, prevSunday];
}

/** 날짜 범위 내 엔트리 필터 */
function filterEntries(
  entries: PracticeEntry[],
  from: Date,
  to: Date
): PracticeEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    return d >= from && d <= to;
  });
}

/** 변화율 계산 */
function calcChangeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** 가장 많이 등장하는 단어(2글자 이상) 추출 */
function extractTopCategory(entries: PracticeEntry[]): string | null {
  if (entries.length === 0) return null;

  const freq: Record<string, number> = {};
  const stopWords = new Set([
    "연습", "오늘", "했다", "했습니다", "했어요", "하기", "하고",
    "그리고", "이번", "다시", "계속", "조금", "많이", "천천히",
  ]);

  entries.forEach((e) => {
    const words = e.content
      .split(/[\s,./|!?]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !stopWords.has(w));

    words.forEach((w) => {
      freq[w] = (freq[w] ?? 0) + 1;
    });
  });

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : null;
}

/** 오늘 기준 연속 연습 일수 계산 */
function calcStreakDays(entries: PracticeEntry[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 연습한 날짜 Set
  const practicedSet = new Set(entries.map((e) => e.date));

  let streak = 0;
  const cursor = new Date(today);

  while (true) {
    const dateStr = toDateStr(cursor);
    if (practicedSet.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // 오늘 연습 안 했으면 어제부터 카운트 시작
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const yesterdayStr = toDateStr(cursor);
        if (practicedSet.has(yesterdayStr)) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return streak;
}

/** 자동 요약 텍스트 생성 */
function buildSummaryText(
  practiceCount: number,
  totalMinutes: number,
  averageRating: number,
  topCategory: string | null,
  streakDays: number
): string {
  if (practiceCount === 0) {
    return "이번 주 아직 연습 기록이 없습니다.";
  }

  const timeText =
    totalMinutes < 60
      ? `${totalMinutes}분`
      : (() => {
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
        })();

  const parts: string[] = [
    `이번 주 ${practiceCount}회 연습, 총 ${timeText}`,
  ];

  if (averageRating > 0) {
    parts.push(`평균 만족도 ${averageRating.toFixed(1)}점`);
  }
  if (topCategory) {
    parts.push(`"${topCategory}" 집중 연습`);
  }
  if (streakDays >= 2) {
    parts.push(`${streakDays}일 연속 달성 중`);
  }

  return parts.join(" | ");
}

// ============================================================
// DigestStat 빌더
// ============================================================

function buildStat(current: number, previous: number): PracticeWeeklyDigestStat {
  return {
    current,
    previous,
    changeRate: calcChangeRate(current, previous),
  };
}

// ============================================================
// 훅 본체
// ============================================================

export function usePracticeWeeklyDigest() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: authData }: { data: { user: { id: string } | null } }) => {
      const uid = authData.user?.id ?? null;
      setUserId(uid);
      setLoading(false);
    });
  }, []);

  const digest = useMemo<PracticeWeeklyDigest | null>(() => {
    if (userId === null) return null;

    const journalData = loadJournalData(userId);
    const entries = journalData.entries;

    const [thisMonday, thisSunday] = getCurrentWeekRange();
    const [prevMonday, prevSunday] = getPrevWeekRange();

    const thisWeekEntries = filterEntries(entries, thisMonday, thisSunday);
    const prevWeekEntries = filterEntries(entries, prevMonday, prevSunday);

    // 이번 주 통계
    const thisPracticeCount = thisWeekEntries.length;
    const thisTotalMinutes = thisWeekEntries.reduce(
      (s, e) => s + e.durationMinutes,
      0
    );
    const thisAvgRating =
      thisPracticeCount > 0
        ? Math.round(
            (thisWeekEntries.reduce((s, e) => s + e.selfRating, 0) /
              thisPracticeCount) *
              10
          ) / 10
        : 0;

    // 전주 통계
    const prevPracticeCount = prevWeekEntries.length;
    const prevTotalMinutes = prevWeekEntries.reduce(
      (s, e) => s + e.durationMinutes,
      0
    );
    const prevAvgRating =
      prevPracticeCount > 0
        ? Math.round(
            (prevWeekEntries.reduce((s, e) => s + e.selfRating, 0) /
              prevPracticeCount) *
              10
          ) / 10
        : 0;

    const topCategory = extractTopCategory(thisWeekEntries);
    const streakDays = calcStreakDays(entries);
    const practicedDates = Array.from(
      new Set(thisWeekEntries.map((e) => e.date))
    ).sort();

    const summaryText = buildSummaryText(
      thisPracticeCount,
      thisTotalMinutes,
      thisAvgRating,
      topCategory,
      streakDays
    );

    return {
      weekStart: toDateStr(thisMonday),
      weekEnd: toDateStr(thisSunday),
      practiceCount: buildStat(thisPracticeCount, prevPracticeCount),
      totalMinutes: buildStat(thisTotalMinutes, prevTotalMinutes),
      averageRating: buildStat(thisAvgRating, prevAvgRating),
      streakDays,
      topCategory,
      summaryText,
      practicedDates,
      hasData: entries.length > 0,
    };
  }, [userId]);

  return { digest, loading };
}
