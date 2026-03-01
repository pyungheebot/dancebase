"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  Shirt,
  Users,
  BarChart2,
  RotateCcw,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useWardrobeTracker } from "@/hooks/use-wardrobe-tracker";
import type { WardrobeTrackStatus, WardrobeTrackItem } from "@/types";

// ============================================================
// 상수
// ============================================================

const STATUS_LABELS: Record<WardrobeTrackStatus, string> = {
  preparing: "준비중",
  repairing: "수선중",
  ready: "완료",
  lost: "분실",
};

const STATUS_COLORS: Record<WardrobeTrackStatus, string> = {
  preparing: "bg-blue-100 text-blue-700 border-blue-200",
  repairing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ready: "bg-green-100 text-green-700 border-green-200",
  lost: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_BAR_COLORS: Record<WardrobeTrackStatus, string> = {
  preparing: "bg-blue-400",
  repairing: "bg-yellow-400",
  ready: "bg-green-500",
  lost: "bg-red-400",
};

const ALL_STATUSES: WardrobeTrackStatus[] = [
  "preparing",
  "repairing",
  "ready",
  "lost",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "기타"];

// ============================================================
// 빈 폼 초기값
// ============================================================

type ItemForm = {
  name: string;
  scene: string;
  memberName: string;
  size: string;
  color: string;
  status: WardrobeTrackStatus;
  returned: boolean;
};

const EMPTY_FORM: ItemForm = {
  name: "",
  scene: "",
  memberName: "",
  size: "M",
  color: "",
  status: "preparing",
  returned: false,
};

// ============================================================
// 서브 컴포넌트: 상태별 가로 바 차트
// ============================================================

function StatusBarChart({
  statusCounts,
  total,
}: {
  statusCounts: Record<WardrobeTrackStatus, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        등록된 의상이 없습니다.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {ALL_STATUSES.map((s) => {
        const count = statusCounts[s];
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        return (
          <div key={s} className="flex items-center gap-2">
            <span className="w-14 text-xs text-muted-foreground shrink-0">
              {STATUS_LABELS[s]}
            </span>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${STATUS_BAR_COLORS[s]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-xs text-right text-muted-foreground shrink-0">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 서브 컴포넌트: 의상 항목 행
// ============================================================

function ItemRow({
  item,
  onEdit,
  onDelete,
  onToggleReturn,
}: {
  item: WardrobeTrackItem;
  onEdit: (item: WardrobeTrackItem) => void;
  onDelete: (id: string) => void;
  onToggleReturn: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group">
      {/* 상태 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_COLORS[item.status]}`}
      >
        {STATUS_LABELS[item.status]}
      </Badge>

      {/* 의상명 + 장면 */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium truncate">{item.name}</span>
        {item.scene && (
          <span className="text-[10px] text-muted-foreground ml-1">
            S{item.scene}
          </span>
        )}
      </div>

      {/* 멤버 */}
      <span className="text-xs text-muted-foreground shrink-0 max-w-[60px] truncate">
        {item.memberName}
      </span>

      {/* 사이즈 */}
      <span className="text-[10px] text-muted-foreground shrink-0 w-6 text-center">
        {item.size}
      </span>

      {/* 반납 토글 */}
      <button
        onClick={() => onToggleReturn(item.id)}
        title={item.returned ? "반납 완료" : "미반납"}
        className={`shrink-0 h-4 w-4 rounded-full border transition-colors ${
          item.returned
            ? "bg-green-500 border-green-500 text-white"
            : "border-muted-foreground/40"
        }`}
      >
        {item.returned && (
          <CheckCircle2 className="h-4 w-4 text-white" />
        )}
      </button>

      {/* 액션 버튼 (hover 시 표시) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function WardrobeTrackerCard({ projectId }: { projectId: string }) {
  const {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    toggleReturned,
    stats,
  } = useWardrobeTracker(projectId);

  // UI 상태
  const [isOpen, setIsOpen] = useState(true);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMemberOpen, setIsMemberOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<WardrobeTrackStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeTrackItem | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);

  // 필터링된 항목
  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return data.items;
    return data.items.filter((i) => i.status === filterStatus);
  }, [data.items, filterStatus]);

  // 다이얼로그 열기 (추가)
  const openAddDialog = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  // 다이얼로그 열기 (수정)
  const openEditDialog = (item: WardrobeTrackItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      scene: item.scene,
      memberName: item.memberName,
      size: item.size,
      color: item.color,
      status: item.status,
      returned: item.returned,
    });
    setDialogOpen(true);
  };

  // 저장
  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error(TOAST.WARDROBE.COSTUME_NAME_REQUIRED);
      return;
    }
    if (!form.memberName.trim()) {
      toast.error(TOAST.WARDROBE.MEMBER_REQUIRED);
      return;
    }

    if (editingItem) {
      const ok = updateItem(editingItem.id, {
        name: form.name.trim(),
        scene: form.scene.trim(),
        memberName: form.memberName.trim(),
        size: form.size,
        color: form.color.trim(),
        status: form.status,
        returned: form.returned,
      });
      if (ok) {
        toast.success(TOAST.WARDROBE.COSTUME_UPDATED);
      } else {
        toast.error(TOAST.UPDATE_ERROR);
        return;
      }
    } else {
      addItem({
        name: form.name.trim(),
        scene: form.scene.trim(),
        memberName: form.memberName.trim(),
        size: form.size,
        color: form.color.trim(),
        status: form.status,
        returned: form.returned,
      });
      toast.success(TOAST.WARDROBE.COSTUME_ADDED);
    }
    setDialogOpen(false);
  };

  // 삭제
  const handleDelete = (id: string) => {
    const ok = deleteItem(id);
    if (ok) {
      toast.success(TOAST.WARDROBE.COSTUME_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  // 반납 토글
  const handleToggleReturn = (id: string) => {
    const item = data.items.find((i) => i.id === id);
    const ok = toggleReturned(id);
    if (ok) {
      toast.success(item?.returned ? "반납 취소되었습니다." : "반납 처리되었습니다.");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          불러오는 중...
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          {/* 헤더 */}
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer select-none">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                  <Shirt className="h-4 w-4 text-purple-500" />
                  의상 추적기
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 ml-1"
                  >
                    {stats.total}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  {/* 완료율 미니 표시 */}
                  <span className="text-[11px] text-muted-foreground">
                    준비 {stats.readyRate}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAddDialog();
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {/* 준비 완료율 프로그레스 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>전체 준비 완료율</span>
                  <span className="font-medium text-foreground">
                    {stats.readyRate}% ({stats.statusCounts.ready}/{stats.total})
                  </span>
                </div>
                <Progress value={stats.readyRate} className="h-1.5" />
              </div>

              {/* 반납률 */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    반납률
                  </span>
                  <span className="font-medium text-foreground">
                    {stats.returnRate}% ({stats.returnedCount}/{stats.total})
                  </span>
                </div>
                <Progress value={stats.returnRate} className="h-1.5 [&>div]:bg-green-500" />
              </div>

              {/* 필터 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0" />
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterStatus === "all"
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground/50"
                  }`}
                >
                  전체 {stats.total}
                </button>
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterStatus === s
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground/50"
                    }`}
                  >
                    {STATUS_LABELS[s]} {stats.statusCounts[s]}
                  </button>
                ))}
              </div>

              {/* 의상 목록 */}
              {filteredItems.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {filterStatus === "all"
                    ? "등록된 의상이 없습니다. 항목을 추가해보세요."
                    : `"${STATUS_LABELS[filterStatus]}" 상태의 의상이 없습니다.`}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {/* 컬럼 헤더 */}
                  <div className="flex items-center gap-2 px-2 pb-1 border-b">
                    <span className="w-14 text-[10px] text-muted-foreground shrink-0">상태</span>
                    <span className="flex-1 text-[10px] text-muted-foreground">의상명 / 장면</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-[60px]">멤버</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-6 text-center">S</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 w-4 text-center">반납</span>
                    <span className="w-14 shrink-0" />
                  </div>
                  {filteredItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onEdit={openEditDialog}
                      onDelete={handleDelete}
                      onToggleReturn={handleToggleReturn}
                    />
                  ))}
                </div>
              )}

              {/* 상태별 통계 (Collapsible) */}
              <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <BarChart2 className="h-3.5 w-3.5" />
                    상태별 통계
                    {isStatsOpen ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-2 rounded-md bg-muted/40">
                    <StatusBarChart
                      statusCounts={stats.statusCounts}
                      total={stats.total}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* 멤버별 배정 현황 (Collapsible) */}
              <Collapsible open={isMemberOpen} onOpenChange={setIsMemberOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                    <Users className="h-3.5 w-3.5" />
                    멤버별 배정 현황
                    {isMemberOpen ? (
                      <ChevronUp className="h-3 w-3 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 ml-auto" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {Object.keys(stats.byMember).length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        배정된 의상이 없습니다.
                      </p>
                    ) : (
                      Object.entries(stats.byMember).map(([member, items]) => (
                        <div key={member} className="p-2 rounded-md bg-muted/40">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium">{member}</span>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {items.length}벌
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {items.map((item) => (
                              <span
                                key={item.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[item.status]}`}
                              >
                                {item.name}
                                {item.scene && ` (S${item.scene})`}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingItem ? "의상 수정" : "의상 추가"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            {/* 의상명 */}
            <div className="space-y-1">
              <Label className="text-xs">의상명 *</Label>
              <Input
                placeholder="예) 흰색 셔츠"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            {/* 장면 번호 + 배정 멤버 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">장면(Scene)</Label>
                <Input
                  placeholder="예) 1"
                  value={form.scene}
                  onChange={(e) => setForm({ ...form, scene: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">배정 멤버 *</Label>
                <Input
                  placeholder="멤버명"
                  value={form.memberName}
                  onChange={(e) =>
                    setForm({ ...form, memberName: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 사이즈 + 색상 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">사이즈</Label>
                <Select
                  value={form.size}
                  onValueChange={(v) => setForm({ ...form, size: v })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((s) => (
                      <SelectItem key={s} value={s} className="text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">색상</Label>
                <Input
                  placeholder="예) 블랙"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* 상태 */}
            <div className="space-y-1">
              <Label className="text-xs">상태</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as WardrobeTrackStatus })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 반납 여부 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="returned"
                checked={form.returned}
                onChange={(e) =>
                  setForm({ ...form, returned: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="returned" className="text-xs cursor-pointer">
                반납 완료
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
              {editingItem ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
