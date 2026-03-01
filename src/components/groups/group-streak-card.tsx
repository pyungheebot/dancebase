"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CollapsibleCard } from "@/components/shared/collapsible-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  Trophy,
  UserPlus,
  Trash2,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import {
  useGroupStreak,
  calcCurrentStreak,
  calcLongestStreak,
  calcMonthlyRate,
  getLast7Days,
} from "@/hooks/use-group-streak";
import { StreakTrackMilestone } from "@/types";
import { cn } from "@/lib/utils";

const MILESTONES: StreakTrackMilestone[] = [7, 30, 100];

const MILESTONE_LABELS: Record<StreakTrackMilestone, string> = {
  7: "7일",
  30: "30일",
  100: "100일",
};

const MILESTONE_COLORS: Record<StreakTrackMilestone, string> = {
  7: "bg-blue-100 text-blue-700 border-blue-200",
  30: "bg-purple-100 text-purple-700 border-purple-200",
  100: "bg-amber-100 text-amber-700 border-amber-200",
};

export function GroupStreakCard({ groupId }: { groupId: string }) {
  const { streakData, loading, addMember, removeMember, upsertRecord } =
    useGroupStreak(groupId);

  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [savingRecord, setSavingRecord] = useState(false);

  const last7Days = getLast7Days();

  /** 멤버 추가 핸들러 */
  async function handleAddMember() {
    const trimmed = newMemberName.trim();
    if (!trimmed) {
      toast.error("멤버명을 입력해주세요.");
      return;
    }
    if (
      streakData.members.some(
        (m) => m.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error("이미 등록된 멤버명입니다.");
      return;
    }
    setAddingMember(true);
    try {
      await addMember(trimmed);
      setNewMemberName("");
      toast.success(`${trimmed} 멤버가 추가되었습니다.`);
    } catch {
      toast.error("멤버 추가에 실패했습니다.");
    } finally {
      setAddingMember(false);
    }
  }

  /** 멤버 삭제 핸들러 */
  async function handleRemoveMember(memberId: string, memberName: string) {
    try {
      await removeMember(memberId);
      if (selectedMemberId === memberId) setSelectedMemberId(null);
      toast.success(`${memberName} 멤버가 삭제되었습니다.`);
    } catch {
      toast.error("멤버 삭제에 실패했습니다.");
    }
  }

  /** 출석 기록 토글 핸들러 */
  async function handleToggleAttendance(
    memberId: string,
    date: string,
    currentAttended: boolean
  ) {
    setSavingRecord(true);
    try {
      await upsertRecord(memberId, date, !currentAttended);
      toast.success(!currentAttended ? "출석 처리되었습니다." : "결석으로 변경되었습니다.");
    } catch {
      toast.error("출석 기록 저장에 실패했습니다.");
    } finally {
      setSavingRecord(false);
    }
  }

  /** 날짜로 해당 멤버 출석 여부 확인 */
  function isAttended(memberId: string, date: string): boolean {
    const member = streakData.members.find((m) => m.id === memberId);
    if (!member) return false;
    return member.records.some((r) => r.date === date && r.attended);
  }

  /** 리더보드 데이터 생성 */
  const leaderboard = streakData.members
    .map((m) => ({
      memberId: m.id,
      memberName: m.name,
      currentStreak: calcCurrentStreak(m.records),
      longestStreak: calcLongestStreak(m.records),
      monthlyRate: calcMonthlyRate(m.records),
    }))
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const selectedMember = selectedMemberId
    ? streakData.members.find((m) => m.id === selectedMemberId) ?? null
    : null;

  return (
    <CollapsibleCard
      title="출석 스트릭"
      icon={<Flame className="h-4 w-4 text-orange-500" />}
    >
          <div className="space-y-4">
            {/* 멤버 추가 */}
            <div className="flex gap-2">
              <Input
                placeholder="멤버 이름 입력"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddMember();
                }}
                className="h-7 text-xs"
                disabled={addingMember}
              />
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleAddMember}
                disabled={addingMember}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                추가
              </Button>
            </div>

            {loading ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                불러오는 중...
              </div>
            ) : streakData.members.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
                멤버를 추가하여 스트릭을 트래킹해보세요.
              </div>
            ) : (
              <>
                {/* 리더보드 */}
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Trophy className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      스트릭 리더보드
                    </span>
                  </div>
                  <div className="space-y-1">
                    {leaderboard.map((entry, idx) => (
                      <button
                        key={entry.memberId}
                        type="button"
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors",
                          selectedMemberId === entry.memberId
                            ? "bg-orange-50 border border-orange-200"
                            : "hover:bg-muted/50"
                        )}
                        onClick={() =>
                          setSelectedMemberId(
                            selectedMemberId === entry.memberId
                              ? null
                              : entry.memberId
                          )
                        }
                      >
                        {/* 순위 */}
                        <span
                          className={cn(
                            "text-[10px] font-bold w-4 shrink-0 text-center",
                            idx === 0
                              ? "text-yellow-500"
                              : idx === 1
                              ? "text-slate-400"
                              : idx === 2
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          )}
                        >
                          {idx + 1}
                        </span>

                        {/* 이름 */}
                        <span className="text-xs font-medium flex-1 truncate">
                          {entry.memberName}
                        </span>

                        {/* 현재 스트릭 */}
                        <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold shrink-0">
                          <Flame className="h-3 w-3" />
                          {entry.currentStreak}일
                        </span>

                        {/* 이번 달 출석률 */}
                        <span className="text-[10px] text-muted-foreground shrink-0 w-10 text-right">
                          {entry.monthlyRate}%
                        </span>

                        {/* 삭제 버튼 */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveMember(
                              entry.memberId,
                              entry.memberName
                            );
                          }}
                          aria-label="멤버 제거"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 멤버 상세 */}
                {selectedMember && (
                  <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                    {/* 헤더 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {selectedMember.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-xs text-orange-500 font-semibold">
                          <Flame className="h-3 w-3" />
                          현재 {calcCurrentStreak(selectedMember.records)}일
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          최장 {calcLongestStreak(selectedMember.records)}일
                        </span>
                      </div>
                    </div>

                    {/* 마일스톤 뱃지 */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {MILESTONES.map((ms) => {
                        const achieved =
                          calcLongestStreak(selectedMember.records) >= ms;
                        return (
                          <Badge
                            key={ms}
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 font-medium",
                              achieved
                                ? MILESTONE_COLORS[ms]
                                : "text-muted-foreground opacity-40"
                            )}
                          >
                            {achieved ? "★" : "☆"} {MILESTONE_LABELS[ms]}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* 이번 달 출석률 */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">
                          이번 달 출석률
                        </span>
                        <span className="text-xs font-semibold text-blue-600">
                          {calcMonthlyRate(selectedMember.records)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${calcMonthlyRate(selectedMember.records)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* 주별 히트맵 (7일) */}
                    <div>
                      <span className="text-[10px] text-muted-foreground block mb-1.5">
                        최근 7일
                      </span>
                      <div className="flex gap-1">
                        {last7Days.map((date) => {
                          const attended = isAttended(selectedMember.id, date);
                          const isToday =
                            date === new Date().toISOString().slice(0, 10);
                          const dayLabel = new Date(date).toLocaleDateString(
                            "ko-KR",
                            { weekday: "narrow" }
                          );
                          return (
                            <button
                              key={date}
                              type="button"
                              disabled={savingRecord}
                              title={`${date} ${attended ? "출석" : "결석"}`}
                              onClick={() =>
                                handleToggleAttendance(
                                  selectedMember.id,
                                  date,
                                  attended
                                )
                              }
                              className={cn(
                                "flex flex-col items-center gap-0.5 flex-1",
                                "rounded transition-all",
                                savingRecord ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                              )}
                            >
                              <span className="text-[9px] text-muted-foreground">
                                {dayLabel}
                              </span>
                              <div
                                className={cn(
                                  "w-full aspect-square rounded-sm border transition-colors",
                                  attended
                                    ? "bg-orange-400 border-orange-500"
                                    : "bg-muted border-muted-foreground/20 hover:border-muted-foreground/40",
                                  isToday && !attended &&
                                    "border-orange-300 border-dashed"
                                )}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 날짜 직접 입력으로 출석 기록 */}
                    <div className="border-t pt-2">
                      <span className="text-[10px] text-muted-foreground block mb-1.5">
                        날짜 선택 후 출석/결석 기록
                      </span>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={recordDate}
                          onChange={(e) => setRecordDate(e.target.value)}
                          className="h-7 text-xs flex-1"
                          disabled={savingRecord}
                        />
                        <Button
                          size="sm"
                          className="h-7 text-xs shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={() =>
                            handleToggleAttendance(
                              selectedMember.id,
                              recordDate,
                              isAttended(selectedMember.id, recordDate)
                            )
                          }
                          disabled={savingRecord || !recordDate}
                        >
                          {isAttended(selectedMember.id, recordDate) ? (
                            <>
                              <CalendarX className="h-3 w-3 mr-1" />
                              결석
                            </>
                          ) : (
                            <>
                              <CalendarCheck className="h-3 w-3 mr-1" />
                              출석
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 그룹 요약 */}
                {leaderboard.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 border-t pt-3">
                    <div className="text-center">
                      <div className="text-xs font-semibold text-orange-500">
                        {Math.max(...leaderboard.map((e) => e.currentStreak))}일
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        최고 현재 스트릭
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-purple-500">
                        {Math.max(...leaderboard.map((e) => e.longestStreak))}일
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        최장 스트릭 기록
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-semibold text-blue-500">
                        {Math.round(
                          leaderboard.reduce((s, e) => s + e.monthlyRate, 0) /
                            leaderboard.length
                        )}
                        %
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        평균 이번 달 출석
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
    </CollapsibleCard>
  );
}
