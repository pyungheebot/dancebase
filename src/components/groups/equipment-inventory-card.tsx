"use client";

import { useState } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle,
  Volume2,
  Lightbulb,
  Layers,
  Dumbbell,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useEquipmentInventory } from "@/hooks/use-equipment-inventory";
import type { EquipmentCondition, EquipmentItem, EquipmentCheckout } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORIES = ["음향", "조명", "무대", "연습용품", "기타"] as const;

const CONDITION_LABELS: Record<EquipmentCondition, string> = {
  excellent: "최상",
  good: "양호",
  fair: "보통",
  poor: "불량",
  broken: "파손",
};

const CONDITION_COLORS: Record<EquipmentCondition, string> = {
  excellent: "bg-emerald-100 text-emerald-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-yellow-100 text-yellow-700",
  poor: "bg-orange-100 text-orange-700",
  broken: "bg-red-100 text-red-700",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  음향: <Volume2 className="h-3 w-3" />,
  조명: <Lightbulb className="h-3 w-3" />,
  무대: <Layers className="h-3 w-3" />,
  연습용품: <Dumbbell className="h-3 w-3" />,
  기타: <MoreHorizontal className="h-3 w-3" />,
};

// ─── 날짜 포맷 ───────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 장비 추가 폼 ─────────────────────────────────────────────

interface AddItemFormProps {
  onAdd: ReturnType<typeof useEquipmentInventory>["addItem"];
  onClose: () => void;
}

function AddItemForm({ onAdd, onClose }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<EquipmentCondition>("good");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.NAME_REQUIRED);
      return;
    }
    if (quantity < 1) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.QUANTITY_MIN);
      return;
    }
    const ok = onAdd({ name: name.trim(), category, quantity, condition, location: location.trim(), note: note.trim() });
    if (ok) {
      toast.success(TOAST.EQUIPMENT_INVENTORY.REGISTERED);
      onClose();
    } else {
      toast.error(TOAST.EQUIPMENT_INVENTORY.REGISTER_ERROR);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-medium text-gray-600">새 장비 등록</p>

      {/* 이름 */}
      <Input
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 50))}
        placeholder="장비 이름 (예: 블루투스 스피커)"
        className="h-8 text-xs"
      />

      {/* 카테고리 + 상태 */}
      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
          className="flex-1 rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          {(Object.keys(CONDITION_LABELS) as EquipmentCondition[]).map((c) => (
            <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {/* 수량 + 보관장소 */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500 whitespace-nowrap">수량:</span>
          <Input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="h-8 w-16 text-xs"
          />
        </div>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value.slice(0, 30))}
          placeholder="보관 장소 (선택)"
          className="h-8 flex-1 text-xs"
        />
      </div>

      {/* 메모 */}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 100))}
        placeholder="메모 (선택, 최대 100자)"
        className="h-8 text-xs"
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs" onClick={handleSubmit}>
          <Plus className="mr-1 h-3 w-3" />
          등록
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 대여 폼 ─────────────────────────────────────────────────

interface CheckoutFormProps {
  items: EquipmentItem[];
  onCheckout: ReturnType<typeof useEquipmentInventory>["checkout"];
  onClose: () => void;
}

function CheckoutForm({ items, onCheckout, onClose }: CheckoutFormProps) {
  const [equipmentId, setEquipmentId] = useState(items[0]?.id ?? "");
  const [borrowerName, setBorrowerName] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!equipmentId) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.SELECT_REQUIRED);
      return;
    }
    if (!borrowerName.trim()) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.RENTER_REQUIRED);
      return;
    }
    if (!expectedReturn) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.RETURN_DATE_REQUIRED);
      return;
    }
    const result = onCheckout(equipmentId, borrowerName.trim(), expectedReturn, note.trim());
    if (result.ok) {
      toast.success(TOAST.EQUIPMENT_INVENTORY.RENTAL_DONE);
      onClose();
    } else {
      toast.error(result.error ?? "대여 처리에 실패했습니다.");
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50 p-3 space-y-2">
      <p className="text-xs font-medium text-blue-700">장비 대여</p>

      {/* 장비 선택 */}
      <select
        value={equipmentId}
        onChange={(e) => setEquipmentId(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.category}) - {item.quantity}개
          </option>
        ))}
      </select>

      {/* 대여자 + 반납예정일 */}
      <div className="flex gap-2">
        <Input
          value={borrowerName}
          onChange={(e) => setBorrowerName(e.target.value.slice(0, 20))}
          placeholder="대여자 이름"
          className="h-8 flex-1 text-xs"
        />
        <input
          type="date"
          value={expectedReturn}
          min={todayStr()}
          onChange={(e) => setExpectedReturn(e.target.value)}
          className="rounded-md border border-gray-200 bg-background px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
          title="반납 예정일"
        />
      </div>

      {/* 메모 */}
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 100))}
        placeholder="메모 (선택)"
        className="h-8 text-xs"
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button size="sm" className="h-7 flex-1 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleSubmit}>
          <ArrowDownToLine className="mr-1 h-3 w-3" />
          대여 처리
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 대여 목록 아이템 ─────────────────────────────────────────

interface CheckoutItemProps {
  checkout: EquipmentCheckout;
  itemName: string;
  overdue: boolean;
  onReturn: () => void;
}

function CheckoutItem({ checkout, itemName, overdue, onReturn }: CheckoutItemProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-3 py-2 text-xs ${
        overdue ? "bg-red-50 border border-red-200" : "bg-gray-50 border border-gray-100"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {overdue && <AlertTriangle className="h-3 w-3 shrink-0 text-red-500" />}
          <span className={`font-medium truncate ${overdue ? "text-red-700" : "text-gray-700"}`}>
            {checkout.borrowerName}
          </span>
          <span className="shrink-0 text-gray-400">·</span>
          <span className="shrink-0 text-gray-500">{itemName}</span>
        </div>
        <div className={`mt-0.5 ${overdue ? "text-red-500" : "text-gray-400"}`}>
          반납예정: {checkout.expectedReturn}
          {overdue && " (연체)"}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-2 h-6 shrink-0 px-2 text-[10px] text-blue-600 hover:bg-blue-50"
        onClick={onReturn}
      >
        <ArrowUpFromLine className="mr-0.5 h-3 w-3" />
        반납
      </Button>
    </div>
  );
}

// ─── 장비 아이템 행 ───────────────────────────────────────────

interface EquipmentRowProps {
  item: EquipmentItem;
  activeCheckoutCount: number;
  onDelete: () => void;
}

function EquipmentRow({ item, activeCheckoutCount, onDelete }: EquipmentRowProps) {
  const available = item.quantity - activeCheckoutCount;

  return (
    <div className="flex items-center gap-2 rounded-md border border-gray-100 bg-background px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-800 truncate">{item.name}</span>
          <Badge className={`shrink-0 text-[10px] px-1.5 py-0 ${CONDITION_COLORS[item.condition]}`}>
            {CONDITION_LABELS[item.condition]}
          </Badge>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-gray-400">
          {item.location && <span>보관: {item.location}</span>}
          <span>
            수량 {item.quantity}개
            {activeCheckoutCount > 0 && (
              <span className="text-blue-600"> (대여 {activeCheckoutCount}개 / 잔여 {available}개)</span>
            )}
          </span>
        </div>
        {item.note && (
          <div className="mt-0.5 text-[10px] text-gray-400 truncate">{item.note}</div>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 shrink-0 p-0 text-gray-300 hover:text-red-500"
        onClick={onDelete}
        title="삭제"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── 통계 요약 바 ────────────────────────────────────────────

interface StatsSummaryProps {
  totalItems: number;
  activeCheckoutCount: number;
  overdueCount: number;
  goodRate: number;
}

function StatsSummary({ totalItems, activeCheckoutCount, overdueCount, goodRate }: StatsSummaryProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "전체 장비", value: totalItems, color: "text-gray-700", bg: "bg-gray-50" },
        { label: "대여 중", value: activeCheckoutCount, color: "text-blue-700", bg: "bg-blue-50" },
        { label: "연체", value: overdueCount, color: "text-red-700", bg: "bg-red-50" },
        { label: "양호 비율", value: `${goodRate}%`, color: "text-emerald-700", bg: "bg-emerald-50" },
      ].map(({ label, value, color, bg }) => (
        <div key={label} className={`rounded-lg ${bg} px-3 py-2 text-center`}>
          <div className={`text-sm font-bold ${color}`}>{value}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface EquipmentInventoryCardProps {
  groupId: string;
}

export function EquipmentInventoryCard({ groupId }: EquipmentInventoryCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "checkouts">("items");

  const {
    items,
    checkouts,
    addItem,
    deleteItem,
    checkout,
    returnCheckout,
    getActiveCheckouts,
    getOverdueCheckouts,
    getCheckoutsForItem,
    isOverdue,
    totalItems,
    activeCheckoutCount,
    overdueCount,
    goodRate,

    refetch,
  } = useEquipmentInventory(groupId);

  const activeCheckouts = getActiveCheckouts();
  const overdueCheckouts = getOverdueCheckouts();

  // 카테고리별 그룹핑
  const grouped: Record<string, EquipmentItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const handleDelete = (item: EquipmentItem) => {
    const active = getCheckoutsForItem(item.id).filter((c) => !c.returnedAt).length;
    if (active > 0) {
      toast.error(TOAST.EQUIPMENT_INVENTORY.RENTAL_ACTIVE_DELETE_ERROR);
      return;
    }
    const ok = deleteItem(item.id);
    if (ok) {
      toast.success(TOAST.EQUIPMENT_INVENTORY.DELETED);
    } else {
      toast.error(TOAST.EQUIPMENT_INVENTORY.DELETE_ERROR);
    }
  };

  const handleReturn = (checkoutId: string) => {
    const ok = returnCheckout(checkoutId);
    if (ok) {
      toast.success(TOAST.EQUIPMENT_INVENTORY.RETURN_DONE);
    } else {
      toast.error(TOAST.EQUIPMENT_INVENTORY.RETURN_ERROR);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-semibold text-gray-800">장비 인벤토리</span>
          {totalItems > 0 && (
            <Badge className="bg-teal-100 text-[10px] px-1.5 py-0 text-teal-600 hover:bg-teal-100">
              {totalItems}개
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge className="bg-red-100 text-[10px] px-1.5 py-0 text-red-600 hover:bg-red-100">
              <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
              연체 {overdueCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-400"
            onClick={() => { refetch(); toast.success(TOAST.EQUIPMENT_INVENTORY.REFRESHED); }}
            title="새로고침"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
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

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-card p-4 space-y-4">
          {/* 통계 요약 */}
          <StatsSummary
            totalItems={totalItems}
            activeCheckoutCount={activeCheckoutCount}
            overdueCount={overdueCount}
            goodRate={goodRate}
          />

          <Separator />

          {/* 탭 */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["items", "checkouts"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-background text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "items" ? `장비 목록 (${totalItems})` : `대여 현황 (${activeCheckoutCount})`}
              </button>
            ))}
          </div>

          {/* 탭 컨텐츠 */}
          {activeTab === "items" && (
            <div className="space-y-3">
              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setShowCheckoutForm(false);
                  }}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  장비 등록
                </Button>
                {totalItems > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      setShowCheckoutForm(!showCheckoutForm);
                      setShowAddForm(false);
                    }}
                  >
                    <ArrowDownToLine className="mr-1 h-3 w-3" />
                    대여 처리
                  </Button>
                )}
              </div>

              {/* 장비 추가 폼 */}
              {showAddForm && (
                <AddItemForm
                  onAdd={addItem}
                  onClose={() => setShowAddForm(false)}
                />
              )}

              {/* 대여 폼 */}
              {showCheckoutForm && (
                <CheckoutForm
                  items={items}
                  onCheckout={checkout}
                  onClose={() => setShowCheckoutForm(false)}
                />
              )}

              {/* 장비 목록 (카테고리별) */}
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
                  <Package className="h-8 w-8 opacity-30" />
                  <p className="text-xs">등록된 장비가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(grouped).map(([cat, catItems]) => (
                    <div key={cat}>
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span className="text-gray-400">
                          {CATEGORY_ICONS[cat] ?? <MoreHorizontal className="h-3 w-3" />}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500">{cat}</span>
                        <span className="text-[10px] text-gray-400">({catItems.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {catItems.map((item) => {
                          const activeCount = getCheckoutsForItem(item.id).filter((c) => !c.returnedAt).length;
                          return (
                            <EquipmentRow
                              key={item.id}
                              item={item}
                              activeCheckoutCount={activeCount}
                              onDelete={() => handleDelete(item)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "checkouts" && (
            <div className="space-y-3">
              {/* 연체 섹션 */}
              {overdueCheckouts.length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-[11px] font-semibold text-red-600">연체 ({overdueCheckouts.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {overdueCheckouts.map((co) => {
                      const itemName = items.find((i) => i.id === co.equipmentId)?.name ?? "알 수 없음";
                      return (
                        <CheckoutItem
                          key={co.id}
                          checkout={co}
                          itemName={itemName}
                          overdue={true}
                          onReturn={() => handleReturn(co.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 정상 대여 섹션 */}
              {activeCheckouts.filter((c) => !isOverdue(c)).length > 0 && (
                <div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-blue-500" />
                    <span className="text-[11px] font-semibold text-gray-600">
                      대여 중 ({activeCheckouts.filter((c) => !isOverdue(c)).length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {activeCheckouts
                      .filter((c) => !isOverdue(c))
                      .map((co) => {
                        const itemName = items.find((i) => i.id === co.equipmentId)?.name ?? "알 수 없음";
                        return (
                          <CheckoutItem
                            key={co.id}
                            checkout={co}
                            itemName={itemName}
                            overdue={false}
                            onReturn={() => handleReturn(co.id)}
                          />
                        );
                      })}
                  </div>
                </div>
              )}

              {/* 반납 완료 (최근 5건) */}
              {(() => {
                const returned = checkouts
                  .filter((c) => !!c.returnedAt)
                  .sort((a, b) => (b.returnedAt ?? "").localeCompare(a.returnedAt ?? ""))
                  .slice(0, 5);
                if (returned.length === 0) return null;
                return (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-gray-400">반납 완료 (최근 {returned.length}건)</span>
                    </div>
                    <div className="space-y-1.5">
                      {returned.map((co) => {
                        const itemName = items.find((i) => i.id === co.equipmentId)?.name ?? "알 수 없음";
                        return (
                          <div
                            key={co.id}
                            className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-[10px] text-gray-400"
                          >
                            <span>{co.borrowerName} · {itemName}</span>
                            <span>반납: {formatYearMonthDay(co.returnedAt!)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {activeCheckouts.length === 0 && checkouts.filter((c) => !!c.returnedAt).length === 0 && (
                <div className="flex flex-col items-center justify-center gap-1 py-8 text-gray-400">
                  <CheckCircle className="h-8 w-8 opacity-30" />
                  <p className="text-xs">대여 기록이 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
