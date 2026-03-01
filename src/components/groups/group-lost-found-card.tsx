"use client";

import { useState, useId } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  PackageSearch,
  BarChart2,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupLostFound } from "@/hooks/use-group-lost-found";
import type { LostFoundItem, LostFoundStatus } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ── 상수 ──────────────────────────────────────────────────────────

const STATUS_LIST: LostFoundStatus[] = ["분실", "발견", "반환완료"];

const STATUS_META: Record<
  LostFoundStatus,
  { label: string; badgeCls: string; barColor: string }
> = {
  분실: {
    label: "분실",
    badgeCls: "bg-red-100 text-red-700 border-red-200",
    barColor: "bg-red-400",
  },
  발견: {
    label: "발견",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
    barColor: "bg-blue-400",
  },
  반환완료: {
    label: "반환완료",
    badgeCls: "bg-green-100 text-green-700 border-green-200",
    barColor: "bg-green-500",
  },
};

type FilterType = "전체" | LostFoundStatus;
const FILTERS: FilterType[] = ["전체", "분실", "발견", "반환완료"];

// ── 날짜 포매터 ────────────────────────────────────────────────────

// ── 분실물 추가/수정 다이얼로그 ────────────────────────────────────

function ItemFormDialog({
  mode,
  initial,
  trigger,
  onSave,
}: {
  mode: "add" | "edit";
  initial?: LostFoundItem;
  trigger: React.ReactNode;
  onSave: (payload: {
    itemName: string;
    description: string;
    lostPlace: string;
    lostDate: string;
    reporterName: string;
    finderName: string;
    status?: LostFoundStatus;
  }) => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const [itemName, setItemName] = useState(initial?.itemName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [lostPlace, setLostPlace] = useState(initial?.lostPlace ?? "");
  const [lostDate, setLostDate] = useState(initial?.lostDate ?? today);
  const [reporterName, setReporterName] = useState(
    initial?.reporterName ?? ""
  );
  const [finderName, setFinderName] = useState(initial?.finderName ?? "");
  const [status, setStatus] = useState<LostFoundStatus>(
    initial?.status ?? "분실"
  );

  const reset = () => {
    setItemName(initial?.itemName ?? "");
    setDescription(initial?.description ?? "");
    setLostPlace(initial?.lostPlace ?? "");
    setLostDate(initial?.lostDate ?? today);
    setReporterName(initial?.reporterName ?? "");
    setFinderName(initial?.finderName ?? "");
    setStatus(initial?.status ?? "분실");
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  const handleSubmit = () => {
    if (!itemName.trim()) {
      toast.error("물품명을 입력하세요.");
      return;
    }
    if (!reporterName.trim()) {
      toast.error("신고자명을 입력하세요.");
      return;
    }
    if (!lostDate) {
      toast.error("분실 날짜를 선택하세요.");
      return;
    }
    onSave({
      itemName,
      description,
      lostPlace,
      lostDate,
      reporterName,
      finderName,
      ...(mode === "edit" ? { status } : {}),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {mode === "add" ? "분실물 등록" : "분실물 수정"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 물품명 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-name`} className="text-xs">
              물품명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-name`}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="예: 검정 후드집업"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          {/* 설명 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-desc`} className="text-xs">
              설명
            </Label>
            <Textarea
              id={`${uid}-desc`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="특징, 색상, 브랜드 등 추가 설명"
              className="text-xs resize-none h-16"
              maxLength={300}
            />
          </div>
          {/* 분실 장소 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-place`} className="text-xs">
              분실 장소
            </Label>
            <Input
              id={`${uid}-place`}
              value={lostPlace}
              onChange={(e) => setLostPlace(e.target.value)}
              placeholder="예: 연습실 2층 탈의실"
              className="h-8 text-xs"
              maxLength={100}
            />
          </div>
          {/* 분실 날짜 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-date`} className="text-xs">
              분실 날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-date`}
              type="date"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          {/* 신고자명 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-reporter`} className="text-xs">
              신고자명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${uid}-reporter`}
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="신고자 이름 입력"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>
          {/* 발견자명 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-finder`} className="text-xs">
              발견자명 <span className="text-gray-400">(선택)</span>
            </Label>
            <Input
              id={`${uid}-finder`}
              value={finderName}
              onChange={(e) => setFinderName(e.target.value)}
              placeholder="발견자 이름 (발견 시 입력)"
              className="h-8 text-xs"
              maxLength={50}
            />
          </div>
          {/* 상태 (수정 모드에서만) */}
          {mode === "edit" && (
            <div className="space-y-1">
              <Label htmlFor={`${uid}-status`} className="text-xs">
                상태
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as LostFoundStatus)}
              >
                <SelectTrigger id={`${uid}-status`} className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_LIST.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {mode === "add" ? "등록" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 분실물 항목 카드 ────────────────────────────────────────────────

function LostFoundItemCard({
  item,
  onChangeStatus,
  onUpdate,
  onDelete,
}: {
  item: LostFoundItem;
  onChangeStatus: (id: string, status: LostFoundStatus) => boolean;
  onUpdate: (
    id: string,
    patch: Partial<
      Pick<
        LostFoundItem,
        | "itemName"
        | "description"
        | "lostPlace"
        | "lostDate"
        | "reporterName"
        | "finderName"
        | "status"
      >
    >
  ) => boolean;
  onDelete: (id: string) => boolean;
}) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const meta = STATUS_META[item.status];

  const handleStatusChange = (s: string) => {
    const ok = onChangeStatus(item.id, s as LostFoundStatus);
    if (ok) {
      toast.success(`상태가 "${s}"(으)로 변경되었습니다.`);
    } else {
      toast.error("상태 변경에 실패했습니다.");
    }
  };

  const handleDelete = () => {
    const ok = onDelete(item.id);
    if (ok) {
      toast.success("분실물이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-800 truncate">
            {item.itemName}
          </span>
          <Badge className={`text-[10px] px-1.5 py-0 border ${meta.badgeCls} shrink-0`}>
            {meta.label}
          </Badge>
        </div>
        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 shrink-0">
          <ItemFormDialog
            mode="edit"
            initial={item}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-300 hover:text-blue-500"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            }
            onSave={(payload) => {
              const ok = onUpdate(item.id, payload);
              if (ok) {
                toast.success("분실물 정보가 수정되었습니다.");
              } else {
                toast.error(TOAST.UPDATE_ERROR);
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="분실물 삭제"
            description={`"${item.itemName}" 분실물 항목을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
            onConfirm={handleDelete}
            destructive
          />
        </div>
      </div>

      {/* 설명 */}
      {item.description && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* 세부 정보 */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-gray-400">
        {item.lostPlace && <span>장소: {item.lostPlace}</span>}
        {item.lostDate && <span>날짜: {formatYearMonthDay(item.lostDate)}</span>}
        <span>신고: {item.reporterName}</span>
        {item.finderName && <span>발견: {item.finderName}</span>}
      </div>

      {/* 상태 인라인 변경 */}
      <div className="flex items-center gap-2 pt-0.5">
        <span className="text-[10px] text-gray-400">상태 변경:</span>
        <div className="flex gap-1">
          {STATUS_LIST.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                item.status === s
                  ? STATUS_META[s].badgeCls + " font-semibold"
                  : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 상태별 바 차트 ─────────────────────────────────────────────────

function StatusBarChart({
  stats,
}: {
  stats: {
    lostCount: number;
    foundCount: number;
    returnedCount: number;
    maxCount: number;
  };
}) {
  const bars: Array<{
    label: string;
    count: number;
    colorCls: string;
  }> = [
    { label: "분실", count: stats.lostCount, colorCls: "bg-red-400" },
    { label: "발견", count: stats.foundCount, colorCls: "bg-blue-400" },
    {
      label: "반환완료",
      count: stats.returnedCount,
      colorCls: "bg-green-500",
    },
  ];

  const allZero = bars.every((b) => b.count === 0);
  if (allZero) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        등록된 분실물이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {bars.map(({ label, count, colorCls }) => {
        const percent = Math.round((count / stats.maxCount) * 100);
        return (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600 w-14 shrink-0">
              {label}
            </span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorCls}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-8 shrink-0 text-right">
              {count}건
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────

export function GroupLostFoundCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [filter, setFilter] = useState<FilterType>("전체");

  const { data, loading, addItem, updateItem, changeStatus, deleteItem, stats } =
    useGroupLostFound(groupId);

  // 필터 + 최근 분실물 우선 (createdAt 내림차순)
  const filteredItems = data.items
    .filter((i) => filter === "전체" || i.status === filter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-white shadow-sm">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-800">
                분실물 관리
              </span>
              <div className="flex items-center gap-1">
                <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200">
                  총 {stats.total}건
                </Badge>
                {stats.unresolvedCount > 0 && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200">
                    미해결 {stats.unresolvedCount}건
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <Separator />

            {/* 요약 통계 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
                <p className="text-lg font-bold text-red-600">
                  {stats.lostCount}
                </p>
                <p className="text-[10px] text-red-400">분실</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-100">
                <p className="text-lg font-bold text-blue-600">
                  {stats.foundCount}
                </p>
                <p className="text-[10px] text-blue-400">발견</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-100">
                <p className="text-lg font-bold text-green-600">
                  {stats.returnedCount}
                </p>
                <p className="text-[10px] text-green-400">반환완료</p>
              </div>
            </div>

            {/* 반환율 + 상태 바 차트 */}
            <div className="bg-gray-50 rounded-lg p-3 border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-gray-500" />
                  <p className="text-xs font-medium text-gray-700">
                    상태별 현황
                  </p>
                </div>
                <span className="text-xs font-semibold text-green-600">
                  반환율 {stats.returnRate}%
                </span>
              </div>
              <StatusBarChart stats={stats} />
            </div>

            <Separator />

            {/* 필터 + 추가 버튼 */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filter === f
                        ? "bg-orange-500 text-white border-orange-500 font-semibold"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {f}
                    {f !== "전체" && (
                      <span className="ml-1 opacity-70">
                        (
                        {f === "분실"
                          ? stats.lostCount
                          : f === "발견"
                          ? stats.foundCount
                          : stats.returnedCount}
                        )
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <ItemFormDialog
                mode="add"
                trigger={
                  <Button size="sm" className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    등록
                  </Button>
                }
                onSave={(payload) => {
                  addItem(payload);
                  toast.success("분실물이 등록되었습니다.");
                }}
              />
            </div>

            {/* 분실물 목록 */}
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-6">
                불러오는 중...
              </p>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 space-y-1">
                <PackageSearch className="h-8 w-8 text-gray-200 mx-auto" />
                <p className="text-xs text-gray-400">
                  {filter === "전체"
                    ? "등록된 분실물이 없습니다."
                    : `"${filter}" 상태의 분실물이 없습니다.`}
                </p>
                {filter === "전체" && (
                  <p className="text-[10px] text-gray-300">
                    등록 버튼으로 분실물을 추가하세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <LostFoundItemCard
                    key={item.id}
                    item={item}
                    onChangeStatus={changeStatus}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
