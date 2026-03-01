"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  UtensilsCrossed,
  Clock,
  Users,
  MapPin,
  Building2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useCatering } from "@/hooks/use-catering";
import type {
  CateringEntry,
  CateringMealType,
  CateringDietaryRestriction,
  CateringStatus,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const MEAL_TYPE_LABELS: Record<CateringMealType, string> = {
  breakfast: "아침",
  lunch: "점심",
  dinner: "저녁",
  snack: "간식",
  beverage: "음료",
};

const MEAL_TYPE_COLORS: Record<CateringMealType, string> = {
  breakfast: "bg-yellow-100 text-yellow-800",
  lunch: "bg-orange-100 text-orange-800",
  dinner: "bg-purple-100 text-purple-800",
  snack: "bg-green-100 text-green-800",
  beverage: "bg-cyan-100 text-cyan-800",
};

const STATUS_LABELS: Record<CateringStatus, string> = {
  pending: "예약중",
  confirmed: "확정",
  delivering: "배달중",
  delivered: "완료",
  cancelled: "취소",
};

const STATUS_COLORS: Record<CateringStatus, string> = {
  pending: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  delivering: "bg-yellow-100 text-yellow-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const DIETARY_LABELS: Record<CateringDietaryRestriction, string> = {
  none: "제한 없음",
  vegetarian: "채식",
  vegan: "비건",
  halal: "할랄",
  kosher: "코셔",
  gluten_free: "글루텐 프리",
  nut_allergy: "견과류 알레르기",
  dairy_free: "유제품 프리",
  seafood_allergy: "해산물 알레르기",
  other: "기타",
};

const ALL_MEAL_TYPES: CateringMealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "beverage",
];

const ALL_STATUSES: CateringStatus[] = [
  "pending",
  "confirmed",
  "delivering",
  "delivered",
  "cancelled",
];

const ALL_DIETARY_RESTRICTIONS: CateringDietaryRestriction[] = [
  "none",
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten_free",
  "nut_allergy",
  "dairy_free",
  "seafood_allergy",
  "other",
];

// ============================================================
// 폼 기본값
// ============================================================

const EMPTY_FORM = {
  mealType: "lunch" as CateringMealType,
  mealTime: "",
  menuDescription: "",
  headcount: 1,
  dietaryRestrictions: [] as CateringDietaryRestriction[],
  dietaryNotes: "",
  vendorName: "",
  vendorContact: "",
  totalCost: "",
  deliveryTime: "",
  deliveryLocation: "",
  notes: "",
};

type FormState = typeof EMPTY_FORM;

// ============================================================
// 금액 포맷
// ============================================================

function formatCost(cost: number): string {
  return cost.toLocaleString("ko-KR") + "원";
}

// ============================================================
// 엔트리 폼 다이얼로그
// ============================================================

function EntryFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  title,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  initialData?: FormState;
  title: string;
}) {
  const [form, setForm] = useState<FormState>(initialData ?? EMPTY_FORM);

  const handleDietaryToggle = (value: CateringDietaryRestriction) => {
    setForm((prev) => {
      const current = prev.dietaryRestrictions;
      if (value === "none") {
        return { ...prev, dietaryRestrictions: ["none"] };
      }
      const withoutNone = current.filter((d) => d !== "none");
      if (withoutNone.includes(value)) {
        const next = withoutNone.filter((d) => d !== value);
        return { ...prev, dietaryRestrictions: next.length === 0 ? ["none"] : next };
      }
      return { ...prev, dietaryRestrictions: [...withoutNone, value] };
    });
  };

  const handleSubmit = () => {
    if (!form.mealTime.trim()) {
      toast.error(TOAST.CATERING.TIME_REQUIRED);
      return;
    }
    if (!form.menuDescription.trim()) {
      toast.error(TOAST.CATERING.MENU_REQUIRED);
      return;
    }
    if (form.headcount < 1) {
      toast.error(TOAST.CATERING.HEADCOUNT_REQUIRED);
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 식사 유형 */}
          <div className="space-y-1">
            <Label className="text-xs">식사 유형</Label>
            <Select
              value={form.mealType}
              onValueChange={(v) => setForm({ ...form, mealType: v as CateringMealType })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_MEAL_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {MEAL_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 식사 시간 */}
          <div className="space-y-1">
            <Label className="text-xs">식사 시간 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 12:00"
              value={form.mealTime}
              onChange={(e) => setForm({ ...form, mealTime: e.target.value })}
            />
          </div>

          {/* 메뉴 설명 */}
          <div className="space-y-1">
            <Label className="text-xs">메뉴 설명 *</Label>
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder="메뉴 내용을 입력하세요"
              value={form.menuDescription}
              onChange={(e) => setForm({ ...form, menuDescription: e.target.value })}
            />
          </div>

          {/* 인원 수 */}
          <div className="space-y-1">
            <Label className="text-xs">인원 수 *</Label>
            <Input
              type="number"
              min={1}
              className="h-8 text-xs"
              placeholder="예: 20"
              value={form.headcount}
              onChange={(e) =>
                setForm({ ...form, headcount: Math.max(1, parseInt(e.target.value) || 1) })
              }
            />
          </div>

          {/* 식이 제한 */}
          <div className="space-y-1">
            <Label className="text-xs">식이 제한</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DIETARY_RESTRICTIONS.map((d) => {
                const selected = form.dietaryRestrictions.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDietaryToggle(d)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-background text-gray-600 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {DIETARY_LABELS[d]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 식이 제한 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">식이 제한 상세 메모</Label>
            <Input
              className="h-8 text-xs"
              placeholder="알레르기 정보 등 상세 내용"
              value={form.dietaryNotes}
              onChange={(e) => setForm({ ...form, dietaryNotes: e.target.value })}
            />
          </div>

          {/* 업체 정보 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">업체명</Label>
              <Input
                className="h-8 text-xs"
                placeholder="업체명"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">업체 연락처</Label>
              <Input
                className="h-8 text-xs"
                placeholder="전화번호"
                value={form.vendorContact}
                onChange={(e) => setForm({ ...form, vendorContact: e.target.value })}
              />
            </div>
          </div>

          {/* 비용 */}
          <div className="space-y-1">
            <Label className="text-xs">총 비용 (원)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 text-xs"
              placeholder="예: 150000"
              value={form.totalCost}
              onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
            />
          </div>

          {/* 배달 정보 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">배달 예정 시간</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 11:30"
                value={form.deliveryTime}
                onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">배치 장소</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: 무대 뒤편 로비"
                value={form.deliveryLocation}
                onChange={(e) => setForm({ ...form, deliveryLocation: e.target.value })}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs">추가 메모</Label>
            <Textarea
              className="text-xs min-h-[60px]"
              placeholder="특이사항 등"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 엔트리 행
// ============================================================

function EntryRow({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  entry: CateringEntry;
  onEdit: (entry: CateringEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: CateringStatus) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`text-[10px] px-1.5 py-0 ${MEAL_TYPE_COLORS[entry.mealType]}`}>
            {MEAL_TYPE_LABELS[entry.mealType]}
          </Badge>
          <span className="text-xs font-medium text-gray-800">{entry.menuDescription}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(entry)}
          >
            <Pencil className="h-3 w-3 text-gray-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onDelete(entry.id)}
          >
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" />
          {entry.mealTime}
          {entry.deliveryTime && ` (배달: ${entry.deliveryTime})`}
        </span>
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {entry.headcount}명
        </span>
        {entry.deliveryLocation && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" />
            {entry.deliveryLocation}
          </span>
        )}
        {entry.vendorName && (
          <span className="flex items-center gap-0.5">
            <Building2 className="h-3 w-3" />
            {entry.vendorName}
            {entry.vendorContact && ` · ${entry.vendorContact}`}
          </span>
        )}
        {entry.totalCost !== undefined && (
          <span className="font-medium text-gray-700">
            {formatCost(entry.totalCost)}
          </span>
        )}
      </div>

      {/* 식이 제한 배지 */}
      {entry.dietaryRestrictions.length > 0 &&
        !(entry.dietaryRestrictions.length === 1 && entry.dietaryRestrictions[0] === "none") && (
          <div className="flex flex-wrap gap-1">
            {entry.dietaryRestrictions.map((d) => (
              <span
                key={d}
                className="text-[10px] px-1.5 py-0 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                {DIETARY_LABELS[d]}
              </span>
            ))}
            {entry.dietaryNotes && (
              <span className="text-[10px] text-gray-400 italic">
                {entry.dietaryNotes}
              </span>
            )}
          </div>
        )}

      {/* 메모 */}
      {entry.notes && (
        <p className="text-[11px] text-gray-400 italic">{entry.notes}</p>
      )}

      {/* 상태 선택 */}
      <div className="flex items-center gap-2 pt-0.5">
        <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[entry.status]}`}>
          {STATUS_LABELS[entry.status]}
        </Badge>
        <Select
          value={entry.status}
          onValueChange={(v) => onStatusChange(entry.id, v as CateringStatus)}
        >
          <SelectTrigger className="h-6 text-[10px] w-24 px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface CateringCardProps {
  groupId: string;
  projectId: string;
}

export function CateringCard({ groupId, projectId }: CateringCardProps) {
  const { entries, loading, addEntry, updateEntry, updateStatus, deleteEntry, stats } =
    useCatering(groupId, projectId);

  const [open, setOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CateringEntry | null>(null);

  // 필터 상태
  const [filterMealType, setFilterMealType] = useState<CateringMealType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<CateringStatus | "all">("all");

  const filteredEntries = entries.filter((e) => {
    if (filterMealType !== "all" && e.mealType !== filterMealType) return false;
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    return true;
  });

  const handleAdd = (form: FormState) => {
    addEntry({
      mealType: form.mealType,
      mealTime: form.mealTime,
      menuDescription: form.menuDescription,
      headcount: form.headcount,
      dietaryRestrictions:
        form.dietaryRestrictions.length === 0 ? ["none"] : form.dietaryRestrictions,
      dietaryNotes: form.dietaryNotes || undefined,
      vendorName: form.vendorName || undefined,
      vendorContact: form.vendorContact || undefined,
      totalCost: form.totalCost ? parseFloat(form.totalCost) : undefined,
      deliveryTime: form.deliveryTime || undefined,
      deliveryLocation: form.deliveryLocation || undefined,
      notes: form.notes || undefined,
    });
    toast.success(TOAST.CATERING.ITEM_ADDED);
    setAddDialogOpen(false);
  };

  const handleEdit = (form: FormState) => {
    if (!editTarget) return;
    const ok = updateEntry(editTarget.id, {
      mealType: form.mealType,
      mealTime: form.mealTime,
      menuDescription: form.menuDescription,
      headcount: form.headcount,
      dietaryRestrictions:
        form.dietaryRestrictions.length === 0 ? ["none"] : form.dietaryRestrictions,
      dietaryNotes: form.dietaryNotes || undefined,
      vendorName: form.vendorName || undefined,
      vendorContact: form.vendorContact || undefined,
      totalCost: form.totalCost ? parseFloat(form.totalCost) : undefined,
      deliveryTime: form.deliveryTime || undefined,
      deliveryLocation: form.deliveryLocation || undefined,
      notes: form.notes || undefined,
    });
    if (ok) {
      toast.success(TOAST.CATERING.ITEM_UPDATED);
    } else {
      toast.error(TOAST.UPDATE_ERROR);
    }
    setEditTarget(null);
  };

  const handleDelete = (id: string) => {
    const ok = deleteEntry(id);
    if (ok) {
      toast.success(TOAST.ITEM_DELETED);
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  const handleStatusChange = (id: string, status: CateringStatus) => {
    const ok = updateStatus(id, status);
    if (ok) {
      toast.success(`상태가 "${STATUS_LABELS[status]}"(으)로 변경되었습니다.`);
    } else {
      toast.error(TOAST.STATUS_ERROR);
    }
  };

  const toFormState = (entry: CateringEntry): FormState => ({
    mealType: entry.mealType,
    mealTime: entry.mealTime,
    menuDescription: entry.menuDescription,
    headcount: entry.headcount,
    dietaryRestrictions: entry.dietaryRestrictions,
    dietaryNotes: entry.dietaryNotes ?? "",
    vendorName: entry.vendorName ?? "",
    vendorContact: entry.vendorContact ?? "",
    totalCost: entry.totalCost !== undefined ? String(entry.totalCost) : "",
    deliveryTime: entry.deliveryTime ?? "",
    deliveryLocation: entry.deliveryLocation ?? "",
    notes: entry.notes ?? "",
  });

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="border shadow-sm">
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 text-left flex-1 min-w-0">
                  <UtensilsCrossed className="h-4 w-4 text-orange-500 shrink-0" />
                  <CardTitle className="text-sm font-semibold text-gray-800">
                    케이터링 관리
                  </CardTitle>
                  {entries.length > 0 && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 ml-1">
                      {entries.length}건
                    </Badge>
                  )}
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400 ml-auto" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 ml-auto" />
                  )}
                </button>
              </CollapsibleTrigger>
              <Button
                size="sm"
                className="h-7 text-xs ml-2 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setAddDialogOpen(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                추가
              </Button>
            </div>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 space-y-3">
              {/* 통계 요약 */}
              {entries.length > 0 && (
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-gray-50 border text-center">
                  <div>
                    <p className="text-[10px] text-gray-500">총 항목</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.totalCount}건</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">총 인원</p>
                    <p className="text-sm font-semibold text-gray-800">{stats.totalHeadcount}명</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">총 비용</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {stats.totalCost > 0 ? formatCost(stats.totalCost) : "-"}
                    </p>
                  </div>
                </div>
              )}

              {/* 상태 요약 배지 */}
              {entries.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {ALL_STATUSES.map((s) => {
                    const count = stats.statusCounts[s];
                    if (count === 0) return null;
                    return (
                      <span
                        key={s}
                        className={`text-[10px] px-1.5 py-0 rounded-full ${STATUS_COLORS[s]}`}
                      >
                        {STATUS_LABELS[s]} {count}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* 필터 */}
              {entries.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={filterMealType}
                    onValueChange={(v) =>
                      setFilterMealType(v as CateringMealType | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue placeholder="식사 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">전체 유형</SelectItem>
                      {ALL_MEAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {MEAL_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filterStatus}
                    onValueChange={(v) =>
                      setFilterStatus(v as CateringStatus | "all")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-24">
                      <SelectValue placeholder="상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">전체 상태</SelectItem>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(filterMealType !== "all" || filterStatus !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-gray-400 px-2"
                      onClick={() => {
                        setFilterMealType("all");
                        setFilterStatus("all");
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      필터 초기화
                    </Button>
                  )}
                </div>
              )}

              {/* 목록 */}
              {loading ? (
                <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
              ) : filteredEntries.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {entries.length === 0
                    ? "등록된 케이터링 항목이 없습니다."
                    : "해당 조건의 항목이 없습니다."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredEntries.map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      onEdit={(e) => setEditTarget(e)}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 추가 다이얼로그 */}
      <EntryFormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAdd}
        title="케이터링 항목 추가"
      />

      {/* 수정 다이얼로그 */}
      {editTarget && (
        <EntryFormDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          initialData={toFormState(editTarget)}
          title="케이터링 항목 수정"
        />
      )}
    </>
  );
}
