"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Shirt,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  User,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCostumeRental } from "@/hooks/use-costume-rental";
import type {
  CostumeRentalItem,
  CostumeRentalRecord,
} from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ================================================================
// 유틸 함수
// ================================================================

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function getStatusLabel(status: CostumeRentalItem["status"]): string {
  switch (status) {
    case "available":
      return "가용";
    case "rented":
      return "대여중";
    case "damaged":
      return "파손";
    case "lost":
      return "분실";
  }
}

function getStatusBadgeClass(status: CostumeRentalItem["status"]): string {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";
    case "rented":
      return "bg-blue-100 text-blue-700";
    case "damaged":
      return "bg-yellow-100 text-yellow-700";
    case "lost":
      return "bg-red-100 text-red-600";
  }
}

const CATEGORIES: CostumeRentalItem["category"][] = [
  "상의",
  "하의",
  "소품",
  "신발",
  "기타",
];

// ================================================================
// 아이템 추가 다이얼로그
// ================================================================

type AddItemDialogProps = {
  onAdd: (
    name: string,
    category: CostumeRentalItem["category"],
    size: string
  ) => void;
};

function AddItemDialog({ onAdd }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<CostumeRentalItem["category"]>("상의");
  const [size, setSize] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.COSTUME_RENTAL.NAME_REQUIRED);
      return;
    }
    onAdd(name, category, size);
    setName("");
    setCategory("상의");
    setSize("");
    setOpen(false);
    toast.success(TOAST.COSTUME_RENTAL.ADDED);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" />
          추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">의상 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이름 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 블랙 재킷"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리</Label>
            <Select
              value={category}
              onValueChange={(val) =>
                setCategory(val as CostumeRentalItem["category"])
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              사이즈 (선택)
            </Label>
            <Input
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="예: M, L, 265"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================================================================
// 대여 다이얼로그
// ================================================================

type RentDialogProps = {
  item: CostumeRentalItem;
  onRent: (itemId: string, renterName: string, dueDate: string) => void;
};

function RentDialog({ item, onRent }: RentDialogProps) {
  const [open, setOpen] = useState(false);
  const [renterName, setRenterName] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });

  const handleSubmit = () => {
    if (!renterName.trim()) {
      toast.error(TOAST.COSTUME_RENTAL.RENTER_REQUIRED);
      return;
    }
    if (!dueDate) {
      toast.error(TOAST.COSTUME_RENTAL.RETURN_DATE_REQUIRED);
      return;
    }
    onRent(item.id, renterName, dueDate);
    setRenterName("");
    setOpen(false);
    toast.success(`"${item.name}" 대여 처리 완료`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
        >
          대여
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            대여 처리 — {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">대여자 이름 *</Label>
            <Input
              value={renterName}
              onChange={(e) => setRenterName(e.target.value)}
              placeholder="예: 홍길동"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">반납 예정일 *</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            대여 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================================================================
// 반납 다이얼로그
// ================================================================

type ReturnDialogProps = {
  item: CostumeRentalItem;
  onReturn: (
    itemId: string,
    condition: CostumeRentalRecord["condition"],
    notes?: string
  ) => void;
};

function ReturnDialog({ item, onReturn }: ReturnDialogProps) {
  const [open, setOpen] = useState(false);
  const [condition, setCondition] =
    useState<NonNullable<CostumeRentalRecord["condition"]>>("good");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    onReturn(item.id, condition, notes);
    setCondition("good");
    setNotes("");
    setOpen(false);
    toast.success(`"${item.name}" 반납 완료`);
  };

  const conditionLabel: Record<
    NonNullable<CostumeRentalRecord["condition"]>,
    string
  > = {
    good: "정상",
    damaged: "파손",
    lost: "분실",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground px-2"
        >
          <RotateCcw className="h-2.5 w-2.5" />
          반납
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            반납 처리 — {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">반납 상태 *</Label>
            <Select
              value={condition}
              onValueChange={(val) =>
                setCondition(
                  val as NonNullable<CostumeRentalRecord["condition"]>
                )
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ["good", "damaged", "lost"] as NonNullable<
                    CostumeRentalRecord["condition"]
                  >[]
                ).map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {conditionLabel[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              비고 (선택)
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 단추 하나 떨어짐"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            반납 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ================================================================
// 아이템 행
// ================================================================

type ItemRowProps = {
  item: CostumeRentalItem;
  onRent: (itemId: string, renterName: string, dueDate: string) => void;
  onReturn: (
    itemId: string,
    condition: CostumeRentalRecord["condition"],
    notes?: string
  ) => void;
  onDelete: (itemId: string, name: string) => void;
};

function ItemRow({ item, onRent, onReturn, onDelete }: ItemRowProps) {
  const overdue = isOverdue(item.dueDate) && item.status === "rented";

  return (
    <div className="flex items-center gap-2 py-2 border-b last:border-0">
      {/* 상태 배지 */}
      <Badge
        variant="secondary"
        className={`text-[10px] px-1.5 py-0 shrink-0 ${getStatusBadgeClass(
          item.status
        )}`}
      >
        {getStatusLabel(item.status)}
      </Badge>

      {/* 이름 + 메타 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-medium truncate">{item.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {item.category}
            {item.size ? ` · ${item.size}` : ""}
          </span>
        </div>
        {item.status === "rented" && item.currentRenter && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <User className="h-2.5 w-2.5" />
              {item.currentRenter}
            </span>
            {item.dueDate && (
              <span
                className={`flex items-center gap-0.5 text-[10px] ${
                  overdue ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                <Calendar className="h-2.5 w-2.5" />
                {formatYearMonthDay(item.dueDate)}
                {overdue && (
                  <AlertTriangle className="h-2.5 w-2.5 text-red-500" />
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-0.5 shrink-0">
        {item.status === "available" && (
          <RentDialog item={item} onRent={onRent} />
        )}
        {item.status === "rented" && (
          <ReturnDialog item={item} onReturn={onReturn} />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item.id, item.name)}
          aria-label="삭제"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ================================================================
// 대여 기록 목록
// ================================================================

type RecordListProps = {
  records: CostumeRentalRecord[];
  items: CostumeRentalItem[];
};

function RecordList({ records, items }: RecordListProps) {
  const [open, setOpen] = useState(false);

  const itemMap = Object.fromEntries(items.map((item) => [item.id, item]));

  const conditionLabel: Record<
    NonNullable<CostumeRentalRecord["condition"]>,
    string
  > = {
    good: "정상",
    damaged: "파손",
    lost: "분실",
  };

  const conditionClass: Record<
    NonNullable<CostumeRentalRecord["condition"]>,
    string
  > = {
    good: "text-green-600",
    damaged: "text-yellow-600",
    lost: "text-red-600",
  };

  if (records.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full pt-2"
        >
          <Package className="h-3 w-3" />
          <span>대여 기록 ({records.length}건)</span>
          {open ? (
            <ChevronUp className="h-3 w-3 ml-auto" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-auto" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-1.5 border rounded-md p-2">
          {[...records].reverse().map((record) => {
            const item = itemMap[record.itemId];
            return (
              <div
                key={record.id}
                className="flex items-start gap-2 text-[10px]"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">
                    {item?.name ?? "삭제된 의상"}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    — {record.renterName}
                  </span>
                  <div className="text-muted-foreground mt-0.5">
                    {formatYearMonthDay(record.rentedAt)}
                    {record.returnedAt && (
                      <> → {formatYearMonthDay(record.returnedAt)}</>
                    )}
                    {!record.returnedAt && (
                      <span className="text-blue-600"> (대여중)</span>
                    )}
                  </div>
                  {record.notes && (
                    <div className="text-muted-foreground/80 mt-0.5">
                      {record.notes}
                    </div>
                  )}
                </div>
                {record.condition && (
                  <span
                    className={`shrink-0 font-medium ${conditionClass[record.condition]}`}
                  >
                    {conditionLabel[record.condition]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ================================================================
// 통계 바
// ================================================================

type StatBarProps = {
  totalItems: number;
  availableCount: number;
  rentedCount: number;
  overdueCount: number;
};

function StatBar({
  totalItems,
  availableCount,
  rentedCount,
  overdueCount,
}: StatBarProps) {
  const stats = [
    {
      label: "전체",
      value: totalItems,
      className: "bg-muted text-muted-foreground",
    },
    {
      label: "가용",
      value: availableCount,
      className: "bg-green-100 text-green-700",
    },
    {
      label: "대여중",
      value: rentedCount,
      className: "bg-blue-100 text-blue-700",
    },
    {
      label: "연체",
      value: overdueCount,
      className: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${stat.className}`}
        >
          <span>{stat.label}</span>
          <span>{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// 메인 카드 컴포넌트
// ================================================================

type CostumeRentalCardProps = {
  groupId: string;
  projectId: string;
};

export function CostumeRentalCard({
  groupId,
  projectId,
}: CostumeRentalCardProps) {
  const [open, setOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<
    CostumeRentalItem["category"] | "전체"
  >("전체");

  const {
    items,
    records,
    loading,
    addItem,
    rentItem,
    returnItem,
    deleteItem,
    totalItems,
    availableCount,
    rentedCount,
    overdueCount,
  } = useCostumeRental(groupId, projectId);

  // ── 카테고리 필터 ───────────────────────────────────────────

  const allCategories: Array<CostumeRentalItem["category"] | "전체"> = [
    "전체",
    ...CATEGORIES,
  ];

  const filteredItems =
    activeCategory === "전체"
      ? items
      : items.filter((item) => item.category === activeCategory);

  // ── 핸들러 ──────────────────────────────────────────────────

  const handleDelete = (itemId: string, name: string) => {
    deleteItem(itemId);
    toast.success(`"${name}" 삭제 완료`);
  };

  // ── 렌더링 ──────────────────────────────────────────────────

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 pt-3 px-4">
        <Collapsible open={open} onOpenChange={setOpen}>
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 group"
              >
                <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium">의상 대여 관리</span>
                {overdueCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 shrink-0 bg-red-100 text-red-600 gap-0.5"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    연체 {overdueCount}
                  </Badge>
                )}
                <span className="text-muted-foreground ml-0.5">
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
            </CollapsibleTrigger>

            {/* 추가 버튼 */}
            {open && <AddItemDialog onAdd={addItem} />}
          </div>

          {/* 카드 본문 */}
          <CollapsibleContent>
            <CardContent className="px-0 pb-0 pt-3">
              {loading ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  불러오는 중...
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 통계 */}
                  {totalItems > 0 && (
                    <StatBar
                      totalItems={totalItems}
                      availableCount={availableCount}
                      rentedCount={rentedCount}
                      overdueCount={overdueCount}
                    />
                  )}

                  {/* 카테고리 필터 탭 */}
                  {totalItems > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {allCategories.map((cat) => {
                        const count =
                          cat === "전체"
                            ? items.length
                            : items.filter((i) => i.category === cat).length;
                        if (cat !== "전체" && count === 0) return null;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveCategory(cat)}
                            className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              activeCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {cat}
                            {count > 0 && (
                              <span className="opacity-75">{count}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 아이템 목록 */}
                  {filteredItems.length === 0 ? (
                    <div className="py-6 text-center space-y-1.5">
                      <Shirt className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        {totalItems === 0
                          ? "등록된 의상이 없습니다."
                          : "해당 카테고리 의상이 없습니다."}
                      </p>
                      {totalItems === 0 && (
                        <p className="text-[11px] text-muted-foreground/70">
                          추가 버튼으로 의상을 등록해보세요.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {filteredItems.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          onRent={rentItem}
                          onReturn={returnItem}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  )}

                  {/* 대여 기록 */}
                  <RecordList records={records} items={items} />
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
}
