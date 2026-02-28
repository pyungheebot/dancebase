"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GuestInstructorData,
  GuestInstructorEntry,
  GuestInstructorLesson,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:guest-instructor:${groupId}`;
}

function loadData(groupId: string): GuestInstructorData {
  if (typeof window === "undefined") {
    return { groupId, instructors: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (raw) return JSON.parse(raw) as GuestInstructorData;
  } catch {
    // 파싱 실패 시 빈 데이터 반환
  }
  return { groupId, instructors: [], updatedAt: new Date().toISOString() };
}

function saveData(data: GuestInstructorData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(data.groupId), JSON.stringify(data));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 평점 계산 유틸
// ============================================================

export function calcAverageRating(lessons: GuestInstructorLesson[]): number {
  if (lessons.length === 0) return 0;
  const sum = lessons.reduce((acc, l) => acc + l.rating, 0);
  return Math.round((sum / lessons.length) * 10) / 10;
}

export function calcTotalCost(
  instructor: GuestInstructorEntry,
  hoursPerLesson = 1
): number {
  if (!instructor.hourlyRate) return 0;
  return instructor.hourlyRate * instructor.lessons.length * hoursPerLesson;
}

// ============================================================
// 입력 타입
// ============================================================

export type AddGuestInstructorInput = {
  name: string;
  genre: string;
  career?: string;
  phone?: string;
  email?: string;
  hourlyRate?: number;
  note?: string;
};

export type UpdateGuestInstructorInput = Partial<AddGuestInstructorInput>;

export type AddGuestLessonInput = {
  date: string;      // YYYY-MM-DD
  topic: string;
  rating: number;    // 1~5
  note?: string;
};

// ============================================================
// 훅
// ============================================================

export function useGuestInstructor(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.guestInstructor(groupId) : null,
    async () => loadData(groupId)
  );

  const storeData = data ?? {
    groupId,
    instructors: [],
    updatedAt: new Date().toISOString(),
  };

  // 강사 목록 (이름 가나다 순)
  const instructors = [...storeData.instructors].sort((a, b) =>
    a.name.localeCompare(b.name, "ko")
  );

  // ── 강사 추가 ──
  const addInstructor = useCallback(
    async (input: AddGuestInstructorInput): Promise<boolean> => {
      if (!input.name.trim()) {
        toast.error("강사 이름을 입력해주세요");
        return false;
      }
      if (!input.genre.trim()) {
        toast.error("전문 장르를 입력해주세요");
        return false;
      }

      const current = loadData(groupId);
      const now = new Date().toISOString();

      const newEntry: GuestInstructorEntry = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        genre: input.genre.trim(),
        career: input.career?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
        email: input.email?.trim() || undefined,
        hourlyRate:
          input.hourlyRate !== undefined && input.hourlyRate > 0
            ? input.hourlyRate
            : undefined,
        lessons: [],
        note: input.note?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated: GuestInstructorData = {
        ...current,
        instructors: [...current.instructors, newEntry],
        updatedAt: now,
      };
      saveData(updated);
      await mutate(updated, false);
      toast.success("강사가 등록되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 강사 수정 ──
  const updateInstructor = useCallback(
    async (
      id: string,
      changes: UpdateGuestInstructorInput
    ): Promise<boolean> => {
      const current = loadData(groupId);
      const target = current.instructors.find((i) => i.id === id);
      if (!target) {
        toast.error("강사 정보를 찾을 수 없습니다");
        return false;
      }

      const now = new Date().toISOString();
      const updated: GuestInstructorData = {
        ...current,
        instructors: current.instructors.map((i) =>
          i.id === id
            ? {
                ...i,
                name:
                  changes.name !== undefined ? changes.name.trim() : i.name,
                genre:
                  changes.genre !== undefined ? changes.genre.trim() : i.genre,
                career:
                  changes.career !== undefined
                    ? changes.career?.trim() || undefined
                    : i.career,
                phone:
                  changes.phone !== undefined
                    ? changes.phone?.trim() || undefined
                    : i.phone,
                email:
                  changes.email !== undefined
                    ? changes.email?.trim() || undefined
                    : i.email,
                hourlyRate:
                  changes.hourlyRate !== undefined
                    ? changes.hourlyRate > 0
                      ? changes.hourlyRate
                      : undefined
                    : i.hourlyRate,
                note:
                  changes.note !== undefined
                    ? changes.note?.trim() || undefined
                    : i.note,
                updatedAt: now,
              }
            : i
        ),
        updatedAt: now,
      };
      saveData(updated);
      await mutate(updated, false);
      toast.success("강사 정보가 수정되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 강사 삭제 ──
  const deleteInstructor = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadData(groupId);
      const now = new Date().toISOString();
      const updated: GuestInstructorData = {
        ...current,
        instructors: current.instructors.filter((i) => i.id !== id),
        updatedAt: now,
      };
      saveData(updated);
      await mutate(updated, false);
      toast.success("강사가 삭제되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 수업 이력 추가 ──
  const addLesson = useCallback(
    async (instructorId: string, input: AddGuestLessonInput): Promise<boolean> => {
      if (!input.date) {
        toast.error("수업 날짜를 선택해주세요");
        return false;
      }
      if (!input.topic.trim()) {
        toast.error("수업 주제를 입력해주세요");
        return false;
      }
      if (input.rating < 1 || input.rating > 5) {
        toast.error("평점은 1~5 사이여야 합니다");
        return false;
      }

      const current = loadData(groupId);
      const target = current.instructors.find((i) => i.id === instructorId);
      if (!target) {
        toast.error("강사 정보를 찾을 수 없습니다");
        return false;
      }

      const now = new Date().toISOString();
      const newLesson: GuestInstructorLesson = {
        id: crypto.randomUUID(),
        date: input.date,
        topic: input.topic.trim(),
        rating: input.rating,
        note: input.note?.trim() || undefined,
        createdAt: now,
      };

      const updated: GuestInstructorData = {
        ...current,
        instructors: current.instructors.map((i) =>
          i.id === instructorId
            ? {
                ...i,
                lessons: [...i.lessons, newLesson].sort((a, b) =>
                  b.date.localeCompare(a.date)
                ),
                updatedAt: now,
              }
            : i
        ),
        updatedAt: now,
      };
      saveData(updated);
      await mutate(updated, false);
      toast.success("수업 이력이 추가되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 수업 이력 삭제 ──
  const deleteLesson = useCallback(
    async (instructorId: string, lessonId: string): Promise<boolean> => {
      const current = loadData(groupId);
      const now = new Date().toISOString();
      const updated: GuestInstructorData = {
        ...current,
        instructors: current.instructors.map((i) =>
          i.id === instructorId
            ? {
                ...i,
                lessons: i.lessons.filter((l) => l.id !== lessonId),
                updatedAt: now,
              }
            : i
        ),
        updatedAt: now,
      };
      saveData(updated);
      await mutate(updated, false);
      toast.success("수업 이력이 삭제되었습니다");
      return true;
    },
    [groupId, mutate]
  );

  // ── 장르별 필터 ──
  function getByGenre(genre: string): GuestInstructorEntry[] {
    return instructors.filter((i) => i.genre === genre);
  }

  // ── 장르 목록 (중복 제거) ──
  const genres = Array.from(new Set(instructors.map((i) => i.genre))).sort(
    (a, b) => a.localeCompare(b, "ko")
  );

  // ── 통계 ──
  const stats = {
    total: instructors.length,
    totalLessons: instructors.reduce((acc, i) => acc + i.lessons.length, 0),
    avgRating:
      instructors.length > 0
        ? Math.round(
            (instructors.reduce(
              (acc, i) => acc + calcAverageRating(i.lessons),
              0
            ) /
              instructors.filter((i) => i.lessons.length > 0).length || 0) * 10
          ) / 10
        : 0,
    totalCost: instructors.reduce(
      (acc, i) => acc + (i.hourlyRate ? i.hourlyRate * i.lessons.length : 0),
      0
    ),
  };

  return {
    instructors,
    loading: isLoading,
    refetch: () => mutate(),
    addInstructor,
    updateInstructor,
    deleteInstructor,
    addLesson,
    deleteLesson,
    getByGenre,
    genres,
    stats,
  };
}
