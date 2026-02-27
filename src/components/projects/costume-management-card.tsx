"use client";

import { useState, useCallback } from "react";
import {
  useCostumeManagement,
  COSTUME_CATEGORIES,
  COSTUME_SIZES,
  COSTUME_STATUS_LABELS,
} from "@/hooks/use-costume-management";
import type { CostumeItem, CostumeStatus } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  ChevronDown,
  ChevronRight,
  Shirt,
  Plus,
  Trash2,
  User,
  Package,
  CheckCircle,
  RotateCcw,
  BarChart3,
  X,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 상태 배지 색상
// ============================================

function statusBadgeClass(status: CostumeStatus): string {
  switch (status) {
    case "planned":
      return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100";
    case "ordered":
      return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
    case "arrived":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
    case "distributed":
      return "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100";
    case "returned":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
  }
}

// ============================================
// 의상 추가 폼
// ============================================

interface AddItemFormProps {
  onAdd: (payload: {
    name: string;
    category: string;
    color: string;
    totalQuantity: number;
    status: CostumeStatus;
    note: string;
  }) => boolean;
  onClose: () => void;
}

function AddItemForm({ onAdd, onClose }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(COSTUME_CATEGORIES[0]);
  const [color, setColor] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [status, setStatus] = useState<CostumeStatus>("planned");
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("의상 이름을 입력하세요.");
      return;
    }
    if (totalQuantity < 1) {
      toast.error("수량은 1개 이상이어야 합니다.");
      return;
    }
    const ok = onAdd({ name, category, color, totalQuantity, status, note });
    if (ok) {
      toast.success("의상이 등록되었습니다.");
      onClose();
    } else {
      toast.error("의상 등록에 실패했습니다.");
    }
  }

  return (
    <div className="border rounded-md p-3 space-y-2.5 bg-muted/30 mt-2">
      <p className="text-xs font-medium text-muted-foreground">새 의상 등록</p>

      {/* 이름 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">의상 이름 *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 검은 탑, 빨간 스커트"
          className="h-7 text-xs"
          autoFocus
        />
      </div>

      {/* 카테고리 + 색상 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">카테고리</Label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-7 text-xs w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COSTUME_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">색상</Label>
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="예: 검정, 빨간"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* 수량 + 상태 */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">총 수량</Label>
          <Input
            type="number"
            min={1}
            value={totalQuantity}
            onChange={(e) => setTotalQuantity(Math.max(1, Number(e.target.value)))}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">상태</Label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CostumeStatus)}
            className="h-7 text-xs w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(Object.entries(COSTUME_STATUS_LABELS) as [CostumeStatus, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>{label}</option>
              )
            )}
          </select>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <Label className="text-[10px] text-muted-foreground mb-0.5 block">메모</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="간단한 메모 (선택)"
          className="h-7 text-xs"
        />
      </div>

      <div className="flex gap-1.5 pt-1">
        <Button
          size="sm"
          className="h-7 text-xs flex-1"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          <Plus className="h-3 w-3 mr-1" />
          등록
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 멤버 배정 폼
// ============================================

interface AssignMemberFormProps {
  item: CostumeItem;
  onAssign: (payload: {
    costumeId: string;
    memberId: string;
    memberName: string;
    size: string;
  }) => boolean;
  onClose: () => void;
}

function AssignMemberForm({ item, onAssign, onClose }: AssignMemberFormProps) {
  const [memberName, setMemberName] = useState("");
  const [size, setSize] = useState<string>(COSTUME_SIZES[2]); // 기본 M

  function handleSubmit() {
    if (!memberName.trim()) {
      toast.error("멤버 이름을 입력하세요.");
      return;
    }
    const ok = onAssign({
      costumeId: item.id,
      memberId: crypto.randomUUID(),
      memberName,
      size,
    });
    if (ok) {
      toast.success(`${memberName}님에게 "${item.name}"이(가) 배정되었습니다.`);
      onClose();
    } else {
      toast.error("배정에 실패했습니다. 재고가 부족하거나 이미 배정된 멤버입니다.");
    }
  }

  return (
    <div className="border rounded-md p-2.5 space-y-2 bg-muted/20 mt-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">멤버 배정</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">멤버 이름 *</Label>
          <Input
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="이름 입력"
            className="h-6 text-xs"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">사이즈</Label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="h-6 text-xs w-full rounded-md border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {COSTUME_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-1 pt-0.5">
        <Button
          size="sm"
          className="h-6 text-[11px] flex-1"
          onClick={handleSubmit}
          disabled={!memberName.trim()}
        >
          배정
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px]"
          onClick={onClose}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ============================================
// 개별 의상 행
// ============================================

interface ItemRowProps {
  item: CostumeItem;
  assignments: ReturnType<ReturnType<typeof useCostumeManagement>["assignmentsForItem"]>;
  onDelete: () => void;
  onAssign: (payload: {
    costumeId: string;
    memberId: string;
    memberName: string;
    size: string;
  }) => boolean;
  onUnassign: (costumeId: string, memberId: string) => void;
  onMarkReturned: (costumeId: string, memberId: string, returned: boolean) => void;
}

function ItemRow({
  item,
  assignments,
  onDelete,
  onAssign,
  onUnassign,
  onMarkReturned,
}: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [assignFormOpen, setAssignFormOpen] = useState(false);

  const activeAssignments = assignments.filter((a) => !a.returned);
  const returnedAssignments = assignments.filter((a) => a.returned);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="border rounded-md overflow-hidden">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-2 min-w-0">
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <Shirt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate">{item.name}</span>
              <Badge className="text-[10px] px-1.5 py-0 bg-secondary text-secondary-foreground border-transparent hover:bg-secondary shrink-0">
                {item.category}
              </Badge>
              <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${statusBadgeClass(item.status)}`}>
                {COSTUME_STATUS_LABELS[item.status]}
              </Badge>
              {item.color && (
                <span className="text-[10px] text-muted-foreground shrink-0">{item.color}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-muted-foreground">
                재고 {item.availableQuantity}/{item.totalQuantity}
              </span>
              {activeAssignments.length > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                  <User className="h-2.5 w-2.5 mr-0.5" />
                  {activeAssignments.length}명
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* 상세 */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-2 border-t space-y-2">
            {/* 메모 */}
            {item.note && (
              <p className="text-[11px] text-muted-foreground italic">{item.note}</p>
            )}

            {/* 배정된 멤버 목록 */}
            {activeAssignments.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">배정 현황</p>
                {activeAssignments.map((a) => (
                  <div
                    key={`${a.costumeId}-${a.memberId}`}
                    className="flex items-center justify-between bg-muted/30 rounded px-2 py-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{a.memberName}</span>
                      <Badge className="text-[10px] px-1 py-0 bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-100">
                        {a.size}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 text-[10px] px-1.5 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onMarkReturned(a.costumeId, a.memberId, true)}
                      >
                        <CheckCircle className="h-3 w-3 mr-0.5" />
                        반납
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => onUnassign(a.costumeId, a.memberId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 반납 완료 멤버 */}
            {returnedAssignments.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">반납 완료</p>
                {returnedAssignments.map((a) => (
                  <div
                    key={`${a.costumeId}-${a.memberId}-returned`}
                    className="flex items-center justify-between bg-muted/10 rounded px-2 py-1 opacity-60"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs line-through text-muted-foreground">
                        {a.memberName}
                      </span>
                      <Badge className="text-[10px] px-1 py-0 bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
                        {a.size}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => onMarkReturned(a.costumeId, a.memberId, false)}
                    >
                      <RotateCcw className="h-3 w-3 mr-0.5" />
                      취소
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* 배정 폼 */}
            {assignFormOpen ? (
              <AssignMemberForm
                item={item}
                onAssign={onAssign}
                onClose={() => setAssignFormOpen(false)}
              />
            ) : (
              item.availableQuantity > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs w-full"
                  onClick={() => setAssignFormOpen(true)}
                >
                  <User className="h-3 w-3 mr-1" />
                  멤버 배정
                </Button>
              )
            )}

            {item.availableQuantity <= 0 && !assignFormOpen && (
              <p className="text-[11px] text-muted-foreground text-center">
                재고가 없습니다.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// 통계 패널
// ============================================

interface StatsProps {
  totalItems: number;
  totalAssignments: number;
  returnedCount: number;
  pendingReturnCount: number;
}

function StatsPanel({ totalItems, totalAssignments, returnedCount, pendingReturnCount }: StatsProps) {
  const returnRate =
    totalAssignments > 0
      ? Math.round((returnedCount / totalAssignments) * 100)
      : 0;
  const assignRate =
    totalItems > 0
      ? Math.round((totalAssignments / totalItems) * 100)
      : 0;

  return (
    <div className="border rounded-md p-3 bg-muted/20 space-y-2">
      <p className="text-xs font-medium">의상 현황 통계</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">전체 의상</span>
            <span className="text-xs font-semibold">{totalItems}종</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">전체 배정</span>
            <span className="text-xs font-semibold">{totalAssignments}건</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">반납 완료</span>
            <span className="text-xs font-semibold text-green-600">{returnedCount}건</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">반납 대기</span>
            <span className="text-xs font-semibold text-orange-500">{pendingReturnCount}건</span>
          </div>
        </div>
      </div>

      {totalAssignments > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">반납률</span>
            <span className="text-[10px] font-medium">{returnRate}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-green-400 transition-all"
              style={{ width: `${returnRate}%` }}
            />
          </div>
        </div>
      )}

      {totalItems > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">배정률</span>
            <span className="text-[10px] font-medium">{assignRate}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-400 transition-all"
              style={{ width: `${Math.min(assignRate, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

interface CostumeManagementCardProps {
  groupId: string;
  projectId: string;
}

export function CostumeManagementCard({
  groupId,
  projectId,
}: CostumeManagementCardProps) {
  const {
    items,
    loading,
    totalItems,
    totalAssignments,
    returnedCount,
    pendingReturnCount,
    assignmentsForItem,
    addItem,
    deleteItem,
    assignMember,
    unassignMember,
    markReturned,
  } = useCostumeManagement(groupId, projectId);

  const [cardExpanded, setCardExpanded] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CostumeStatus | "all">("all");

  const filteredItems =
    filterStatus === "all"
      ? items
      : items.filter((i) => i.status === filterStatus);

  const handleDelete = useCallback(
    (item: CostumeItem) => {
      deleteItem(item.id);
      toast.success(`"${item.name}"이(가) 삭제되었습니다.`);
    },
    [deleteItem]
  );

  const STATUS_FILTER_OPTIONS: { value: CostumeStatus | "all"; label: string }[] = [
    { value: "all", label: "전체" },
    { value: "planned", label: "준비 예정" },
    { value: "ordered", label: "주문 완료" },
    { value: "arrived", label: "입고 완료" },
    { value: "distributed", label: "배포 완료" },
    { value: "returned", label: "반납 완료" },
  ];

  return (
    <Collapsible open={cardExpanded} onOpenChange={setCardExpanded}>
      <div className="border rounded-lg overflow-hidden">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-left min-w-0">
              {cardExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <Shirt className="h-4 w-4 text-pink-500 shrink-0" />
              <span className="text-sm font-semibold">코스튬/의상 관리</span>
              {totalItems > 0 && (
                <>
                  <Badge className="text-[10px] px-1.5 py-0 bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-100">
                    {totalItems}종
                  </Badge>
                  {pendingReturnCount > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
                      <Package className="h-2.5 w-2.5 mr-0.5" />
                      반납대기 {pendingReturnCount}
                    </Badge>
                  )}
                </>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 shrink-0">
            {totalItems > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setStatsOpen((v) => !v)}
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                통계
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setFormOpen((v) => !v)}
            >
              <Plus className="h-3 w-3 mr-1" />
              의상 추가
            </Button>
          </div>
        </div>

        {/* 카드 본문 */}
        <CollapsibleContent>
          <div className="p-4 space-y-3">
            {/* 통계 패널 */}
            {statsOpen && totalItems > 0 && (
              <StatsPanel
                totalItems={totalItems}
                totalAssignments={totalAssignments}
                returnedCount={returnedCount}
                pendingReturnCount={pendingReturnCount}
              />
            )}

            {/* 추가 폼 */}
            {formOpen && (
              <AddItemForm
                onAdd={addItem}
                onClose={() => setFormOpen(false)}
              />
            )}

            {/* 상태 필터 */}
            {totalItems > 0 && (
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterStatus(opt.value)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterStatus === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* 의상 목록 */}
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-md" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Shirt className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-xs">
                  {filterStatus === "all"
                    ? "등록된 의상이 없습니다."
                    : `'${COSTUME_STATUS_LABELS[filterStatus as CostumeStatus]}' 상태의 의상이 없습니다.`}
                </p>
                {filterStatus === "all" && (
                  <p className="text-[10px] mt-0.5">
                    위 &apos;의상 추가&apos; 버튼으로 공연 의상을 등록하세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    assignments={assignmentsForItem(item.id)}
                    onDelete={() => handleDelete(item)}
                    onAssign={assignMember}
                    onUnassign={unassignMember}
                    onMarkReturned={markReturned}
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
