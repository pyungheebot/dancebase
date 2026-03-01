"use client";

import { useState, useMemo } from "react";
import {
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useSocialCalendar } from "@/hooks/use-social-calendar";
import type { SocialCalendarPost, SocialPlatformType } from "@/types";

import {
  PLATFORM_LABEL,
  PLATFORM_COLOR,
  PLATFORMS,
  STATUS_LABEL,
  DAY_NAMES,
  getDaysInMonth,
  getFirstDayOfWeek,
  formatDate,
  getNextStatus,
  EMPTY_FORM,
  type PostForm,
} from "./social-calendar/types";
import { PostListItem } from "./social-calendar/post-list-item";
import { PlatformStats } from "./social-calendar/platform-stats";
import { PostFormDialog } from "./social-calendar/post-form-dialog";

// ============================================================
// 메인 컴포넌트
// ============================================================

export function SocialCalendarCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    loading,
    addPost,
    updatePost,
    deletePost,
    updateStatus,
    getPostsByMonth,
    stats,
  } = useSocialCalendar(groupId);

  const today = new Date();
  const [open, setOpen] = useState(true);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | SocialPlatformType>("all");

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SocialCalendarPost | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);

  // 월별 게시물 맵 (날짜 -> 게시물 배열)
  const monthPosts = useMemo(
    () => getPostsByMonth(currentYear, currentMonth),
    [getPostsByMonth, currentYear, currentMonth]
  );

  const postsByDate = useMemo(() => {
    const map = new Map<string, SocialCalendarPost[]>();
    for (const p of monthPosts) {
      const arr = map.get(p.scheduledDate) ?? [];
      arr.push(p);
      map.set(p.scheduledDate, arr);
    }
    return map;
  }, [monthPosts]);

  // 선택 날짜 게시물 + 탭 필터
  const selectedPosts = useMemo(() => {
    if (!selectedDate) return [];
    const arr = postsByDate.get(selectedDate) ?? [];
    if (activeTab === "all") return arr;
    return arr.filter((p) => p.platform === activeTab);
  }, [selectedDate, postsByDate, activeTab]);

  // 달력 이동
  function prevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  // 다이얼로그 열기
  function openAdd() {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM, scheduledDate: selectedDate ?? "" });
    setDialogOpen(true);
  }

  function openEdit(post: SocialCalendarPost) {
    setEditTarget(post);
    setForm({
      platform: post.platform,
      title: post.title,
      content: post.content,
      scheduledDate: post.scheduledDate,
      scheduledTime: post.scheduledTime ?? "",
      status: post.status,
      assignee: post.assignee ?? "",
      hashtagsRaw: post.hashtags.join(", "),
      mediaType: post.mediaType ?? "",
      notes: post.notes ?? "",
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error(TOAST.SOCIAL_CALENDAR.TITLE_REQUIRED);
      return;
    }
    if (!form.scheduledDate) {
      toast.error(TOAST.SOCIAL_CALENDAR.DATE_REQUIRED);
      return;
    }

    const hashtags = form.hashtagsRaw
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);

    const payload: Omit<SocialCalendarPost, "id" | "createdAt"> = {
      platform: form.platform,
      title: form.title.trim(),
      content: form.content.trim(),
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime || undefined,
      status: form.status,
      assignee: form.assignee || undefined,
      hashtags,
      mediaType: form.mediaType || undefined,
      notes: form.notes || undefined,
    };

    if (editTarget) {
      updatePost(editTarget.id, payload);
      toast.success(TOAST.SOCIAL_CALENDAR.UPDATED);
    } else {
      addPost(payload);
      toast.success(TOAST.SOCIAL_CALENDAR.ADDED);
    }
    closeDialog();
  }

  function handleDelete(id: string) {
    deletePost(id);
    toast.success(TOAST.SOCIAL_CALENDAR.DELETED);
  }

  function handleAdvanceStatus(post: SocialCalendarPost) {
    const next = getNextStatus(post.status);
    if (!next) return;
    updateStatus(post.id, next);
    toast.success(`상태가 "${STATUS_LABEL[next]}"(으)로 변경되었습니다.`);
  }

  // 달력 계산
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-lg select-none"
            role="button"
            aria-expanded={open}
            aria-controls="social-calendar-content"
          >
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-purple-500" aria-hidden="true" />
              <span className="font-semibold text-sm">소셜 미디어 캘린더</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
                {stats.totalPosts}건
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 hidden sm:block" aria-live="polite">
                초안 {stats.draftCount} · 예정 {stats.scheduledCount} · 완료{" "}
                {stats.publishedCount}
              </span>
              {open ? (
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent id="social-calendar-content">
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* 월 이동 헤더 */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={prevMonth}
                aria-label="이전 달"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm font-medium" aria-live="polite" aria-atomic="true">
                {currentYear}년 {currentMonth}월
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={nextMonth}
                aria-label="다음 달"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* 미니 캘린더 */}
            <div role="grid" aria-label={`${currentYear}년 ${currentMonth}월 달력`}>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1" role="row">
                {DAY_NAMES.map((d) => (
                  <div
                    key={d}
                    role="columnheader"
                    aria-label={`${d}요일`}
                    className="text-center text-[10px] text-gray-400 font-medium py-0.5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 칸 */}
              <div className="grid grid-cols-7 gap-y-0.5" role="rowgroup">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(currentYear, currentMonth, day);
                  const dayPosts = postsByDate.get(dateStr) ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  const platforms = Array.from(
                    new Set(dayPosts.map((p) => p.platform))
                  ).slice(0, 3);

                  return (
                    <div key={dateStr} role="gridcell">
                      <button
                        onClick={() =>
                          setSelectedDate(isSelected ? null : dateStr)
                        }
                        aria-pressed={isSelected}
                        aria-label={`${currentMonth}월 ${day}일${isToday ? " (오늘)" : ""}${dayPosts.length > 0 ? `, 게시물 ${dayPosts.length}건` : ""}`}
                        className={cn(
                          "flex flex-col items-center rounded py-0.5 text-xs transition-colors w-full",
                          isSelected ? "bg-purple-100" : "hover:bg-gray-100",
                          isToday && !isSelected && "font-bold text-purple-600"
                        )}
                      >
                        <span
                          className={cn(
                            "leading-tight",
                            isToday && isSelected && "text-purple-700 font-bold"
                          )}
                        >
                          {day}
                        </span>
                        {/* 플랫폼 dot */}
                        <div
                          className="flex gap-0.5 mt-0.5 h-2"
                          aria-hidden="true"
                        >
                          {platforms.map((pl) => (
                            <span
                              key={pl}
                              className={cn(
                                "inline-block w-1.5 h-1.5 rounded-full",
                                PLATFORM_COLOR[pl]
                              )}
                            />
                          ))}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 플랫폼 범례 */}
            <div
              className="flex flex-wrap gap-x-3 gap-y-1"
              role="list"
              aria-label="플랫폼 범례"
            >
              {PLATFORMS.map((pl) => (
                <div key={pl} className="flex items-center gap-1" role="listitem">
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-full",
                      PLATFORM_COLOR[pl]
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-gray-500">
                    {PLATFORM_LABEL[pl]}
                  </span>
                </div>
              ))}
            </div>

            {/* 선택 날짜 게시물 목록 */}
            {selectedDate && (
              <section aria-label={`${selectedDate.replace(/-/g, ".")} 게시물`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">
                    <time dateTime={selectedDate}>
                      {selectedDate.replace(/-/g, ".")}
                    </time>{" "}
                    게시물
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={openAdd}
                    aria-label="게시물 추가"
                  >
                    <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                    추가
                  </Button>
                </div>

                {/* 플랫폼 탭 필터 */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(v as "all" | SocialPlatformType)
                  }
                >
                  <TabsList
                    className="h-7 gap-0.5 bg-gray-100 p-0.5"
                    role="tablist"
                    aria-label="플랫폼 필터"
                  >
                    <TabsTrigger
                      value="all"
                      className="h-6 text-[10px] px-2"
                      role="tab"
                    >
                      전체
                    </TabsTrigger>
                    {PLATFORMS.filter(
                      (pl) =>
                        (postsByDate.get(selectedDate) ?? []).some(
                          (p) => p.platform === pl
                        )
                    ).map((pl) => (
                      <TabsTrigger
                        key={pl}
                        value={pl}
                        className="h-6 text-[10px] px-2"
                        role="tab"
                      >
                        {PLATFORM_LABEL[pl]}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-2 space-y-2">
                    {loading ? (
                      <p
                        className="text-xs text-gray-400"
                        role="status"
                        aria-live="polite"
                      >
                        불러오는 중...
                      </p>
                    ) : selectedPosts.length === 0 ? (
                      <p
                        className="text-xs text-gray-400"
                        role="status"
                        aria-live="polite"
                      >
                        이 날짜에 게시물이 없습니다.
                      </p>
                    ) : (
                      <div role="list" aria-label="게시물 목록">
                        {selectedPosts.map((post) => (
                          <div key={post.id} role="listitem" className="mb-2 last:mb-0">
                            <PostListItem
                              post={post}
                              onEdit={openEdit}
                              onDelete={handleDelete}
                              onAdvanceStatus={handleAdvanceStatus}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </section>
            )}

            {/* 날짜 미선택 시 추가 안내 */}
            {!selectedDate && (
              <div className="text-center py-2" role="note">
                <p className="text-xs text-gray-400">
                  날짜를 선택하면 게시물을 확인하거나 추가할 수 있습니다.
                </p>
              </div>
            )}

            {/* 플랫폼별 통계 요약 */}
            {stats.totalPosts > 0 && (
              <PlatformStats platformBreakdown={stats.platformBreakdown} />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 게시물 추가/수정 다이얼로그 */}
      <PostFormDialog
        open={dialogOpen}
        editTarget={editTarget}
        form={form}
        memberNames={memberNames}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        onFormChange={setForm}
      />
    </Card>
  );
}
