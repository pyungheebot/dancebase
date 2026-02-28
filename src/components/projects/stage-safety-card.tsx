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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ShieldCheck,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  MinusCircle,
  AlertTriangle,
  Zap,
  Building2,
  Flame,
  Ambulance,
  Wrench,
  MoreHorizontal,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStageSafety,
  type CreateInspectionParams,
  type AddCheckItemParams,
} from "@/hooks/use-stage-safety";
import type { SafetyCheckItem, SafetyInspection } from "@/types";

// ============================================================
// 상수 / 레이블
// ============================================================

const CATEGORY_LABELS: Record<SafetyCheckItem["category"], string> = {
  electrical: "전기",
  structural: "구조",
  fire: "화재",
  emergency: "비상",
  equipment: "장비",
  other: "기타",
};

const CATEGORY_ICONS: Record<
  SafetyCheckItem["category"],
  React.ComponentType<{ className?: string }>
> = {
  electrical: Zap,
  structural: Building2,
  fire: Flame,
  emergency: Ambulance,
  equipment: Wrench,
  other: MoreHorizontal,
};

const STATUS_LABELS: Record<SafetyCheckItem["status"], string> = {
  pass: "통과",
  fail: "실패",
  pending: "보류",
  na: "해당없음",
};

const OVERALL_STATUS_LABELS: Record<SafetyInspection["overallStatus"], string> =
  {
    approved: "승인",
    conditional: "조건부 승인",
    rejected: "불승인",
  };

// ============================================================
// 상태 배지
// ============================================================

function ItemStatusBadge({ status }: { status: SafetyCheckItem["status"] }) {
  const configs = {
    pass: {
      className: "bg-green-100 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    fail: {
      className: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    },
    pending: {
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: Clock,
    },
    na: {
      className: "bg-gray-100 text-gray-500 border-gray-200",
      icon: MinusCircle,
    },
  };
  const config = configs[status];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {STATUS_LABELS[status]}
    </span>
  );
}

function OverallStatusBadge({
  status,
}: {
  status: SafetyInspection["overallStatus"];
}) {
  const configs = {
    approved: "bg-green-100 text-green-700 border-green-200",
    conditional: "bg-yellow-100 text-yellow-700 border-yellow-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 ${configs[status]}`}
    >
      {OVERALL_STATUS_LABELS[status]}
    </Badge>
  );
}

// ============================================================
// 점검 항목 행
// ============================================================

function CheckItemRow({
  item,
  onStatusChange,
  onRemove,
}: {
  item: SafetyCheckItem;
  onStatusChange: (status: SafetyCheckItem["status"]) => void;
  onRemove: () => void;
}) {
  const Icon = CATEGORY_ICONS[item.category];
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-background p-2">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug truncate">
          {item.description}
        </p>
        {item.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {item.notes}
          </p>
        )}
        {item.inspectorName && (
          <p className="text-[10px] text-muted-foreground">
            점검자: {item.inspectorName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Select
          value={item.status}
          onValueChange={(v) =>
            onStatusChange(v as SafetyCheckItem["status"])
          }
        >
          <SelectTrigger className="h-6 w-24 text-[10px] px-1.5 border-0 bg-transparent focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pass" className="text-xs">
              통과
            </SelectItem>
            <SelectItem value="fail" className="text-xs">
              실패
            </SelectItem>
            <SelectItem value="pending" className="text-xs">
              보류
            </SelectItem>
            <SelectItem value="na" className="text-xs">
              해당없음
            </SelectItem>
          </SelectContent>
        </Select>
        <ItemStatusBadge status={item.status} />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 점검 기록 카드 (펼치기/접기)
// ============================================================

function InspectionCard({
  inspection,
  onDelete,
  onStatusChange,
  onRemoveItem,
  onAddItem,
  onSetOverall,
}: {
  inspection: SafetyInspection;
  onDelete: () => void;
  onStatusChange: (
    itemId: string,
    status: SafetyCheckItem["status"]
  ) => void;
  onRemoveItem: (itemId: string) => void;
  onAddItem: (params: AddCheckItemParams) => void;
  onSetOverall: (
    status: SafetyInspection["overallStatus"],
    signedBy?: string | null
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // 추가 항목 폼 상태
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] =
    useState<SafetyCheckItem["category"]>("other");
  const [newNotes, setNewNotes] = useState("");
  const [newInspector, setNewInspector] = useState("");

  const totalItems = inspection.items.filter((i) => i.status !== "na").length;
  const passItems = inspection.items.filter((i) => i.status === "pass").length;
  const passRate =
    totalItems === 0 ? 0 : Math.round((passItems / totalItems) * 100);

  // 카테고리별 그룹핑
  const grouped = inspection.items.reduce<
    Partial<Record<SafetyCheckItem["category"], SafetyCheckItem[]>>
  >((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  function handleAddItem() {
    if (!newDesc.trim()) {
      toast.error("점검 내용을 입력해주세요.");
      return;
    }
    onAddItem({
      category: newCategory,
      description: newDesc.trim(),
      status: "pending",
      notes: newNotes.trim() || null,
      inspectorName: newInspector.trim() || null,
    });
    setNewDesc("");
    setNewNotes("");
    setNewInspector("");
    setAddItemOpen(false);
    toast.success("점검 항목이 추가되었습니다.");
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-lg border border-border bg-card">
        {/* 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/40 rounded-t-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium truncate">
                  {inspection.title}
                </span>
                <OverallStatusBadge status={inspection.overallStatus} />
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                <span>{inspection.date}</span>
                {inspection.venue && <span>· {inspection.venue}</span>}
                <span>
                  · 항목 {inspection.items.length}개 / 통과율 {passRate}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
            {/* 통과율 진행률 바 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>통과율</span>
                <span className="font-medium text-foreground">
                  {passItems}/{totalItems} ({passRate}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-300"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            {/* 카테고리별 항목 */}
            {inspection.items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                점검 항목이 없습니다.
              </p>
            ) : (
              <div className="space-y-3">
                {(
                  Object.keys(CATEGORY_LABELS) as SafetyCheckItem["category"][]
                ).map((cat) => {
                  const items = grouped[cat];
                  if (!items || items.length === 0) return null;
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {CATEGORY_LABELS[cat]}
                        </span>
                      </div>
                      <div className="space-y-1 pl-4">
                        {items.map((item) => (
                          <CheckItemRow
                            key={item.id}
                            item={item}
                            onStatusChange={(status) =>
                              onStatusChange(item.id, status)
                            }
                            onRemove={() => onRemoveItem(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 항목 추가 폼 */}
            {addItemOpen && (
              <div className="rounded-md border border-dashed border-border p-3 space-y-2 bg-muted/30">
                <p className="text-xs font-medium">새 점검 항목</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">카테고리</Label>
                    <Select
                      value={newCategory}
                      onValueChange={(v) =>
                        setNewCategory(v as SafetyCheckItem["category"])
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(
                            CATEGORY_LABELS
                          ) as [SafetyCheckItem["category"], string][]
                        ).map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">점검자</Label>
                    <Input
                      className="h-7 text-xs"
                      placeholder="홍길동"
                      value={newInspector}
                      onChange={(e) => setNewInspector(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">점검 내용 *</Label>
                  <Input
                    className="h-7 text-xs"
                    placeholder="예: 전기 배선 상태 확인"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">비고</Label>
                  <Input
                    className="h-7 text-xs"
                    placeholder="추가 메모"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setAddItemOpen(false)}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleAddItem}
                  >
                    추가
                  </Button>
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              {!addItemOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setAddItemOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  항목 추가
                </Button>
              )}

              {/* 전체 결과 변경 */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-muted-foreground">
                  전체 결과:
                </span>
                <Select
                  value={inspection.overallStatus}
                  onValueChange={(v) =>
                    onSetOverall(v as SafetyInspection["overallStatus"])
                  }
                >
                  <SelectTrigger className="h-6 w-28 text-[10px] px-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved" className="text-xs">
                      승인
                    </SelectItem>
                    <SelectItem value="conditional" className="text-xs">
                      조건부 승인
                    </SelectItem>
                    <SelectItem value="rejected" className="text-xs">
                      불승인
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 서명자 */}
            {inspection.signedBy && (
              <p className="text-[10px] text-muted-foreground">
                서명자: {inspection.signedBy}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 점검 생성 다이얼로그
// ============================================================

function CreateInspectionDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (params: CreateInspectionParams) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [venue, setVenue] = useState("");
  const [signedBy, setSignedBy] = useState("");

  // 초기 항목 (빠른 추가용)
  const [quickItems, setQuickItems] = useState<
    { desc: string; category: SafetyCheckItem["category"] }[]
  >([]);
  const [quickDesc, setQuickDesc] = useState("");
  const [quickCat, setQuickCat] =
    useState<SafetyCheckItem["category"]>("other");

  function reset() {
    setTitle("");
    setDate(today);
    setVenue("");
    setSignedBy("");
    setQuickItems([]);
    setQuickDesc("");
    setQuickCat("other");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function addQuickItem() {
    if (!quickDesc.trim()) return;
    setQuickItems((prev) => [
      ...prev,
      { desc: quickDesc.trim(), category: quickCat },
    ]);
    setQuickDesc("");
  }

  function removeQuickItem(idx: number) {
    setQuickItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleCreate() {
    if (!title.trim()) {
      toast.error("점검 제목을 입력해주세요.");
      return;
    }
    if (!date) {
      toast.error("점검 일자를 선택해주세요.");
      return;
    }
    onCreate({
      title: title.trim(),
      date,
      venue: venue.trim() || null,
      items: quickItems.map((qi) => ({
        category: qi.category,
        description: qi.desc,
        status: "pending",
        notes: null,
        inspectorName: signedBy.trim() || null,
      })),
    });
    toast.success("점검 기록이 생성되었습니다.");
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">새 안전 점검 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">점검 제목 *</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 2024 봄 공연 사전 안전 점검"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">점검 일자 *</Label>
              <Input
                type="date"
                className="h-8 text-xs"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">공연장</Label>
              <Input
                className="h-8 text-xs"
                placeholder="예: OO 아트홀"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">점검자/서명자</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 홍길동"
              value={signedBy}
              onChange={(e) => setSignedBy(e.target.value)}
            />
          </div>

          {/* 초기 항목 빠른 추가 */}
          <div className="space-y-2">
            <Label className="text-xs">초기 점검 항목 (선택)</Label>
            <div className="flex gap-1">
              <Select
                value={quickCat}
                onValueChange={(v) =>
                  setQuickCat(v as SafetyCheckItem["category"])
                }
              >
                <SelectTrigger className="h-7 w-24 text-xs shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(
                      CATEGORY_LABELS
                    ) as [SafetyCheckItem["category"], string][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-7 text-xs flex-1"
                placeholder="점검 항목 내용"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addQuickItem()}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 shrink-0"
                onClick={addQuickItem}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {quickItems.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {quickItems.map((qi, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 text-xs bg-muted/50 rounded px-2 py-1"
                  >
                    <span className="text-[10px] text-muted-foreground w-8 shrink-0">
                      {CATEGORY_LABELS[qi.category]}
                    </span>
                    <span className="flex-1 truncate">{qi.desc}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => removeQuickItem(idx)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleCreate}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 메인 카드
// ============================================================

export function StageSafetyCard({ projectId }: { projectId: string }) {
  const {
    safetyData,
    loading,
    createInspection,
    deleteInspection,
    addCheckItem,
    updateCheckItem,
    removeCheckItem,
    setOverallStatus,
    totalInspections,
    passRate,
    pendingItems,
  } = useStageSafety(projectId);

  const [createOpen, setCreateOpen] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            무대 안전 점검
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  const inspections = safetyData.inspections;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              무대 안전 점검
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              점검 생성
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 통계 요약 */}
          {totalInspections > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-lg font-bold text-foreground">
                  {totalInspections}
                </p>
                <p className="text-[10px] text-muted-foreground">총 점검</p>
              </div>
              <div className="rounded-md bg-green-50 p-2 text-center">
                <p className="text-lg font-bold text-green-600">{passRate}%</p>
                <p className="text-[10px] text-muted-foreground">통과율</p>
              </div>
              <div className="rounded-md bg-yellow-50 p-2 text-center">
                <p className="text-lg font-bold text-yellow-600">
                  {pendingItems}
                </p>
                <p className="text-[10px] text-muted-foreground">보류 항목</p>
              </div>
            </div>
          )}

          {/* 전체 통과율 바 */}
          {totalInspections > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>전체 통과율</span>
                <span className="font-medium text-foreground">{passRate}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${passRate}%`,
                    backgroundColor:
                      passRate >= 80
                        ? "#22c55e"
                        : passRate >= 50
                        ? "#eab308"
                        : "#ef4444",
                  }}
                />
              </div>
            </div>
          )}

          {/* 점검 목록 */}
          {inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <FileCheck className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                점검 기록이 없습니다
              </p>
              <p className="text-xs text-muted-foreground/70">
                공연 전 안전 점검을 생성하고 항목별로 결과를 기록하세요.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs mt-1"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 점검 생성
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {inspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  onDelete={() => {
                    deleteInspection(inspection.id);
                    toast.success("점검 기록이 삭제되었습니다.");
                  }}
                  onStatusChange={(itemId, status) => {
                    updateCheckItem(inspection.id, itemId, { status });
                  }}
                  onRemoveItem={(itemId) => {
                    removeCheckItem(inspection.id, itemId);
                    toast.success("항목이 삭제되었습니다.");
                  }}
                  onAddItem={(params) => {
                    addCheckItem(inspection.id, params);
                  }}
                  onSetOverall={(status, signedBy) => {
                    setOverallStatus(inspection.id, status, signedBy);
                    toast.success("전체 결과가 업데이트되었습니다.");
                  }}
                />
              ))}
            </div>
          )}

          {/* 경고: 보류 항목 있을 시 */}
          {pendingItems > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
              <p className="text-xs text-yellow-700">
                보류 중인 점검 항목이 {pendingItems}개 있습니다. 공연 전에
                확인하세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateInspectionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={createInspection}
      />
    </>
  );
}
