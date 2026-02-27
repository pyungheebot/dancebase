"use client";

import { useState } from "react";
import {
  CalendarDays,
  MapPin,
  Plus,
  Trash2,
  Users,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useEventGallery,
  type GroupEventInput,
} from "@/hooks/use-event-gallery";
import type { EventTag } from "@/types";

// ============================================
// 태그 메타데이터
// ============================================

const TAG_LABELS: Record<EventTag, string> = {
  performance: "공연",
  competition: "대회",
  workshop: "워크숍",
  other: "기타",
};

const TAG_COLORS: Record<EventTag, string> = {
  performance:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  competition:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  workshop:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  other:
    "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
};

// ============================================
// 날짜 포맷 (YYYY-MM-DD -> 한국어)
// ============================================

function formatEventDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================
// 이벤트 추가 다이얼로그
// ============================================

const DEFAULT_FORM: GroupEventInput = {
  title: "",
  date: "",
  location: "",
  description: "",
  tag: "performance",
  participantCount: 0,
};

interface AddEventDialogProps {
  onAdd: (input: GroupEventInput) => boolean;
  disabled: boolean;
}

function AddEventDialog({ onAdd, disabled }: AddEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GroupEventInput>(DEFAULT_FORM);

  const isValid = form.title.trim().length > 0 && form.date.length > 0;

  const handleSubmit = () => {
    const success = onAdd(form);
    if (success) {
      setForm(DEFAULT_FORM);
      setOpen(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) setForm(DEFAULT_FORM);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={disabled}
        >
          <Plus className="h-3 w-3" />
          이벤트 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">이벤트 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="이벤트 제목을 입력하세요"
              className="h-7 text-xs"
              maxLength={100}
            />
          </div>

          {/* 날짜 + 태그 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                날짜 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                태그
              </Label>
              <Select
                value={form.tag}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, tag: v as EventTag }))
                }
              >
                <SelectTrigger size="sm" className="h-7 text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TAG_LABELS) as EventTag[]).map((tag) => (
                    <SelectItem key={tag} value={tag} className="text-xs">
                      {TAG_LABELS[tag]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 장소 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              장소
            </Label>
            <Input
              value={form.location}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="공연장, 체육관 등"
              className="h-7 text-xs"
              maxLength={100}
            />
          </div>

          {/* 참여 인원 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              참여 인원
            </Label>
            <Input
              type="number"
              min={0}
              value={form.participantCount === 0 ? "" : form.participantCount}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  participantCount: Math.max(0, parseInt(e.target.value) || 0),
                }))
              }
              placeholder="0"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              설명
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="이벤트에 대한 간단한 설명을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>

          {/* 버튼 */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              등록
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleOpenChange(false)}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 이벤트 카드
// ============================================

interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    description: string;
    tag: EventTag;
    participantCount: number;
  };
  onDelete: (id: string) => void;
}

function EventCard({ event, onDelete }: EventCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(event.id);
  };

  return (
    <div
      className="group rounded-lg border bg-card hover:bg-muted/30 transition-colors p-3 space-y-2"
      onMouseLeave={() => setConfirmDelete(false)}
    >
      {/* 헤더 행: 날짜 배지 + 태그 + 삭제 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {/* 날짜 배지 */}
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded px-1.5 py-0 shrink-0">
            <CalendarDays className="h-2.5 w-2.5" />
            {formatEventDate(event.date)}
          </span>
          {/* 태그 배지 */}
          <span
            className={`inline-flex items-center rounded px-1.5 py-0 text-[10px] font-medium ${TAG_COLORS[event.tag]}`}
          >
            {TAG_LABELS[event.tag]}
          </span>
        </div>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 px-1.5 text-[10px] gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${
            confirmDelete
              ? "text-destructive hover:text-destructive"
              : "text-muted-foreground hover:text-destructive"
          }`}
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-3 w-3" />
          {confirmDelete ? "확인" : "삭제"}
        </Button>
      </div>

      {/* 제목 */}
      <p className="text-xs font-semibold leading-snug line-clamp-1">
        {event.title}
      </p>

      {/* 장소 */}
      {event.location && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
      )}

      {/* 설명 미리보기 */}
      {event.description && (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {event.description}
        </p>
      )}

      {/* 참여 인원 */}
      {event.participantCount > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Users className="h-2.5 w-2.5 shrink-0" />
          <span>{event.participantCount}명 참여</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// 태그 필터 토글 버튼
// ============================================

const TAG_FILTER_OPTIONS: Array<{ value: EventTag | "all"; label: string }> = [
  { value: "all", label: "전체" },
  { value: "performance", label: "공연" },
  { value: "competition", label: "대회" },
  { value: "workshop", label: "워크숍" },
  { value: "other", label: "기타" },
];

// ============================================
// EventGalleryPanel (메인 컴포넌트)
// ============================================

interface EventGalleryPanelProps {
  groupId: string;
}

export function EventGalleryPanel({ groupId }: EventGalleryPanelProps) {
  const {
    filteredEvents,
    loading,
    tagFilter,
    setTagFilter,
    addEvent,
    deleteEvent,
    totalCount,
    maxReached,
  } = useEventGallery(groupId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Image className="h-3 w-3" />
          이벤트 갤러리
          {totalCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium min-w-[16px] h-4 px-1">
              {totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        {/* 헤더 */}
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-sm flex items-center gap-1.5">
              <Image className="h-4 w-4 text-muted-foreground" />
              이벤트 갤러리
              {totalCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 ml-0.5"
                >
                  {totalCount}
                </Badge>
              )}
            </SheetTitle>
            <AddEventDialog onAdd={addEvent} disabled={maxReached} />
          </div>

          {/* 태그 필터 토글 */}
          <div className="flex items-center gap-1 flex-wrap pt-1">
            {TAG_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTagFilter(opt.value as EventTag | "all")}
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer border ${
                  tagFilter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* 이벤트 목록 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
              불러오는 중...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <Image className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs font-medium text-muted-foreground">
                {tagFilter !== "all"
                  ? `${TAG_LABELS[tagFilter as EventTag]} 이벤트가 없습니다`
                  : "첫 이벤트를 기록해보세요"}
              </p>
              {tagFilter === "all" && (
                <p className="text-[11px] text-muted-foreground/70">
                  공연, 대회, 워크숍 등 그룹의 특별한 순간을 기록하세요
                </p>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onDelete={deleteEvent}
              />
            ))
          )}

          {/* 최대 개수 안내 */}
          {maxReached && (
            <p className="text-center text-[11px] text-muted-foreground py-1">
              최대 100개 이벤트를 등록했습니다.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
