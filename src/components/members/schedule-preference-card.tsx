"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  CalendarCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSchedulePreference } from "@/hooks/use-schedule-preference";
import type { WeekDayIndex, TimeSlotEntry, TimeSlotPreference } from "@/types";

// ============================================================
// 상수
// ============================================================

const DAY_LABELS: Record<WeekDayIndex, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

const DAYS: WeekDayIndex[] = [0, 1, 2, 3, 4, 5, 6];

/** 표시할 시간대: 오전 6시 ~ 오후 11시 */
const DISPLAY_HOURS: number[] = Array.from({ length: 18 }, (_, i) => i + 6);

const PREFERENCE_NEXT: Record<TimeSlotPreference, TimeSlotPreference> = {
  unavailable: "available",
  available: "preferred",
  preferred: "unavailable",
};

// ============================================================
// 유틸리티
// ============================================================

/** 참여 가능 인원 수에 따른 셀 배경 색상 반환 */
function heatColor(count: number, total: number): string {
  if (total === 0 || count === 0) return "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700";
  const ratio = count / total;
  if (ratio <= 0.2) return "bg-green-100 dark:bg-green-950 border border-green-200 dark:border-green-800";
  if (ratio <= 0.4) return "bg-green-200 dark:bg-green-900 border border-green-300 dark:border-green-700";
  if (ratio <= 0.6) return "bg-green-400 dark:bg-green-700 border border-green-500 dark:border-green-600";
  if (ratio <= 0.8) return "bg-green-600 dark:bg-green-500 border border-green-700 dark:border-green-400";
  return "bg-green-800 dark:bg-green-300 border border-green-900 dark:border-green-200";
}

/** 선호도 상태의 셀 색상 */
function preferenceColor(pref: TimeSlotPreference | undefined): string {
  if (!pref || pref === "unavailable")
    return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400";
  if (pref === "available")
    return "bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300";
  // preferred
  return "bg-amber-200 dark:bg-amber-800 border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300";
}

/** WeekDayIndex 텍스트 색 (일=빨강, 토=파랑) */
function dayColor(day: WeekDayIndex): string {
  if (day === 0) return "text-red-500 dark:text-red-400";
  if (day === 6) return "text-blue-500 dark:text-blue-400";
  return "text-gray-700 dark:text-gray-300";
}

// ============================================================
// Props
// ============================================================

interface SchedulePreferenceCardProps {
  groupId: string;
  memberNames: string[];
}

// ============================================================
// 컴포넌트
// ============================================================

export function SchedulePreferenceCard({
  groupId,
  memberNames,
}: SchedulePreferenceCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("");
  /** 편집 중인 선호도 상태: day-hour -> preference */
  const [editMap, setEditMap] = useState<
    Map<string, TimeSlotPreference>
  >(new Map());

  const {
    preferences,
    setPreference,
    deletePreference,
    getMemberPreference,
    findOptimalSlots,
    getAvailabilityMatrix,
    totalMembers,
    coverageRate,
  } = useSchedulePreference(groupId, memberNames.length);

  // 최적 슬롯 상위 3개 (9~22시, 2시간 단위)
  const optimalSlots = useMemo(
    () => findOptimalSlots(9, 22, 2).slice(0, 3),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences]
  );

  // 가용성 매트릭스
  const matrix = useMemo(
    () => getAvailabilityMatrix(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences]
  );

  // 선택한 멤버의 기존 선호도를 editMap으로 로드
  const loadMemberPreference = useCallback(
    (name: string) => {
      const existing = getMemberPreference(name);
      if (!existing) {
        setEditMap(new Map());
        return;
      }
      const map = new Map<string, TimeSlotPreference>();
      for (const entry of existing.preferences) {
        for (let h = entry.startHour; h < entry.endHour; h++) {
          map.set(`${entry.day}-${h}`, entry.preference);
        }
      }
      setEditMap(map);
    },
    [getMemberPreference]
  );

  const handleMemberChange = (name: string) => {
    setSelectedMember(name);
    loadMemberPreference(name);
  };

  // 셀 클릭: unavailable -> available -> preferred -> unavailable 순환
  const handleCellClick = (day: WeekDayIndex, hour: number) => {
    const key = `${day}-${hour}`;
    const current = editMap.get(key) ?? "unavailable";
    const next = PREFERENCE_NEXT[current];
    setEditMap((prev) => {
      const next2 = new Map(prev);
      next2.set(key, next);
      return next2;
    });
  };

  // 현재 editMap을 TimeSlotEntry[] 형태로 변환하여 저장
  const handleSave = () => {
    if (!selectedMember) {
      toast.error("멤버를 선택해주세요.");
      return;
    }

    // 연속된 동일 선호도 셀을 병합
    const entries: TimeSlotEntry[] = [];
    for (const day of DAYS) {
      let i = 0;
      while (i < DISPLAY_HOURS.length) {
        const hour = DISPLAY_HOURS[i];
        const pref = editMap.get(`${day}-${hour}`) ?? "unavailable";

        // 연속 구간 찾기
        let j = i + 1;
        while (j < DISPLAY_HOURS.length) {
          const nextHour = DISPLAY_HOURS[j];
          const nextPref = editMap.get(`${day}-${nextHour}`) ?? "unavailable";
          if (nextPref !== pref || nextHour !== DISPLAY_HOURS[j - 1] + 1) break;
          j++;
        }

        const startHour = DISPLAY_HOURS[i];
        const endHour = DISPLAY_HOURS[j - 1] + 1;

        if (pref !== "unavailable") {
          entries.push({ day, startHour, endHour, preference: pref });
        }
        i = j;
      }
    }

    setPreference(selectedMember, entries);
    toast.success(`${selectedMember}의 선호도가 저장되었습니다.`);
  };

  const handleDelete = () => {
    if (!selectedMember) return;
    deletePreference(selectedMember);
    setEditMap(new Map());
    toast.success(`${selectedMember}의 선호도가 삭제되었습니다.`);
  };

  const hasMemberData = !!getMemberPreference(selectedMember);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer select-none">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold">
                  멤버 스케줄 선호도
                </CardTitle>
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0">
                  {totalMembers}명 등록
                </Badge>
                {memberNames.length > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0">
                    커버율 {coverageRate}%
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">

            {/* 가용성 히트맵 */}
            <section>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                전체 가용성 히트맵 (요일 x 시간)
              </p>
              <div className="overflow-x-auto">
                <table className="text-[10px] border-separate border-spacing-0.5">
                  <thead>
                    <tr>
                      <th className="w-8 text-right pr-1 text-gray-400 font-normal" />
                      {DAYS.map((day) => (
                        <th
                          key={day}
                          className={cn(
                            "w-9 text-center font-semibold pb-1",
                            dayColor(day)
                          )}
                        >
                          {DAY_LABELS[day]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DISPLAY_HOURS.map((hour) => (
                      <tr key={hour}>
                        <td className="text-right pr-1 text-gray-400 font-mono leading-none py-0.5">
                          {String(hour).padStart(2, "0")}
                        </td>
                        {DAYS.map((day) => {
                          const cell = matrix[day]?.[hour];
                          const count = cell?.availableCount ?? 0;
                          return (
                            <td key={day} className="p-0">
                              <div
                                className={cn(
                                  "w-9 h-4 rounded-sm",
                                  heatColor(count, totalMembers)
                                )}
                                title={`${DAY_LABELS[day]} ${hour}시: ${count}명 가능`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* 범례 */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400">적음</span>
                {["bg-background border border-gray-200", "bg-green-100", "bg-green-200", "bg-green-400", "bg-green-600", "bg-green-800"].map(
                  (cls, i) => (
                    <div
                      key={i}
                      className={cn("w-3 h-3 rounded-sm", cls)}
                    />
                  )
                )}
                <span className="text-[10px] text-gray-400">많음</span>
              </div>
            </section>

            {/* 최적 시간대 추천 */}
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="h-3 w-3 text-amber-500" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  추천 시간대 상위 3개
                </p>
              </div>
              {optimalSlots.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">
                  선호도 데이터가 부족합니다. 멤버를 등록해주세요.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {optimalSlots.map((slot, idx) => (
                    <div
                      key={`${slot.day}-${slot.startHour}-${idx}`}
                      className="flex items-center justify-between bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-1.5 border border-amber-100 dark:border-amber-900"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 w-4">
                          {idx + 1}위
                        </span>
                        <span className={cn("text-xs font-semibold", dayColor(slot.day))}>
                          {DAY_LABELS[slot.day]}요일
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {String(slot.startHour).padStart(2, "0")}:00
                          {" ~ "}
                          {String(slot.endHour).padStart(2, "0")}:00
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
                          <Users className="h-2.5 w-2.5 mr-0.5" />
                          가능 {slot.availableCount}명
                        </Badge>
                        {slot.preferredCount > 0 && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
                            <Star className="h-2.5 w-2.5 mr-0.5" />
                            선호 {slot.preferredCount}명
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 멤버 선호도 입력 */}
            <section>
              <div className="flex items-center gap-1.5 mb-2">
                <CalendarCheck className="h-3 w-3 text-indigo-500" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  멤버 선호도 입력
                </p>
              </div>

              {/* 멤버 선택 */}
              <div className="flex items-center gap-2 mb-3">
                <Select value={selectedMember} onValueChange={handleMemberChange}>
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="멤버 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                        {getMemberPreference(name) && (
                          <span className="ml-1 text-[10px] text-green-600">(등록됨)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedMember && hasMemberData && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    삭제
                  </Button>
                )}
              </div>

              {selectedMember ? (
                <>
                  {/* 범례 */}
                  <div className="flex items-center gap-3 mb-2">
                    {(
                      [
                        { pref: "unavailable" as TimeSlotPreference, label: "불가" },
                        { pref: "available" as TimeSlotPreference, label: "가능" },
                        { pref: "preferred" as TimeSlotPreference, label: "선호" },
                      ] as const
                    ).map(({ pref, label }) => (
                      <div key={pref} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-sm",
                            preferenceColor(pref)
                          )}
                        />
                        <span className="text-[10px] text-gray-500">{label}</span>
                      </div>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-auto">
                      셀 클릭으로 순환 (불가 → 가능 → 선호)
                    </span>
                  </div>

                  {/* 편집 그리드 */}
                  <div className="overflow-x-auto">
                    <table className="text-[10px] border-separate border-spacing-0.5">
                      <thead>
                        <tr>
                          <th className="w-8 text-right pr-1 text-gray-400 font-normal" />
                          {DAYS.map((day) => (
                            <th
                              key={day}
                              className={cn(
                                "w-9 text-center font-semibold pb-1",
                                dayColor(day)
                              )}
                            >
                              {DAY_LABELS[day]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DISPLAY_HOURS.map((hour) => (
                          <tr key={hour}>
                            <td className="text-right pr-1 text-gray-400 font-mono leading-none py-0.5">
                              {String(hour).padStart(2, "0")}
                            </td>
                            {DAYS.map((day) => {
                              const key = `${day}-${hour}`;
                              const pref =
                                editMap.get(key) ?? "unavailable";
                              return (
                                <td key={day} className="p-0">
                                  <button
                                    type="button"
                                    onClick={() => handleCellClick(day, hour)}
                                    className={cn(
                                      "w-9 h-4 rounded-sm cursor-pointer transition-colors duration-100 focus:outline-none focus:ring-1 focus:ring-indigo-400",
                                      preferenceColor(pref)
                                    )}
                                    title={`${DAY_LABELS[day]} ${hour}시 (${pref})`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={handleSave}
                    >
                      <CalendarCheck className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">
                  위에서 멤버를 선택하면 선호도를 입력할 수 있습니다.
                </p>
              )}
            </section>

            {/* 등록 현황 요약 */}
            {preferences.length > 0 && (
              <section className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  등록 현황
                </p>
                <div className="flex flex-wrap gap-1">
                  {preferences.map((p) => (
                    <Badge
                      key={p.memberName}
                      className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {p.memberName}
                    </Badge>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
