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
  Paintbrush,
  Clock,
  User,
  UserPlus,
  X,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useMakeupSheet } from "@/hooks/use-makeup-sheet";
import type { MakeupSheetArea, MakeupSheetLook, MakeupSheetProduct } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const AREA_LABELS: Record<MakeupSheetArea, string> = {
  base: "베이스",
  eyes: "눈",
  lips: "입술",
  cheeks: "볼",
  brows: "눈썹",
  special_effects: "특수효과",
};

const AREA_COLORS: Record<MakeupSheetArea, string> = {
  base: "bg-amber-50 border-amber-200",
  eyes: "bg-purple-50 border-purple-200",
  lips: "bg-rose-50 border-rose-200",
  cheeks: "bg-pink-50 border-pink-200",
  brows: "bg-stone-50 border-stone-200",
  special_effects: "bg-cyan-50 border-cyan-200",
};

const AREA_BADGE_COLORS: Record<MakeupSheetArea, string> = {
  base: "bg-amber-100 text-amber-700 border-amber-200",
  eyes: "bg-purple-100 text-purple-700 border-purple-200",
  lips: "bg-rose-100 text-rose-700 border-rose-200",
  cheeks: "bg-pink-100 text-pink-700 border-pink-200",
  brows: "bg-stone-100 text-stone-700 border-stone-200",
  special_effects: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const ALL_AREAS: MakeupSheetArea[] = [
  "base",
  "eyes",
  "lips",
  "cheeks",
  "brows",
  "special_effects",
];

// ============================================================
// 제품 추가/편집 다이얼로그
// ============================================================

interface ProductDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<MakeupSheetProduct, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<MakeupSheetProduct, "id">) => void;
}

function ProductDialog({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: ProductDialogProps) {
  const [area, setArea] = useState<MakeupSheetArea>(
    initial?.area ?? "base"
  );
  const [productName, setProductName] = useState(initial?.productName ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [colorCode, setColorCode] = useState(initial?.colorCode ?? "");
  const [technique, setTechnique] = useState(initial?.technique ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!productName.trim()) {
      toast.error("제품명을 입력해주세요.");
      return;
    }
    onSubmit({
      area,
      productName: productName.trim(),
      brand: brand.trim() || undefined,
      colorCode: colorCode.trim() || undefined,
      technique: technique.trim() || undefined,
      order: parseInt(order, 10) || 0,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "제품 추가" : "제품 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 부위 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">부위</Label>
            <Select
              value={area}
              onValueChange={(v) => setArea(v as MakeupSheetArea)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_AREAS.map((a) => (
                  <SelectItem key={a} value={a} className="text-xs">
                    {AREA_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제품명 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">제품명</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 세럼 파운데이션 N23"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          {/* 브랜드 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">브랜드 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 맥, 나스, 에뛰드"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          {/* 색상코드 + 순서 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">색상 코드 (선택)</Label>
              <div className="flex items-center gap-1.5">
                {colorCode && /^#[0-9A-Fa-f]{3,6}$/.test(colorCode) && (
                  <span
                    className="inline-block w-5 h-5 rounded border border-border flex-shrink-0"
                    style={{ backgroundColor: colorCode }}
                  />
                )}
                <Input
                  className="h-8 text-xs"
                  placeholder="#FF6B6B"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">순서</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                min={0}
                placeholder="0"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>

          {/* 기법 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">기법 (선택)</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 가볍게 두드려 밀착, 스모키 블렌딩"
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
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
// 룩 추가/편집 다이얼로그
// ============================================================

interface LookDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<
    Pick<MakeupSheetLook, "lookName" | "performanceName" | "notes" | "estimatedMinutes">
  >;
  onClose: () => void;
  onSubmit: (
    data: Pick<MakeupSheetLook, "lookName" | "performanceName"> &
      Partial<Pick<MakeupSheetLook, "notes" | "estimatedMinutes">>
  ) => void;
}

function LookDialog({ open, mode, initial, onClose, onSubmit }: LookDialogProps) {
  const [lookName, setLookName] = useState(initial?.lookName ?? "");
  const [performanceName, setPerformanceName] = useState(
    initial?.performanceName ?? ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    String(initial?.estimatedMinutes ?? "")
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = () => {
    if (!lookName.trim()) {
      toast.error("룩 이름을 입력해주세요.");
      return;
    }
    if (!performanceName.trim()) {
      toast.error("공연 이름을 입력해주세요.");
      return;
    }
    onSubmit({
      lookName: lookName.trim(),
      performanceName: performanceName.trim(),
      notes: notes.trim() || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "add" ? "룩 추가" : "룩 편집"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* 룩 이름 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">룩 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 무대 메인 룩, 커튼콜 룩"
              value={lookName}
              onChange={(e) => setLookName(e.target.value)}
            />
          </div>

          {/* 공연 이름 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">공연 이름</Label>
            <Input
              className="h-8 text-xs"
              placeholder="예: 2024 봄 정기공연"
              value={performanceName}
              onChange={(e) => setPerformanceName(e.target.value)}
            />
          </div>

          {/* 예상 소요시간 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              예상 소요시간 (분, 선택)
            </Label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={1}
              placeholder="예: 30"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모 (선택)</Label>
            <Textarea
              className="text-xs min-h-[56px] resize-none"
              placeholder="특이사항 또는 주의사항 입력"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
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
// 부위별 제품 섹션
// ============================================================

interface AreaSectionProps {
  area: MakeupSheetArea;
  products: MakeupSheetProduct[];
  onAddProduct: () => void;
  onEditProduct: (product: MakeupSheetProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

function AreaSection({
  area,
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: AreaSectionProps) {
  const sorted = [...products].sort((a, b) => a.order - b.order);

  return (
    <div className={`rounded-md border p-2.5 ${AREA_COLORS[area]}`}>
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 ${AREA_BADGE_COLORS[area]}`}
        >
          {AREA_LABELS[area]}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
          onClick={onAddProduct}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          제품 추가
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[10px] text-muted-foreground py-1">
          등록된 제품이 없습니다.
        </p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-2 bg-card/70 rounded px-2 py-1.5 group"
            >
              {/* 색상 칩 */}
              <div className="flex-shrink-0 mt-0.5">
                {product.colorCode &&
                /^#[0-9A-Fa-f]{3,6}$/.test(product.colorCode) ? (
                  <span
                    className="inline-block w-3.5 h-3.5 rounded-full border border-border"
                    style={{ backgroundColor: product.colorCode }}
                    title={product.colorCode}
                  />
                ) : (
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-muted border border-border" />
                )}
              </div>

              {/* 제품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">
                    {product.productName}
                  </span>
                  {product.brand && (
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {product.brand}
                    </span>
                  )}
                </div>
                {product.technique && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    기법: {product.technique}
                  </p>
                )}
              </div>

              {/* 순서 표시 */}
              <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                #{product.order + 1}
              </span>

              {/* 액션 버튼 */}
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => onEditProduct(product)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                  onClick={() => onDeleteProduct(product.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

interface MakeupSheetCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}

export function MakeupSheetCard({
  groupId,
  projectId,
  memberNames = [],
}: MakeupSheetCardProps) {
  const {
    looks,
    loading,
    addLook,
    updateLook,
    deleteLook,
    addProduct,
    updateProduct,
    deleteProduct,
    assignMember,
    unassignMember,
    stats,
  } = useMakeupSheet(groupId, projectId);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

  // 룩 다이얼로그 상태
  const [lookDialogOpen, setLookDialogOpen] = useState(false);
  const [lookDialogMode, setLookDialogMode] = useState<"add" | "edit">("add");
  const [editingLook, setEditingLook] = useState<MakeupSheetLook | null>(null);

  // 제품 다이얼로그 상태
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogMode, setProductDialogMode] = useState<"add" | "edit">("add");
  const [productDialogArea, setProductDialogArea] = useState<MakeupSheetArea>("base");
  const [editingProduct, setEditingProduct] = useState<MakeupSheetProduct | null>(null);

  // 멤버 추가 입력 상태
  const [memberInput, setMemberInput] = useState("");

  // 선택된 룩
  const selectedLook = useMemo(
    () => looks.find((l) => l.id === selectedLookId) ?? looks[0] ?? null,
    [looks, selectedLookId]
  );

  // 선택된 룩이 삭제되면 첫 번째 룩으로 이동
  const effectiveLook =
    selectedLook ?? (looks.length > 0 ? looks[0] : null);

  // ── 룩 핸들러 ─────────────────────────────────────────────

  const handleAddLookOpen = () => {
    setEditingLook(null);
    setLookDialogMode("add");
    setLookDialogOpen(true);
  };

  const handleEditLookOpen = (look: MakeupSheetLook) => {
    setEditingLook(look);
    setLookDialogMode("edit");
    setLookDialogOpen(true);
  };

  const handleLookSubmit = (
    data: Pick<MakeupSheetLook, "lookName" | "performanceName"> &
      Partial<Pick<MakeupSheetLook, "notes" | "estimatedMinutes">>
  ) => {
    if (lookDialogMode === "add") {
      const newLook = addLook(data);
      setSelectedLookId(newLook.id);
      toast.success("룩이 추가되었습니다.");
    } else if (editingLook) {
      updateLook(editingLook.id, data);
      toast.success("룩이 수정되었습니다.");
    }
  };

  const handleDeleteLook = (lookId: string) => {
    deleteLook(lookId);
    if (selectedLookId === lookId) {
      setSelectedLookId(null);
    }
    toast.success("룩이 삭제되었습니다.");
  };

  // ── 제품 핸들러 ───────────────────────────────────────────

  const handleAddProductOpen = (area: MakeupSheetArea) => {
    setEditingProduct(null);
    setProductDialogArea(area);
    setProductDialogMode("add");
    setProductDialogOpen(true);
  };

  const handleEditProductOpen = (product: MakeupSheetProduct) => {
    setEditingProduct(product);
    setProductDialogArea(product.area);
    setProductDialogMode("edit");
    setProductDialogOpen(true);
  };

  const handleProductSubmit = (data: Omit<MakeupSheetProduct, "id">) => {
    if (!effectiveLook) return;

    if (productDialogMode === "add") {
      addProduct(effectiveLook.id, data);
      toast.success("제품이 추가되었습니다.");
    } else if (editingProduct) {
      updateProduct(effectiveLook.id, editingProduct.id, data);
      toast.success("제품이 수정되었습니다.");
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (!effectiveLook) return;
    deleteProduct(effectiveLook.id, productId);
    toast.success("제품이 삭제되었습니다.");
  };

  // ── 멤버 핸들러 ───────────────────────────────────────────

  const handleAssignMember = (memberName: string) => {
    if (!effectiveLook) return;
    const trimmed = memberName.trim();
    if (!trimmed) return;
    const ok = assignMember(effectiveLook.id, trimmed);
    if (!ok) {
      toast.error("이미 배정된 멤버입니다.");
    } else {
      toast.success(`${trimmed} 멤버가 배정되었습니다.`);
    }
    setMemberInput("");
  };

  const handleUnassignMember = (memberName: string) => {
    if (!effectiveLook) return;
    unassignMember(effectiveLook.id, memberName);
    toast.success(`${memberName} 멤버 배정이 해제되었습니다.`);
  };

  // 현재 룩에 배정되지 않은 멤버 목록 (빠른 추가용)
  const unassignedMembers = useMemo(() => {
    if (!effectiveLook) return memberNames;
    return memberNames.filter(
      (m) => !effectiveLook.assignedMembers.includes(m)
    );
  }, [memberNames, effectiveLook]);

  // 부위별 제품 분류
  const productsByArea = useMemo(() => {
    if (!effectiveLook) return {} as Record<MakeupSheetArea, MakeupSheetProduct[]>;
    return ALL_AREAS.reduce(
      (acc, area) => {
        acc[area] = effectiveLook.products.filter((p) => p.area === area);
        return acc;
      },
      {} as Record<MakeupSheetArea, MakeupSheetProduct[]>
    );
  }, [effectiveLook]);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Paintbrush className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-sm font-semibold">
                    공연 메이크업 시트
                  </CardTitle>
                  {stats.totalLooks > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 bg-rose-50 text-rose-600 border-rose-200"
                    >
                      {stats.totalLooks}개 룩
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {stats.totalProducts > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      제품 {stats.totalProducts}개
                    </span>
                  )}
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2">불러오는 중...</p>
              ) : (
                <>
                  {/* 룩 탭 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {looks.map((look) => (
                      <button
                        key={look.id}
                        onClick={() => setSelectedLookId(look.id)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          effectiveLook?.id === look.id
                            ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-3 w-3" />
                        {look.lookName}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 rounded-full"
                      onClick={handleAddLookOpen}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      룩 추가
                    </Button>
                  </div>

                  {/* 선택된 룩 상세 */}
                  {effectiveLook ? (
                    <div className="space-y-3">
                      {/* 룩 헤더 */}
                      <div className="flex items-start justify-between gap-2 p-2.5 rounded-md bg-muted/40 border">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium">
                              {effectiveLook.lookName}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {effectiveLook.performanceName}
                            </Badge>
                            {effectiveLook.estimatedMinutes && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {effectiveLook.estimatedMinutes}분
                              </span>
                            )}
                          </div>
                          {effectiveLook.notes && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {effectiveLook.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditLookOpen(effectiveLook)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteLook(effectiveLook.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* 배정된 멤버 */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">배정 멤버</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {effectiveLook.assignedMembers.map((member) => (
                            <span
                              key={member}
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5"
                            >
                              {member}
                              <button
                                onClick={() => handleUnassignMember(member)}
                                className="hover:text-destructive transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                          {effectiveLook.assignedMembers.length === 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              배정된 멤버 없음
                            </span>
                          )}
                        </div>

                        {/* 멤버 추가 */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {/* 기존 멤버 빠른 추가 */}
                          {unassignedMembers.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {unassignedMembers.map((m) => (
                                <button
                                  key={m}
                                  onClick={() => handleAssignMember(m)}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border border-dashed border-border rounded-full px-2 py-0.5 hover:bg-muted transition-colors"
                                >
                                  <UserPlus className="h-2.5 w-2.5" />
                                  {m}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* 직접 입력 */}
                          <div className="flex items-center gap-1">
                            <Input
                              className="h-6 text-[10px] px-2 w-24"
                              placeholder="이름 직접입력"
                              value={memberInput}
                              onChange={(e) => setMemberInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAssignMember(memberInput);
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5"
                              onClick={() => handleAssignMember(memberInput)}
                            >
                              추가
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 부위별 섹션 */}
                      <div className="space-y-2">
                        {ALL_AREAS.map((area) => (
                          <AreaSection
                            key={area}
                            area={area}
                            products={productsByArea[area] ?? []}
                            onAddProduct={() => handleAddProductOpen(area)}
                            onEditProduct={handleEditProductOpen}
                            onDeleteProduct={handleDeleteProduct}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-1">
                      <Paintbrush className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-xs text-muted-foreground">
                        룩을 추가하여 메이크업 시트를 관리하세요.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* 룩 다이얼로그 */}
      <LookDialog
        open={lookDialogOpen}
        mode={lookDialogMode}
        initial={
          editingLook
            ? {
                lookName: editingLook.lookName,
                performanceName: editingLook.performanceName,
                notes: editingLook.notes,
                estimatedMinutes: editingLook.estimatedMinutes,
              }
            : undefined
        }
        onClose={() => setLookDialogOpen(false)}
        onSubmit={handleLookSubmit}
      />

      {/* 제품 다이얼로그 */}
      <ProductDialog
        open={productDialogOpen}
        mode={productDialogMode}
        initial={
          editingProduct
            ? {
                area: editingProduct.area,
                productName: editingProduct.productName,
                brand: editingProduct.brand,
                colorCode: editingProduct.colorCode,
                technique: editingProduct.technique,
                order: editingProduct.order,
              }
            : { area: productDialogArea }
        }
        onClose={() => setProductDialogOpen(false)}
        onSubmit={handleProductSubmit}
      />
    </>
  );
}
