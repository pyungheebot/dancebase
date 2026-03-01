"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Heart,
  Trash2,
  Pencil,
  Music2,
  Wrench,
  Shirt,
  MapPin,
  CalendarDays,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupWishlistV2 } from "@/hooks/use-group-wishlist-v2";
import type {
  GroupWishCategory,
  GroupWishPriority,
  GroupWishStatus,
  GroupWishItem,
} from "@/types";
import { formatMonthDay } from "@/lib/date-utils";

// ─── 카테고리 메타 ────────────────────────────────────────────

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  bg: string;
  border: string;
  text: string;
  badge: string;
  barColor: string;
};

const CATEGORY_META: Record<GroupWishCategory, CategoryMeta> = {
  practice_song: {
    label: "연습곡",
    icon: <Music2 className="h-3 w-3" />,
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    barColor: "bg-purple-400",
  },
  equipment: {
    label: "장비",
    icon: <Wrench className="h-3 w-3" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    barColor: "bg-blue-400",
  },
  costume: {
    label: "의상",
    icon: <Shirt className="h-3 w-3" />,
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    badge: "bg-pink-100 text-pink-700 hover:bg-pink-100",
    barColor: "bg-pink-400",
  },
  venue: {
    label: "장소",
    icon: <MapPin className="h-3 w-3" />,
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    barColor: "bg-green-400",
  },
  event: {
    label: "이벤트",
    icon: <CalendarDays className="h-3 w-3" />,
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100",
    barColor: "bg-orange-400",
  },
  other: {
    label: "기타",
    icon: <MoreHorizontal className="h-3 w-3" />,
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100",
    barColor: "bg-gray-400",
  },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as GroupWishCategory[];

// ─── 우선순위 메타 ────────────────────────────────────────────

type PriorityMeta = { label: string; badge: string };

const PRIORITY_META: Record<GroupWishPriority, PriorityMeta> = {
  high: { label: "높음", badge: "bg-red-100 text-red-600 hover:bg-red-100" },
  medium: { label: "중간", badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  low: { label: "낮음", badge: "bg-gray-100 text-gray-500 hover:bg-gray-100" },
};

const ALL_PRIORITIES = Object.keys(PRIORITY_META) as GroupWishPriority[];

// ─── 상태 메타 ────────────────────────────────────────────────

type StatusMeta = {
  label: string;
  badge: string;
  icon: React.ReactNode;
};

const STATUS_META: Record<GroupWishStatus, StatusMeta> = {
  proposed: {
    label: "제안",
    badge: "bg-blue-100 text-blue-600 hover:bg-blue-100",
    icon: <ClipboardList className="h-3 w-3" />,
  },
  reviewing: {
    label: "검토중",
    badge: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "승인",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "완료",
    badge: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "반려",
    badge: "bg-red-100 text-red-500 hover:bg-red-100",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const ALL_STATUSES = Object.keys(STATUS_META) as GroupWishStatus[];

// ─── 유틸 ─────────────────────────────────────────────────────

function formatCost(cost: number): string {
  if (cost === 0) return "";
  if (cost >= 10000) return `${(cost / 10000).toFixed(cost % 10000 === 0 ? 0 : 1)}만원`;
  return `${cost.toLocaleString()}원`;
}

// ─── 항목 추가 다이얼로그 ─────────────────────────────────────

interface AddItemDialogProps {
  hook: ReturnType<typeof useGroupWishlistV2>;
}

function AddItemDialog({ hook }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupWishCategory>("practice_song");
  const [priority, setPriority] = useState<GroupWishPriority>("medium");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [proposedBy, setProposedBy] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!proposedBy.trim()) {
      toast.error("제안자 이름을 입력해주세요.");
      return;
    }
    const cost = estimatedCost ? parseInt(estimatedCost.replace(/,/g, ""), 10) : 0;
    const ok = hook.addItem(title, description, category, priority, isNaN(cost) ? 0 : cost, proposedBy);
    if (ok) {
      toast.success("위시가 추가되었습니다.");
      setTitle("");
      setDescription("");
      setCategory("practice_song");
      setPriority("medium");
      setEstimatedCost("");
      setProposedBy("");
      setOpen(false);
    } else {
      toast.error("위시 추가에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 bg-violet-500 text-xs hover:bg-violet-600">
          <Plus className="mr-1 h-3 w-3" />
          추가
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-violet-500" />
            새 위시 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 제목 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              placeholder="예: BTS 작은 것들을 위한 시"
              className="h-7 text-xs"
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">설명 (선택)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              placeholder="추가 설명을 입력하세요"
              className="min-h-[56px] resize-none text-xs"
            />
            <p className="text-right text-[10px] text-gray-400">{description.length}/200</p>
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">카테고리</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">우선순위</label>
            <div className="flex gap-1.5">
              {ALL_PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p];
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.badge} border-transparent font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 예상 비용 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">예상 비용 (선택)</label>
            <div className="relative">
              <Input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                min={0}
                className="h-7 pr-6 text-xs"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">원</span>
            </div>
          </div>

          {/* 제안자 */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              제안자 <span className="text-red-400">*</span>
            </label>
            <Input
              value={proposedBy}
              onChange={(e) => setProposedBy(e.target.value.slice(0, 20))}
              placeholder="본인 이름을 입력하세요"
              className="h-7 text-xs"
            />
          </div>

          <Button
            className="h-8 w-full bg-violet-500 text-xs hover:bg-violet-600"
            onClick={handleSubmit}
            disabled={!title.trim() || !proposedBy.trim()}
          >
            추가하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 항목 수정 다이얼로그 ─────────────────────────────────────

interface EditItemDialogProps {
  item: GroupWishItem;
  hook: ReturnType<typeof useGroupWishlistV2>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditItemDialog({ item, hook, open, onOpenChange }: EditItemDialogProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState<GroupWishCategory>(item.category);
  const [priority, setPriority] = useState<GroupWishPriority>(item.priority);
  const [estimatedCost, setEstimatedCost] = useState(
    item.estimatedCost > 0 ? String(item.estimatedCost) : ""
  );

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    const cost = estimatedCost ? parseInt(estimatedCost.replace(/,/g, ""), 10) : 0;
    const ok = hook.updateItem(item.id, {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      estimatedCost: isNaN(cost) ? 0 : cost,
    });
    if (ok) {
      toast.success("위시가 수정되었습니다.");
      onOpenChange(false);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4 text-violet-500" />
            위시 수정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">
              제목 <span className="text-red-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 60))}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              className="min-h-[56px] resize-none text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">카테고리</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat];
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.icon}
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">우선순위</label>
            <div className="flex gap-1.5">
              {ALL_PRIORITIES.map((p) => {
                const meta = PRIORITY_META[p];
                const selected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      selected
                        ? `${meta.badge} border-transparent font-semibold`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">예상 비용</label>
            <div className="relative">
              <Input
                type="number"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                min={0}
                className="h-7 pr-6 text-xs"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">원</span>
            </div>
          </div>

          <Button
            className="h-8 w-full bg-violet-500 text-xs hover:bg-violet-600"
            onClick={handleSubmit}
            disabled={!title.trim()}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 카테고리 바 차트 ─────────────────────────────────────────

interface CategoryBarChartProps {
  categoryCount: Record<GroupWishCategory, number>;
  total: number;
}

function CategoryBarChart({ categoryCount, total }: CategoryBarChartProps) {
  if (total === 0) return null;

  const entries = ALL_CATEGORIES.filter((cat) => categoryCount[cat] > 0).map((cat) => ({
    cat,
    count: categoryCount[cat],
    pct: Math.round((categoryCount[cat] / total) * 100),
    meta: CATEGORY_META[cat],
  }));

  if (entries.length === 0) return null;

  return (
    <div className="space-y-1.5 rounded-md bg-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-1 mb-1">
        <BarChart3 className="h-3 w-3 text-gray-400" />
        <span className="text-[11px] font-medium text-gray-500">카테고리별 현황</span>
      </div>
      {entries.map(({ cat, count, pct, meta }) => (
        <div key={cat} className="flex items-center gap-2">
          <div className={`flex w-14 shrink-0 items-center gap-1 ${meta.text}`}>
            {meta.icon}
            <span className="text-[10px] font-medium">{meta.label}</span>
          </div>
          <div className="flex flex-1 items-center gap-1.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full ${meta.barColor} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-[10px] text-gray-400">
              {count}개 ({pct}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 위시 항목 카드 ───────────────────────────────────────────

interface WishItemCardProps {
  item: GroupWishItem;
  hook: ReturnType<typeof useGroupWishlistV2>;
}

function WishItemCard({ item, hook }: WishItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const catMeta = CATEGORY_META[item.category];
  const priMeta = PRIORITY_META[item.priority];
  const statusMeta = STATUS_META[item.status];

  const isInactive = item.status === "completed" || item.status === "rejected";

  const handleLike = () => {
    const ok = hook.likeItem(item.id);
    if (!ok) toast.error("좋아요 처리에 실패했습니다.");
    else toast.success("좋아요를 눌렀습니다.");
  };

  const handleDelete = () => {
    const ok = hook.deleteItem(item.id);
    if (ok) toast.success("위시가 삭제되었습니다.");
    else toast.error(TOAST.DELETE_ERROR);
  };

  const handleStatusChange = (value: string) => {
    const ok = hook.changeStatus(item.id, value as GroupWishStatus);
    if (ok) toast.success("상태가 변경되었습니다.");
    else toast.error("상태 변경에 실패했습니다.");
  };

  return (
    <>
      <div
        className={`rounded-lg border p-3 transition-opacity ${
          isInactive
            ? "border-gray-100 bg-gray-50 opacity-60"
            : `${catMeta.bg} ${catMeta.border}`
        }`}
      >
        <div className="flex gap-2.5">
          {/* 콘텐츠 */}
          <div className="min-w-0 flex-1 space-y-1.5">
            {/* 제목 + 배지 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-xs font-semibold ${
                  isInactive ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.title}
              </span>
              <Badge className={`text-[10px] px-1.5 py-0 ${catMeta.badge}`}>
                <span className="mr-0.5 inline-flex">{catMeta.icon}</span>
                {catMeta.label}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 ${priMeta.badge}`}>
                {priMeta.label}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 ${statusMeta.badge}`}>
                <span className="mr-0.5 inline-flex">{statusMeta.icon}</span>
                {statusMeta.label}
              </Badge>
              {item.estimatedCost > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-600 hover:bg-indigo-100">
                  {formatCost(item.estimatedCost)}
                </Badge>
              )}
            </div>

            {/* 설명 */}
            {item.description && (
              <p className="text-[11px] leading-relaxed text-gray-500">{item.description}</p>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span>제안: {item.proposedBy}</span>
              <span>·</span>
              <span>{formatMonthDay(item.createdAt)}</span>
            </div>

            {/* 상태 변경 셀렉트 */}
            {!isInactive && (
              <Select value={item.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-5 w-24 border-0 bg-transparent p-0 text-[10px] text-gray-400 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 오른쪽: 좋아요 + 수정 + 삭제 */}
          <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* 좋아요 */}
            <button
              type="button"
              onClick={handleLike}
              disabled={isInactive}
              className="flex flex-col items-center gap-0.5 rounded-md px-1.5 py-1 text-gray-400 transition-colors hover:bg-white/60 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
              title="좋아요"
            >
              <Heart className="h-3 w-3" />
              <span className="text-[10px] font-semibold">{item.likes}</span>
            </button>

            {/* 수정 버튼 */}
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-gray-300 transition-colors hover:text-violet-500"
              title="수정"
            >
              <Pencil className="h-3 w-3" />
            </button>

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={handleDelete}
              className="text-gray-200 transition-colors hover:text-red-400"
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <EditItemDialog
        item={item}
        hook={hook}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

// ─── 통계 요약 ────────────────────────────────────────────────

interface StatsRowProps {
  stats: ReturnType<typeof useGroupWishlistV2>["stats"];
}

function StatsRow({ stats }: StatsRowProps) {
  if (stats.total === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 rounded-md bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-violet-400" />
        <span className="text-[11px] text-gray-500">
          총 <span className="font-semibold text-gray-700">{stats.total}</span>개
        </span>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-green-500" />
        <span className="text-[11px] text-gray-500">
          승인율 <span className="font-semibold text-gray-700">{stats.approvalRate}%</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        <span className="text-[11px] text-gray-500">
          완료율 <span className="font-semibold text-gray-700">{stats.completionRate}%</span>
        </span>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

export function GroupWishlistCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [activeCat, setActiveCat] = useState<GroupWishCategory | "all">("all");
  const [activeStatus, setActiveStatus] = useState<GroupWishStatus | "all">("all");

  const hook = useGroupWishlistV2(groupId);

  // 필터 + 좋아요 정렬
  const filteredItems = useMemo(() => {
    let list = hook.filterByCategory(activeCat);
    list = hook.filterByStatus(activeStatus).filter((i) =>
      list.some((l) => l.id === i.id)
    );
    return hook.sortByLikes(list);
  }, [hook, activeCat, activeStatus]);

  const activeItems = hook.items.filter(
    (i) => i.status !== "completed" && i.status !== "rejected"
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-800">그룹 위시리스트</span>
          {hook.items.length > 0 && (
            <Badge className="bg-violet-100 text-[10px] px-1.5 py-0 text-violet-600 hover:bg-violet-100">
              {hook.items.length}개
            </Badge>
          )}
          {activeItems.length > 0 && (
            <Badge className="bg-blue-100 text-[10px] px-1.5 py-0 text-blue-600 hover:bg-blue-100">
              진행 {activeItems.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <AddItemDialog hook={hook} />
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* ── 본문 ── */}
      <CollapsibleContent>
        <div className="space-y-4 rounded-b-lg border border-gray-200 bg-white p-4">

          {/* 통계 요약 */}
          <StatsRow stats={hook.stats} />

          {/* 카테고리 바 차트 */}
          <CategoryBarChart categoryCount={hook.categoryCount} total={hook.items.length} />

          {/* 빈 상태 */}
          {hook.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
              <Sparkles className="h-10 w-10 opacity-20" />
              <p className="text-xs">아직 위시가 없습니다.</p>
              <p className="text-[10px]">
                연습곡, 장비, 의상 등 그룹의 위시를 추가해보세요!
              </p>
            </div>
          ) : (
            <>
              <Separator />

              {/* 카테고리 필터 */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-400">카테고리</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveCat("all")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeCat === "all"
                        ? "border-gray-400 bg-gray-800 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const count = hook.items.filter((i) => i.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCat(cat)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activeCat === cat
                            ? `${meta.bg} ${meta.border} ${meta.text} font-semibold`
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-400">상태</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveStatus("all")}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                      activeStatus === "all"
                        ? "border-gray-400 bg-gray-800 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    전체
                  </button>
                  {ALL_STATUSES.map((s) => {
                    const meta = STATUS_META[s];
                    const count = hook.items.filter((i) => i.status === s).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActiveStatus(s)}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                          activeStatus === s
                            ? `${meta.badge} border-transparent font-semibold`
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <span className="inline-flex">{meta.icon}</span>
                        <span>{meta.label}</span>
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 위시 목록 */}
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-400">
                  <p className="text-xs">해당 조건의 위시가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <WishItemCard key={item.id} item={item} hook={hook} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
