"use client";

import { useState, useMemo } from "react";
import {
  Share2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Edit2,
  Hash,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSocialCalendar } from "@/hooks/use-social-calendar";
import type {
  SocialCalendarPost,
  SocialPlatformType,
  SocialPostStatus,
} from "@/types";

// ============================================================
// 상수 / 헬퍼
// ============================================================

const PLATFORM_LABEL: Record<SocialPlatformType, string> = {
  instagram: "인스타그램",
  youtube: "유튜브",
  tiktok: "틱톡",
  twitter: "트위터",
  facebook: "페이스북",
  blog: "블로그",
};

const PLATFORM_COLOR: Record<SocialPlatformType, string> = {
  instagram: "bg-purple-500",
  youtube: "bg-red-500",
  tiktok: "bg-gray-900",
  twitter: "bg-blue-400",
  facebook: "bg-indigo-700",
  blog: "bg-green-500",
};

const PLATFORM_BADGE: Record<SocialPlatformType, string> = {
  instagram: "bg-purple-100 text-purple-700",
  youtube: "bg-red-100 text-red-700",
  tiktok: "bg-gray-100 text-gray-800",
  twitter: "bg-blue-100 text-blue-700",
  facebook: "bg-indigo-100 text-indigo-700",
  blog: "bg-green-100 text-green-700",
};

const STATUS_LABEL: Record<SocialPostStatus, string> = {
  draft: "초안",
  scheduled: "예정",
  published: "게시완료",
  cancelled: "취소",
};

const STATUS_BADGE: Record<SocialPostStatus, string> = {
  draft: "bg-blue-100 text-blue-700",
  scheduled: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const MEDIA_TYPE_LABEL: Record<string, string> = {
  photo: "사진",
  video: "영상",
  reel: "릴스",
  story: "스토리",
  text: "텍스트",
};

const PLATFORMS: SocialPlatformType[] = [
  "instagram",
  "youtube",
  "tiktok",
  "twitter",
  "facebook",
  "blog",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ============================================================
// 빈 폼 상태
// ============================================================

type PostForm = {
  platform: SocialPlatformType;
  title: string;
  content: string;
  scheduledDate: string;
  scheduledTime: string;
  status: SocialPostStatus;
  assignee: string;
  hashtagsRaw: string; // 쉼표 구분
  mediaType: "photo" | "video" | "reel" | "story" | "text" | "";
  notes: string;
};

const EMPTY_FORM: PostForm = {
  platform: "instagram",
  title: "",
  content: "",
  scheduledDate: "",
  scheduledTime: "",
  status: "draft",
  assignee: "",
  hashtagsRaw: "",
  mediaType: "",
  notes: "",
};

// ============================================================
// 컴포넌트
// ============================================================

export function SocialCalendarCard({
  groupId,
  memberNames = [],
}: {
  groupId: string;
  memberNames?: string[];
}) {
  const {
    posts,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, currentYear, currentMonth]
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
    setForm({
      ...EMPTY_FORM,
      scheduledDate: selectedDate ?? "",
    });
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
      toast.error("제목을 입력하세요.");
      return;
    }
    if (!form.scheduledDate) {
      toast.error("게시 날짜를 선택하세요.");
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
      toast.success("게시물이 수정되었습니다.");
    } else {
      addPost(payload);
      toast.success("게시물이 추가되었습니다.");
    }
    closeDialog();
  }

  function handleDelete(id: string) {
    deletePost(id);
    toast.success("게시물이 삭제되었습니다.");
  }

  // 상태 워크플로우 버튼
  function getNextStatus(
    current: SocialPostStatus
  ): SocialPostStatus | null {
    if (current === "draft") return "scheduled";
    if (current === "scheduled") return "published";
    return null;
  }

  function handleAdvanceStatus(post: SocialCalendarPost) {
    const next = getNextStatus(post.status);
    if (!next) return;
    updateStatus(post.id, next);
    toast.success(`상태가 "${STATUS_LABEL[next]}"(으)로 변경되었습니다.`);
  }

  // 달력 렌더링
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <Card className="w-full">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-lg select-none">
            <div className="flex items-center gap-2">
              <Share2 className="h-4 w-4 text-purple-500" />
              <span className="font-semibold text-sm">소셜 미디어 캘린더</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
                {stats.totalPosts}건
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* 요약 배지 */}
              <span className="text-[10px] text-gray-400 hidden sm:block">
                초안 {stats.draftCount} · 예정 {stats.scheduledCount} · 완료{" "}
                {stats.publishedCount}
              </span>
              {open ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4 space-y-4">
            {/* 월 이동 헤더 */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentYear}년 {currentMonth}월
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 미니 캘린더 */}
            <div>
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] text-gray-400 font-medium py-0.5"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* 날짜 칸 */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {/* 빈 칸 */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = formatDate(currentYear, currentMonth, day);
                  const dayPosts = postsByDate.get(dateStr) ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  // 플랫폼 dot (최대 3개 표시)
                  const platforms = Array.from(
                    new Set(dayPosts.map((p) => p.platform))
                  ).slice(0, 3);

                  return (
                    <button
                      key={dateStr}
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateStr)
                      }
                      className={cn(
                        "flex flex-col items-center rounded py-0.5 text-xs transition-colors",
                        isSelected
                          ? "bg-purple-100"
                          : "hover:bg-gray-100",
                        isToday &&
                          !isSelected &&
                          "font-bold text-purple-600"
                      )}
                    >
                      <span
                        className={cn(
                          "leading-tight",
                          isToday &&
                            isSelected &&
                            "text-purple-700 font-bold"
                        )}
                      >
                        {day}
                      </span>
                      {/* 플랫폼 dot */}
                      <div className="flex gap-0.5 mt-0.5 h-2">
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
                  );
                })}
              </div>
            </div>

            {/* 플랫폼 범례 */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {PLATFORMS.map((pl) => (
                <div key={pl} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "inline-block w-2 h-2 rounded-full",
                      PLATFORM_COLOR[pl]
                    )}
                  />
                  <span className="text-[10px] text-gray-500">
                    {PLATFORM_LABEL[pl]}
                  </span>
                </div>
              ))}
            </div>

            {/* 선택 날짜 게시물 목록 */}
            {selectedDate && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">
                    {selectedDate.replace(/-/g, ".")} 게시물
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={openAdd}
                  >
                    <Plus className="h-3 w-3 mr-1" />
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
                  <TabsList className="h-7 gap-0.5 bg-gray-100 p-0.5">
                    <TabsTrigger value="all" className="h-6 text-[10px] px-2">
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
                      >
                        {PLATFORM_LABEL[pl]}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-2 space-y-2">
                    {loading ? (
                      <p className="text-xs text-gray-400">불러오는 중...</p>
                    ) : selectedPosts.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        이 날짜에 게시물이 없습니다.
                      </p>
                    ) : (
                      selectedPosts.map((post) => {
                        const nextStatus = getNextStatus(post.status);
                        return (
                          <div
                            key={post.id}
                            className="border rounded-md p-2.5 space-y-1.5 bg-white"
                          >
                            {/* 상단: 플랫폼 배지 + 제목 + 액션 */}
                            <div className="flex items-start gap-2">
                              <Badge
                                className={cn(
                                  "text-[10px] px-1.5 py-0 shrink-0",
                                  PLATFORM_BADGE[post.platform]
                                )}
                              >
                                {PLATFORM_LABEL[post.platform]}
                              </Badge>
                              <span className="text-xs font-medium flex-1 leading-tight">
                                {post.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
                                  onClick={() => openEdit(post)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                  onClick={() => handleDelete(post.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* 메타 정보 */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <Badge
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  STATUS_BADGE[post.status]
                                )}
                              >
                                {STATUS_LABEL[post.status]}
                              </Badge>
                              {post.mediaType && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                  <FileText className="h-3 w-3" />
                                  {MEDIA_TYPE_LABEL[post.mediaType]}
                                </span>
                              )}
                              {post.scheduledTime && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {post.scheduledTime}
                                </span>
                              )}
                              {post.assignee && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                  <User className="h-3 w-3" />
                                  {post.assignee}
                                </span>
                              )}
                            </div>

                            {/* 해시태그 */}
                            {post.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] text-purple-600 flex items-center gap-0.5"
                                  >
                                    <Hash className="h-2.5 w-2.5" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 상태 진행 버튼 */}
                            {nextStatus && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] w-full"
                                onClick={() => handleAdvanceStatus(post)}
                              >
                                {STATUS_LABEL[nextStatus]}(으)로 변경
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* 날짜 미선택 시 추가 안내 */}
            {!selectedDate && (
              <div className="text-center py-2">
                <p className="text-xs text-gray-400">
                  날짜를 선택하면 게시물을 확인하거나 추가할 수 있습니다.
                </p>
              </div>
            )}

            {/* 플랫폼별 통계 요약 */}
            {stats.totalPosts > 0 && (
              <div className="border-t pt-3 grid grid-cols-3 gap-2">
                {PLATFORMS.filter((pl) => stats.platformBreakdown[pl] > 0).map(
                  (pl) => (
                    <div
                      key={pl}
                      className="flex items-center gap-1.5 text-[10px] text-gray-600"
                    >
                      <span
                        className={cn(
                          "inline-block w-2 h-2 rounded-full shrink-0",
                          PLATFORM_COLOR[pl]
                        )}
                      />
                      <span className="truncate">{PLATFORM_LABEL[pl]}</span>
                      <span className="font-medium ml-auto">
                        {stats.platformBreakdown[pl]}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* 게시물 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "게시물 수정" : "게시물 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* 플랫폼 */}
            <div className="space-y-1">
              <Label className="text-xs">플랫폼</Label>
              <Select
                value={form.platform}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, platform: v as SocialPlatformType }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((pl) => (
                    <SelectItem key={pl} value={pl} className="text-xs">
                      {PLATFORM_LABEL[pl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 제목 */}
            <div className="space-y-1">
              <Label className="text-xs">제목 *</Label>
              <Input
                className="h-8 text-xs"
                placeholder="게시물 제목"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
            </div>

            {/* 내용 */}
            <div className="space-y-1">
              <Label className="text-xs">내용</Label>
              <Textarea
                className="text-xs resize-none"
                rows={3}
                placeholder="게시할 내용을 입력하세요."
                value={form.content}
                onChange={(e) =>
                  setForm((f) => ({ ...f, content: e.target.value }))
                }
              />
            </div>

            {/* 날짜 / 시간 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">날짜 *</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={form.scheduledDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scheduledDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">시간</Label>
                <Input
                  type="time"
                  className="h-8 text-xs"
                  value={form.scheduledTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scheduledTime: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* 미디어 유형 */}
            <div className="space-y-1">
              <Label className="text-xs">미디어 유형</Label>
              <Select
                value={form.mediaType}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    mediaType: v as PostForm["mediaType"],
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo" className="text-xs">
                    사진
                  </SelectItem>
                  <SelectItem value="video" className="text-xs">
                    영상
                  </SelectItem>
                  <SelectItem value="reel" className="text-xs">
                    릴스
                  </SelectItem>
                  <SelectItem value="story" className="text-xs">
                    스토리
                  </SelectItem>
                  <SelectItem value="text" className="text-xs">
                    텍스트
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 해시태그 */}
            <div className="space-y-1">
              <Label className="text-xs">해시태그 (쉼표로 구분)</Label>
              <Input
                className="h-8 text-xs"
                placeholder="댄스, 퍼포먼스, 연습"
                value={form.hashtagsRaw}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hashtagsRaw: e.target.value }))
                }
              />
            </div>

            {/* 담당자 */}
            <div className="space-y-1">
              <Label className="text-xs">담당자</Label>
              {memberNames.length > 0 ? (
                <Select
                  value={form.assignee}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, assignee: v }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberNames.map((name) => (
                      <SelectItem key={name} value={name} className="text-xs">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="담당자 이름"
                  value={form.assignee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignee: e.target.value }))
                  }
                />
              )}
            </div>

            {/* 상태 */}
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as SocialPostStatus }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" className="text-xs">
                    초안
                  </SelectItem>
                  <SelectItem value="scheduled" className="text-xs">
                    예정
                  </SelectItem>
                  <SelectItem value="published" className="text-xs">
                    게시완료
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-xs">
                    취소
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 메모 */}
            <div className="space-y-1">
              <Label className="text-xs">메모</Label>
              <Textarea
                className="text-xs resize-none"
                rows={2}
                placeholder="추가 메모 사항"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={closeDialog}
            >
              취소
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={handleSubmit}>
              {editTarget ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
