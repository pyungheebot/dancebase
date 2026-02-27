"use client";

import { useState } from "react";
import Link from "next/link";
import { Cake, Gift, MessageCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBirthdayCalendar } from "@/hooks/use-birthday-calendar";
import type { BirthdayMember } from "@/types";

// ----------------------------------------------------------------
// 헬퍼: D-Day 배지 텍스트
// ----------------------------------------------------------------
function dDayLabel(dDay: number): string {
  if (dDay === 0) return "D-Day";
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
}

// ----------------------------------------------------------------
// 헬퍼: 생일 날짜 한글 표기 (MM월 DD일)
// ----------------------------------------------------------------
function formatBirthday(monthDay: string): string {
  const [month, day] = monthDay.split("-");
  return `${parseInt(month, 10)}월 ${parseInt(day, 10)}일`;
}

// ----------------------------------------------------------------
// 오늘 생일 축하 배너
// ----------------------------------------------------------------
function TodayBirthdayBanner({ members }: { members: BirthdayMember[] }) {
  if (members.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 px-3 py-2.5">
      <p className="text-xs font-semibold text-pink-700 mb-1.5 flex items-center gap-1">
        <span>🎂</span>
        오늘의 생일
      </p>
      <div className="flex flex-col gap-1.5">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.name} />}
                <AvatarFallback className="text-[10px]">
                  {m.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-pink-800">{m.name}</span>
              <span className="text-[10px] text-pink-600">생일 축하해요!</span>
            </div>
            <Link href={`/messages/${m.userId}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-pink-600 hover:text-pink-800 hover:bg-pink-100"
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// 단일 멤버 행
// ----------------------------------------------------------------
function BirthdayRow({ member }: { member: BirthdayMember }) {
  const dDayText = dDayLabel(member.dDay);
  const isPast = member.dDay < 0;
  const isToday = member.isToday;

  return (
    <div
      className={`flex items-center justify-between py-1.5 px-1 rounded-md transition-colors ${
        isToday ? "bg-pink-50" : "hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* 이모지 */}
        <span className="text-sm shrink-0">{isToday ? "🎂" : "🎁"}</span>

        {/* 아바타 */}
        <Avatar className="h-6 w-6 shrink-0">
          {member.avatarUrl && (
            <AvatarImage src={member.avatarUrl} alt={member.name} />
          )}
          <AvatarFallback className="text-[10px]">
            {member.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {/* 이름 + 날짜 */}
        <div className="min-w-0">
          <span
            className={`text-xs font-medium truncate block ${
              isToday ? "text-pink-700" : ""
            }`}
          >
            {member.name}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatBirthday(member.monthDay)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* D-Day 배지 */}
        <Badge
          className={`text-[10px] px-1.5 py-0 ${
            isToday
              ? "bg-pink-100 text-pink-700 border-pink-200"
              : isPast
              ? "bg-gray-100 text-gray-500 border-gray-200"
              : "bg-blue-50 text-blue-600 border-blue-200"
          }`}
          variant="outline"
        >
          {dDayText}
        </Badge>

        {/* DM 바로가기 */}
        <Link href={`/messages/${member.userId}`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// 스켈레톤
// ----------------------------------------------------------------
function BirthdayCalendarSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-20 mb-1" />
              <Skeleton className="h-2.5 w-14" />
            </div>
            <Skeleton className="h-4 w-10 rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------
// 메인 위젯
// ----------------------------------------------------------------
export function BirthdayCalendar({ groupId }: { groupId: string }) {
  const [nextMonthOpen, setNextMonthOpen] = useState(false);

  const { thisMonthBirthdays, nextMonthBirthdays, todayBirthdays, loading } =
    useBirthdayCalendar(groupId);

  if (loading) {
    return <BirthdayCalendarSkeleton />;
  }

  const today = new Date();
  const thisMonthLabel = `${today.getMonth() + 1}월 생일`;
  const nextMonthLabel = `${((today.getMonth() + 1) % 12) + 1}월 생일`;

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Cake className="h-4 w-4 text-pink-500" />
          생일 달력
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-3">
        {/* 오늘 생일 배너 */}
        <TodayBirthdayBanner members={todayBirthdays} />

        {/* 이번 달 생일 */}
        <div className="mb-1">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {thisMonthLabel}
            </span>
            {thisMonthBirthdays.length > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 ml-0.5"
              >
                {thisMonthBirthdays.length}
              </Badge>
            )}
          </div>

          {thisMonthBirthdays.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">
              이번 달 생일인 멤버가 없습니다
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {thisMonthBirthdays.map((m) => (
                <BirthdayRow key={m.userId} member={m} />
              ))}
            </div>
          )}
        </div>

        {/* 다음 달 생일 - 접이식 */}
        {nextMonthBirthdays.length > 0 && (
          <div className="mt-2 border-t pt-2">
            <button
              onClick={() => setNextMonthOpen((prev) => !prev)}
              className="flex items-center gap-1 w-full text-left group"
            >
              <Gift className="h-3 w-3 text-muted-foreground" />
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                {nextMonthLabel}
              </span>
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 mr-1"
              >
                {nextMonthBirthdays.length}
              </Badge>
              {nextMonthOpen ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
              )}
            </button>

            {nextMonthOpen && (
              <div className="flex flex-col gap-0.5 mt-1">
                {nextMonthBirthdays.map((m) => (
                  <BirthdayRow key={m.userId} member={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 다음 달 생일도 없는 경우 */}
        {thisMonthBirthdays.length === 0 && nextMonthBirthdays.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-1">
            다음 달에도 생일인 멤버가 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  );
}
