"use client";

import { useState } from "react";
import { useShowInventory } from "@/hooks/use-show-inventory";
import type { ShowInventoryCategory, ShowInventoryItem } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  ChevronRight,
  Package,
  Plus,
  Trash2,
  Shirt,
  Sparkles,
  Cpu,
  Music,
  FileText,
  Heart,
  HelpCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ============================================
// 카테고리 헬퍼
// ============================================

const ALL_CATEGORIES: ShowInventoryCategory[] = [
  "costume",
  "prop",
  "tech",
  "music",
  "document",
  "first_aid",
  "other",
];

function categoryLabel(category: ShowInventoryCategory): string {
  switch (category) {
    case "costume":
      return "의상";
    case "prop":
      return "소품";
    case "tech":
      return "장비";
    case "music":
      return "음악";
    case "document":
      return "서류";
    case "first_aid":
      return "응급용품";
    case "other":
      return "기타";
  }
}

function CategoryIcon({
  category,
  className,
}: {
  category: ShowInventoryCategory;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5";
  switch (category) {
    case "costume":
      return <Shirt className={cls} />;
    case "prop":
      return <Sparkles className={cls} />;
    case "tech":
      return <Cpu className={cls} />;
    case "music":
      return <Music className={cls} />;
    case "document":
      return <FileText className={cls} />;
    case "first_aid":
      return <Heart className={cls} />;
    case "other":
      return <HelpCircle className={cls} />;
  }
}

function categoryIconColor(category: ShowInventoryCategory): string {
  switch (category) {
    case "costume":
      return "text-pink-500";
    case "prop":
      return "text-purple-500";
    case "tech":
      return "text-blue-500";
    case "music":
      return "text-indigo-500";
    case "document":
      return "text-yellow-500";
    case "first_aid":
      return "text-red-500";
    case "other":
      return "text-gray-400";
  }
}

// ============================================
// 우선순위 헬퍼
// ============================================

function priorityLabel(priority: "essential" | "important" | "optional"): string {
  switch (priority) {
    case "essential":
      return "필수";
    case "important":
      return "중요";
    case "optional":
      return "선택";
  }
}

function priorityBadgeClass(priority: "essential" | "important" | "optional"): string {
  switch (priority) {
    case "essential":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "important":
      return "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100";
    case "optional":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  }
}

// ============================================
// 아이템 추가 다이얼로그
// ============================================

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberNames: string[];
  onSubmit: (
    name: string,
    category: ShowInventoryCategory,
    quantity: number,
    assignedTo: string,
    notes: string,
    priority: "essential" | "important" | "optional"
  ) => void;
}

function AddItemDialog({
  open,
  onOpenChange,
  memberNames,
  onSubmit,
}: AddItemDialogProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ShowInventoryCategory>("costume");
  const [quantity, setQuantity] = useState("1");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"essential" | "important" | "optional">("important");

  const resetForm = () => {
    setName("");
    setCategory("costume");
    setQuantity("1");
    setAssignedTo("");
    setNotes("");
    setPriority("important");
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.SHOW_INVENTORY.NAME_REQUIRED);
      return;
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      toast.error(TOAST.SHOW_INVENTORY.QUANTITY_REQUIRED);
      return;
    }
    onSubmit(name.trim(), category, qty, assignedTo, notes.trim(), priority);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            물품 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 물품명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">물품명 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 공연 의상 상의"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">카테고리 *</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ShowInventoryCategory)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {categoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 수량 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">수량 *</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">담당자 (선택)</Label>
            <Select
              value={assignedTo || "__none__"}
              onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="담당자 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="text-xs">
                  미지정
                </SelectItem>
                {memberNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 우선순위 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">우선순위 *</Label>
            <Select
              value={priority}
              onValueChange={(v) =>
                setPriority(v as "essential" | "important" | "optional")
              }
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="essential" className="text-xs">
                  필수
                </SelectItem>
                <SelectItem value="important" className="text-xs">
                  중요
                </SelectItem>
                <SelectItem value="optional" className="text-xs">
                  선택
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="추가 설명을 입력하세요"
              className="text-xs min-h-[56px] resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              추가
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 아이템 행
// ============================================

interface InventoryItemRowProps {
  item: ShowInventoryItem;
  memberNames: string[];
  onTogglePacked: (id: string, packedBy: string) => void;
  onDelete: (id: string) => void;
}

function InventoryItemRow({
  item,
  memberNames,
  onTogglePacked,
  onDelete,
}: InventoryItemRowProps) {
  const [showPackerSelect, setShowPackerSelect] = useState(false);

  const handleCheckboxClick = () => {
    if (item.packed) {
      // 이미 packed 상태 -> 해제
      onTogglePacked(item.id, "");
      return;
    }
    if (memberNames.length <= 1) {
      onTogglePacked(item.id, memberNames[0] ?? "담당자");
      return;
    }
    setShowPackerSelect(true);
  };

  const handleConfirmPacker = (packer: string) => {
    setShowPackerSelect(false);
    onTogglePacked(item.id, packer);
  };

  return (
    <div
      className={`flex items-start gap-2 px-2 py-1.5 rounded-md border transition-colors ${
        item.packed
          ? "bg-muted/30 border-muted"
          : "bg-card border-border hover:bg-muted/10"
      }`}
    >
      {/* 체크박스 */}
      <Checkbox
        checked={item.packed}
        onCheckedChange={handleCheckboxClick}
        className="mt-0.5 flex-shrink-0 h-3.5 w-3.5"
        aria-label={item.packed ? "짐 해제" : "짐 싸기"}
      />

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-medium ${
              item.packed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.name}
          </span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            x{item.quantity}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${priorityBadgeClass(item.priority)}`}
          >
            {priorityLabel(item.priority)}
          </Badge>
          {item.assignedTo && (
            <span className="text-[10px] text-muted-foreground flex-shrink-0">
              @{item.assignedTo}
            </span>
          )}
        </div>

        {item.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            {item.notes}
          </p>
        )}

        {item.packed && item.packedBy && item.packedAt && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-green-600">
            <Clock className="h-2.5 w-2.5" />
            <span>
              {item.packedBy} ·{" "}
              {new Date(item.packedAt).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </div>
        )}

        {/* 담당자 인라인 선택 */}
        {showPackerSelect && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className="text-[10px] text-muted-foreground self-center">
              담당자:
            </span>
            {memberNames.map((memberName) => (
              <button
                key={memberName}
                onClick={() => handleConfirmPacker(memberName)}
                className="text-[10px] px-2 py-0.5 rounded border bg-muted hover:bg-muted/80 border-border transition-colors"
              >
                {memberName}
              </button>
            ))}
            <button
              onClick={() => setShowPackerSelect(false)}
              className="text-[10px] px-2 py-0.5 rounded border border-border hover:bg-muted/80 text-muted-foreground transition-colors"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* 삭제 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(item.id)}
        title="물품 삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface ShowInventoryCardProps {
  groupId: string;
  projectId: string;
  memberNames: string[];
}

export function ShowInventoryCard({
  groupId,
  projectId,
  memberNames,
}: ShowInventoryCardProps) {
  const [open, setOpen] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ShowInventoryCategory | "all">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    items,
    addItem,
    deleteItem,
    togglePacked,
    totalItems,
    packedCount,
    unpackedCount,
    essentialUnpacked,
    packProgress,
  } = useShowInventory(groupId, projectId);

  const handleAddItem = (
    name: string,
    category: ShowInventoryCategory,
    quantity: number,
    assignedTo: string,
    notes: string,
    priority: "essential" | "important" | "optional"
  ) => {
    const ok = addItem(
      name,
      category,
      quantity,
      assignedTo || undefined,
      notes || undefined,
      priority
    );
    if (ok) {
      toast.success(TOAST.SHOW_INVENTORY.ITEM_ADDED);
    } else {
      toast.error(TOAST.SHOW_INVENTORY.ITEM_ADD_ERROR);
    }
  };

  const handleDeleteItem = () => {
    if (!deleteConfirmId) return;
    deleteItem(deleteConfirmId);
    toast.success(TOAST.SHOW_INVENTORY.ITEM_DELETED);
    setDeleteConfirmId(null);
  };

  const handleTogglePacked = (id: string, packedBy: string) => {
    togglePacked(id, packedBy);
  };

  // 필터링된 아이템
  const filteredItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => item.category === activeFilter);

  // 카테고리별 그룹화 (필터가 "all"일 때)
  const groupedByCategory: Partial<Record<ShowInventoryCategory, ShowInventoryItem[]>> = {};
  for (const item of filteredItems) {
    if (!groupedByCategory[item.category]) groupedByCategory[item.category] = [];
    groupedByCategory[item.category]!.push(item);
  }

  // 카테고리 순서
  const orderedCategories: ShowInventoryCategory[] = [
    "costume",
    "prop",
    "tech",
    "music",
    "document",
    "first_aid",
    "other",
  ];

  // 실제 사용 중인 카테고리
  const usedCategories = orderedCategories.filter(
    (cat) => items.some((item) => item.category === cat)
  );

  return (
    <>
      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        memberNames={memberNames}
        onSubmit={handleAddItem}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <Package className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span className="text-sm font-semibold">공연 물품 목록</span>
              {totalItems > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  {totalItems}개
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 필수 미완료 경고 배지 */}
            {essentialUnpacked > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
              >
                필수 {essentialUnpacked}개 미완료
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAddDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              물품 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {/* 통계 행 */}
            {totalItems > 0 && (
              <div className="space-y-2">
                {/* 수치 요약 */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">전체</span>
                    <span className="text-xs font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">완료</span>
                    <span className="text-xs font-semibold text-green-600">{packedCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">미완료</span>
                    <span className="text-xs font-semibold text-orange-600">{unpackedCount}</span>
                  </div>
                  {essentialUnpacked > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">필수 미완료</span>
                      <span className="text-xs font-semibold text-red-600">{essentialUnpacked}</span>
                    </div>
                  )}
                  <span className="ml-auto text-[10px] font-medium text-muted-foreground">
                    {packProgress}%
                  </span>
                </div>

                {/* 진행률 바 */}
                <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                      packProgress >= 100 ? "bg-green-500" : "bg-orange-400"
                    }`}
                    style={{ width: `${packProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* 카테고리 필터 */}
            {usedCategories.length > 1 && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    activeFilter === "all"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-muted/80 border-border text-muted-foreground"
                  }`}
                >
                  전체
                </button>
                {usedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      activeFilter === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 border-border text-muted-foreground"
                    }`}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {totalItems === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">등록된 물품이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;물품 추가&rdquo; 버튼으로 물품을 등록하세요.
                </p>
              </div>
            )}

            {/* 카테고리별 물품 목록 */}
            {filteredItems.length > 0 && (
              <div className="space-y-3">
                {orderedCategories.map((cat) => {
                  const catItems = groupedByCategory[cat];
                  if (!catItems || catItems.length === 0) return null;
                  const catPacked = catItems.filter((i) => i.packed).length;

                  return (
                    <div key={cat} className="space-y-1">
                      {/* 카테고리 헤더 */}
                      <div className="flex items-center gap-1.5">
                        <span className={categoryIconColor(cat)}>
                          <CategoryIcon category={cat} className="h-3 w-3" />
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {categoryLabel(cat)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({catPacked}/{catItems.length})
                        </span>
                      </div>

                      {/* 아이템 목록 */}
                      <div className="space-y-1 pl-4">
                        {catItems.map((item) => (
                          <InventoryItemRow
                            key={item.id}
                            item={item}
                            memberNames={memberNames}
                            onTogglePacked={handleTogglePacked}
                            onDelete={setDeleteConfirmId}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 필터 결과 없음 */}
            {totalItems > 0 && filteredItems.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs">해당 카테고리에 물품이 없습니다.</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(v) => !v && setDeleteConfirmId(null)}
        title="물품 삭제"
        description="이 물품을 삭제하시겠습니까?"
        onConfirm={handleDeleteItem}
        destructive
      />
    </>
  );
}
