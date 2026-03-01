"use client";

import { useState } from "react";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import {
  PartyPopper,
  Plus,
  Trash2,
  Pencil,
  CalendarDays,
  Trophy,
  Star,
  Sparkles,
  Bell,
  BellOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useGroupAnniversary,
  calcYearsSince,
  calcAnniversaryDDay,
} from "@/hooks/use-group-anniversary";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import type { GroupAnniversaryItem, GroupAnniversaryType } from "@/types";

// ============================================================
// 상수
// ============================================================

const TYPE_CONFIG: Record<
  GroupAnniversaryType,
  { label: string; icon: React.ReactNode; color: string; badgeColor: string }
> = {
  founding: {
    label: "창립",
    icon: <PartyPopper className="h-3.5 w-3.5" />,
    color: "text-purple-600",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  performance: {
    label: "공연",
    icon: <Star className="h-3.5 w-3.5" />,
    color: "text-blue-600",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  achievement: {
    label: "성과",
    icon: <Trophy className="h-3.5 w-3.5" />,
    color: "text-yellow-600",
    badgeColor: "bg-yellow-100 text-yellow-700",
  },
  custom: {
    label: "기타",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    color: "text-gray-600",
    badgeColor: "bg-gray-100 text-gray-700",
  },
};

const REMINDER_OPTIONS = [
  { value: "none", label: "알림 없음" },
  { value: "1", label: "1일 전" },
  { value: "3", label: "3일 전" },
  { value: "7", label: "7일 전" },
  { value: "14", label: "14일 전" },
  { value: "30", label: "30일 전" },
];

// ============================================================
// 헬퍼 함수
// ============================================================

function formatDate(dateStr: string): string {
  const [yyyy, mm, dd] = dateStr.split("-");
  return `${yyyy}년 ${Number(mm)}월 ${Number(dd)}일`;
}

function getDDayLabel(dDay: number): { text: string; color: string } {
  if (dDay === 0) return { text: "D-Day", color: "bg-pink-500 text-white" };
  if (dDay <= 7) return { text: `D-${dDay}`, color: "bg-orange-400 text-white" };
  if (dDay <= 30) return { text: `D-${dDay}`, color: "bg-yellow-300 text-yellow-900" };
  return { text: `D-${dDay}`, color: "bg-gray-100 text-gray-500" };
}

function getYearsLabel(date: string, isRecurring: boolean): string | null {
  if (!isRecurring) return null;
  const years = calcYearsSince(date);
  if (years <= 0) return null;
  return `${years}주년`;
}

// ============================================================
// 다가오는 기념일 배너
// ============================================================

function UpcomingBanner({
  items,
}: {
  items: (GroupAnniversaryItem & { dDay: number })[];
}) {
  if (items.length === 0) return null;

  const todayItems = items.filter((i) => i.dDay === 0);
  const soonItems = items.filter((i) => i.dDay > 0 && i.dDay <= 7);

  if (todayItems.length === 0 && soonItems.length === 0) return null;

  return (
    <div className="mb-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2.5">
      {todayItems.length > 0 && (
        <div className="flex items-start gap-2 mb-1.5">
          <PartyPopper className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-700">오늘의 기념일</p>
            {todayItems.map((item) => {
              const yearsLabel = getYearsLabel(item.date, item.isRecurring);
              return (
                <p key={item.id} className="text-xs text-purple-600 mt-0.5">
                  {item.title}
                  {yearsLabel && (
                    <span className="ml-1 font-bold">{yearsLabel}</span>
                  )}
                </p>
              );
            })}
          </div>
        </div>
      )}
      {soonItems.length > 0 && (
        <div className="flex items-start gap-2">
          <Bell className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-600">다가오는 기념일</p>
            {soonItems.map((item) => (
              <p key={item.id} className="text-xs text-purple-500 mt-0.5">
                {item.title}
                <span className="ml-1 text-orange-500 font-medium">D-{item.dDay}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 기념일 항목 행
// ============================================================

function AnniversaryRow({
  item,
  onEdit,
  onDelete,
}: {
  item: GroupAnniversaryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[item.type];
  const dDay = calcAnniversaryDDay(item.date, item.isRecurring);
  const { text: dDayText, color: dDayColor } = getDDayLabel(dDay);
  const yearsLabel = getYearsLabel(item.date, item.isRecurring);
  const isToday = dDay === 0;
  const isPast = !item.isRecurring && dDay < 0;

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 transition-colors ${
        isToday
          ? "border-purple-300 bg-purple-50"
          : isPast
          ? "border-gray-200 bg-gray-50 opacity-60"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        {/* 타입 아이콘 */}
        <span className={`shrink-0 ${cfg.color}`}>{cfg.icon}</span>

        {/* 제목 및 날짜 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-800 truncate">
              {item.title}
            </span>
            {yearsLabel && (
              <Badge className={`text-[10px] px-1.5 py-0 ${cfg.badgeColor} border-0`}>
                {yearsLabel}
              </Badge>
            )}
            <Badge className={`text-[10px] px-1.5 py-0 ${cfg.badgeColor} border-0`}>
              {cfg.label}
            </Badge>
            {item.isRecurring && (
              <RefreshCw className="h-3 w-3 text-gray-400 shrink-0" aria-label="매년 반복" />
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(item.date)}</p>
        </div>

        {/* D-Day 뱃지 */}
        {!isPast && (
          <span
            className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${dDayColor}`}
          >
            {dDayText}
          </span>
        )}
        {isPast && (
          <span className="shrink-0 text-[10px] text-gray-400 px-1.5 py-0.5">
            종료
          </span>
        )}

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {item.description && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600"
              title="설명 보기"
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-0.5 rounded text-gray-400 hover:text-blue-500"
            title="수정"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-0.5 rounded text-gray-400 hover:text-red-500"
            title="삭제"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 확장 설명 */}
      {expanded && item.description && (
        <p className="mt-2 text-xs text-gray-500 pl-5 leading-relaxed border-t border-gray-100 pt-2">
          {item.description}
        </p>
      )}

      {/* 알림 설정 표시 */}
      {item.reminderDays !== null && (
        <div className="flex items-center gap-1 mt-1.5 pl-5">
          <Bell className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">{item.reminderDays}일 전 알림</span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 기념일 추가/수정 다이얼로그
// ============================================================

interface FormState {
  title: string;
  date: string;
  type: GroupAnniversaryType;
  description: string;
  isRecurring: boolean;
  reminderDays: string; // "none" | "1" | "3" | "7" | "14" | "30"
}

const INITIAL_FORM: FormState = {
  title: "",
  date: "",
  type: "founding",
  description: "",
  isRecurring: true,
  reminderDays: "none",
};

function AnniversaryDialog({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormState) => void;
  initial?: FormState;
  mode: "add" | "edit";
}) {
  const [form, setForm] = useState<FormState>(initial ?? INITIAL_FORM);

  // initial이 바뀌면 폼 초기화
  useState(() => {
    if (initial) setForm(initial);
  });

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("기념일 제목을 입력해주세요.");
      return;
    }
    if (!form.date) {
      toast.error("기념일 날짜를 선택해주세요.");
      return;
    }
    onSubmit(form);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "기념일 추가" : "기념일 수정"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 제목 */}
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">
              기념일 제목 <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-8 text-sm"
              placeholder="예: 창단 기념일, 첫 공연"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 날짜 */}
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">
              날짜 <span className="text-red-500">*</span>
            </label>
            <Input
              className="h-8 text-sm"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>

          {/* 유형 */}
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">유형</label>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as GroupAnniversaryType)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_CONFIG) as GroupAnniversaryType[]).map((k) => (
                  <SelectItem key={k} value={k} className="text-sm">
                    {TYPE_CONFIG[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 설명 */}
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">설명 (선택)</label>
            <Textarea
              className="text-sm resize-none"
              rows={2}
              placeholder="기념일에 대한 간단한 설명"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={200}
            />
          </div>

          {/* 매년 반복 */}
          <div className="flex items-center gap-2">
            <input
              id="recurring"
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => set("isRecurring", e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 accent-purple-600"
            />
            <label htmlFor="recurring" className="text-xs text-gray-600 cursor-pointer select-none">
              매년 반복 (주년 자동 계산)
            </label>
          </div>

          {/* 사전 알림 */}
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">
              <Bell className="h-3 w-3 inline mr-1" />
              사전 알림
            </label>
            <Select
              value={form.reminderDays}
              onValueChange={(v) => set("reminderDays", v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "추가" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function GroupAnniversaryCard({ groupId }: { groupId: string }) {
  const {
    sortedAnniversaries,
    loading,
    totalAnniversaries,
    upcomingCount,
    getUpcoming,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    TYPE_LABELS,
  } = useGroupAnniversary(groupId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupAnniversaryItem | null>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [formInitial, setFormInitial] = useState<FormState | undefined>(undefined);
  const deleteConfirm = useDeleteConfirm<{ id: string; title: string }>();

  const upcoming = getUpcoming(30);

  function openAdd() {
    setEditTarget(null);
    setFormInitial(INITIAL_FORM);
    setDialogMode("add");
    setDialogOpen(true);
  }

  function openEdit(item: GroupAnniversaryItem) {
    setEditTarget(item);
    setFormInitial({
      title: item.title,
      date: item.date,
      type: item.type,
      description: item.description ?? "",
      isRecurring: item.isRecurring,
      reminderDays:
        item.reminderDays !== null ? String(item.reminderDays) : "none",
    });
    setDialogMode("edit");
    setDialogOpen(true);
  }

  function handleSubmit(form: FormState) {
    const payload = {
      title: form.title.trim(),
      date: form.date,
      type: form.type,
      description: form.description.trim() || null,
      isRecurring: form.isRecurring,
      reminderDays: form.reminderDays !== "none" ? Number(form.reminderDays) : null,
    };

    if (dialogMode === "add") {
      addAnniversary(payload);
      toast.success("기념일이 추가되었습니다.");
    } else if (editTarget) {
      updateAnniversary(editTarget.id, payload);
      toast.success("기념일이 수정되었습니다.");
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    const target = deleteConfirm.confirm();
    if (!target) return;
    deleteAnniversary(target.id);
    toast.success("기념일이 삭제되었습니다.");
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-12 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-800">그룹 기념일</h3>
          {totalAnniversaries > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-0">
              {totalAnniversaries}개
            </Badge>
          )}
          {upcomingCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-0">
              D-30 이내 {upcomingCount}개
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openAdd}>
          <Plus className="h-3 w-3 mr-1" />
          추가
        </Button>
      </div>

      {/* 다가오는 기념일 배너 */}
      <UpcomingBanner items={upcoming} />

      {/* 기념일 목록 */}
      {sortedAnniversaries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="등록된 기념일이 없습니다"
          description="창립일, 공연, 수상 기록을 기념일로 등록해보세요."
          action={{ label: "기념일 추가", onClick: openAdd }}
        />
      ) : (
        <div className="space-y-2">
          {sortedAnniversaries.map((item) => (
            <AnniversaryRow
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteConfirm.request({ id: item.id, title: item.title })}
            />
          ))}
        </div>
      )}

      {/* 추가/수정 다이얼로그 */}
      <AnniversaryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        initial={formInitial}
        mode={dialogMode}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="기념일 삭제"
        description={deleteConfirm.target ? `"${deleteConfirm.target.title}" 기념일을 삭제하시겠습니까?` : ""}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
