"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { BirthdayMember } from "@/types";

/**
 * 이번 달과 다음 달 생일인 그룹 멤버를 조회하는 훅.
 *
 * - profiles.birth_date (YYYY-MM-DD) 필드를 사용한다.
 * - D-Day는 오늘 기준으로 이번 연도의 생일까지 남은 일수로 계산한다.
 *   (이미 지난 경우 음수, 오늘인 경우 0)
 *
 * @param groupId - 그룹 ID
 */
export function useBirthdayCalendar(groupId: string): {
  thisMonthBirthdays: BirthdayMember[];
  nextMonthBirthdays: BirthdayMember[];
  todayBirthdays: BirthdayMember[];
  loading: boolean;
  refetch: () => void;
} {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.birthdayCalendar(groupId) : null,
    async () => {
      const supabase = createClient();

      // 그룹 멤버의 프로필(birth_date 포함) 조회
      const { data: members, error } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name, avatar_url, birth_date)")
        .eq("group_id", groupId);

      if (error) {
        throw error;
      }

      if (!members || members.length === 0) {
        return {
          thisMonthBirthdays: [] as BirthdayMember[],
          nextMonthBirthdays: [] as BirthdayMember[],
          todayBirthdays: [] as BirthdayMember[],
        };
      }

      const today = new Date();
      // 시간 부분을 00:00:00으로 초기화하여 날짜만 비교
      today.setHours(0, 0, 0, 0);

      const thisMonth = today.getMonth(); // 0-indexed
      const nextMonth = (thisMonth + 1) % 12;
      const thisYear = today.getFullYear();
      const nextMonthYear = nextMonth === 0 ? thisYear + 1 : thisYear;

      const thisMonthBirthdays: BirthdayMember[] = [];
      const nextMonthBirthdays: BirthdayMember[] = [];
      const todayBirthdays: BirthdayMember[] = [];

      for (const member of members) {
        const profile = member.profiles as {
          id: string;
          name: string;
          avatar_url: string | null;
          birth_date: string | null;
        } | null;

        if (!profile || !profile.birth_date) continue;

        const parts = profile.birth_date.split("-");
        if (parts.length < 3) continue;

        const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
        const birthDay = parseInt(parts[2], 10);

        if (isNaN(birthMonth) || isNaN(birthDay)) continue;

        const monthDay = `${String(birthMonth + 1).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;

        // 이번 연도 생일 날짜 계산
        const birthdayThisYear = new Date(thisYear, birthMonth, birthDay);
        birthdayThisYear.setHours(0, 0, 0, 0);

        // D-Day 계산 (밀리초 -> 일수)
        const diffMs = birthdayThisYear.getTime() - today.getTime();
        const dDay = Math.round(diffMs / (1000 * 60 * 60 * 24));

        const isToday = dDay === 0;

        const birthdayMember: BirthdayMember = {
          userId: profile.id,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          birthDate: profile.birth_date,
          monthDay,
          birthdayThisYear,
          dDay,
          isToday,
        };

        if (isToday) {
          todayBirthdays.push(birthdayMember);
        }

        if (birthMonth === thisMonth) {
          thisMonthBirthdays.push(birthdayMember);
        } else if (birthMonth === nextMonth) {
          // 다음 달 생일은 nextMonthYear 기준으로 D-Day 재계산
          const birthdayNextMonth = new Date(nextMonthYear, birthMonth, birthDay);
          birthdayNextMonth.setHours(0, 0, 0, 0);
          const diffMsNext = birthdayNextMonth.getTime() - today.getTime();
          const dDayNext = Math.round(diffMsNext / (1000 * 60 * 60 * 24));

          nextMonthBirthdays.push({
            ...birthdayMember,
            birthdayThisYear: birthdayNextMonth,
            dDay: dDayNext,
          });
        }
      }

      // 이번 달: 날짜 오름차순 정렬
      thisMonthBirthdays.sort(
        (a, b) => a.birthdayThisYear.getTime() - b.birthdayThisYear.getTime()
      );
      // 다음 달: 날짜 오름차순 정렬
      nextMonthBirthdays.sort(
        (a, b) => a.birthdayThisYear.getTime() - b.birthdayThisYear.getTime()
      );

      return { thisMonthBirthdays, nextMonthBirthdays, todayBirthdays };
    }
  );

  return {
    thisMonthBirthdays: data?.thisMonthBirthdays ?? [],
    nextMonthBirthdays: data?.nextMonthBirthdays ?? [],
    todayBirthdays: data?.todayBirthdays ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
