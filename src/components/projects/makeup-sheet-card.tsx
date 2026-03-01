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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { TOAST } from "@/lib/toast-messages";
import { useMakeupSheet } from "@/hooks/use-makeup-sheet";
import type { MakeupSheetArea, MakeupSheetLook, MakeupSheetProduct } from "@/types";
import { ALL_AREAS } from "./makeup-sheet/types";
import { ProductDialog } from "./makeup-sheet/product-dialog";
import { LookDialog } from "./makeup-sheet/look-dialog";
import { AreaSection } from "./makeup-sheet/area-section";
import type { MakeupSheetCardProps } from "./makeup-sheet/types";

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
      toast.success(TOAST.MAKEUP_SHEET.LOOK_ADDED);
    } else if (editingLook) {
      updateLook(editingLook.id, data);
      toast.success(TOAST.MAKEUP_SHEET.LOOK_UPDATED);
    }
  };

  const handleDeleteLook = (lookId: string) => {
    deleteLook(lookId);
    if (selectedLookId === lookId) {
      setSelectedLookId(null);
    }
    toast.success(TOAST.MAKEUP_SHEET.LOOK_DELETED);
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
      toast.success(TOAST.MAKEUP_SHEET.PRODUCT_ADDED);
    } else if (editingProduct) {
      updateProduct(effectiveLook.id, editingProduct.id, data);
      toast.success(TOAST.MAKEUP_SHEET.PRODUCT_UPDATED);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (!effectiveLook) return;
    deleteProduct(effectiveLook.id, productId);
    toast.success(TOAST.MAKEUP_SHEET.PRODUCT_DELETED);
  };

  // ── 멤버 핸들러 ───────────────────────────────────────────

  const handleAssignMember = (memberName: string) => {
    if (!effectiveLook) return;
    const trimmed = memberName.trim();
    if (!trimmed) return;
    const ok = assignMember(effectiveLook.id, trimmed);
    if (!ok) {
      toast.error(TOAST.MAKEUP_SHEET.MEMBER_DUPLICATE);
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

  const lookTabsId = "makeup-sheet-look-tabs";

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="w-full">
          <CardHeader className="pb-2 pt-3 px-4">
            <CollapsibleTrigger asChild>
              <div
                className="flex items-center justify-between cursor-pointer"
                role="button"
                aria-expanded={isOpen}
                aria-controls="makeup-sheet-collapsible"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsOpen((prev) => !prev);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Paintbrush className="h-4 w-4 text-rose-500" aria-hidden="true" />
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
                    <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent id="makeup-sheet-collapsible">
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              {loading ? (
                <p className="text-xs text-muted-foreground py-2" role="status" aria-live="polite">
                  불러오는 중...
                </p>
              ) : (
                <>
                  {/* 룩 탭 */}
                  <div
                    id={lookTabsId}
                    className="flex items-center gap-1.5 flex-wrap"
                    role="tablist"
                    aria-label="메이크업 룩 선택"
                  >
                    {looks.map((look) => (
                      <button
                        key={look.id}
                        role="tab"
                        aria-selected={effectiveLook?.id === look.id}
                        aria-controls={`look-panel-${look.id}`}
                        onClick={() => setSelectedLookId(look.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedLookId(look.id);
                          }
                        }}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          effectiveLook?.id === look.id
                            ? "bg-rose-100 border-rose-300 text-rose-700 font-medium"
                            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-3 w-3" aria-hidden="true" />
                        {look.lookName}
                      </button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs px-2 rounded-full"
                      onClick={handleAddLookOpen}
                      aria-label="새 룩 추가"
                    >
                      <Plus className="h-3 w-3 mr-0.5" aria-hidden="true" />
                      룩 추가
                    </Button>
                  </div>

                  {/* 선택된 룩 상세 */}
                  {effectiveLook ? (
                    <div
                      id={`look-panel-${effectiveLook.id}`}
                      role="tabpanel"
                      aria-labelledby={lookTabsId}
                      className="space-y-3"
                    >
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
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                <span>
                                  <span className="sr-only">예상 소요시간</span>
                                  {effectiveLook.estimatedMinutes}분
                                </span>
                              </span>
                            )}
                          </div>
                          {effectiveLook.notes && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {effectiveLook.notes}
                            </p>
                          )}
                        </div>
                        <div
                          className="flex items-center gap-0.5 flex-shrink-0"
                          role="group"
                          aria-label={`${effectiveLook.lookName} 룩 관리`}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleEditLookOpen(effectiveLook)}
                            aria-label={`${effectiveLook.lookName} 룩 편집`}
                          >
                            <Pencil className="h-3 w-3" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteLook(effectiveLook.id)}
                            aria-label={`${effectiveLook.lookName} 룩 삭제`}
                          >
                            <Trash2 className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>

                      {/* 배정된 멤버 */}
                      <section aria-label="배정 멤버" className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                          <span className="text-xs font-medium">배정 멤버</span>
                        </div>
                        <div
                          className="flex items-center gap-1.5 flex-wrap"
                          role="list"
                          aria-label="배정된 멤버 목록"
                        >
                          {effectiveLook.assignedMembers.map((member) => (
                            <span
                              key={member}
                              role="listitem"
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5"
                            >
                              {member}
                              <button
                                onClick={() => handleUnassignMember(member)}
                                className="hover:text-destructive transition-colors"
                                aria-label={`${member} 배정 해제`}
                              >
                                <X className="h-2.5 w-2.5" aria-hidden="true" />
                              </button>
                            </span>
                          ))}
                          {effectiveLook.assignedMembers.length === 0 && (
                            <span className="text-[10px] text-muted-foreground" role="status">
                              배정된 멤버 없음
                            </span>
                          )}
                        </div>

                        {/* 멤버 추가 */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {/* 기존 멤버 빠른 추가 */}
                          {unassignedMembers.length > 0 && (
                            <div
                              className="flex items-center gap-1 flex-wrap"
                              role="group"
                              aria-label="빠른 멤버 배정"
                            >
                              {unassignedMembers.map((m) => (
                                <button
                                  key={m}
                                  onClick={() => handleAssignMember(m)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleAssignMember(m);
                                    }
                                  }}
                                  className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground border border-dashed border-border rounded-full px-2 py-0.5 hover:bg-muted transition-colors"
                                  aria-label={`${m} 멤버 배정`}
                                >
                                  <UserPlus className="h-2.5 w-2.5" aria-hidden="true" />
                                  {m}
                                </button>
                              ))}
                            </div>
                          )}
                          {/* 직접 입력 */}
                          <div
                            className="flex items-center gap-1"
                            role="group"
                            aria-label="멤버 직접 입력"
                          >
                            <Input
                              id="makeup-member-input"
                              className="h-6 text-[10px] px-2 w-24"
                              placeholder="이름 직접입력"
                              value={memberInput}
                              onChange={(e) => setMemberInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAssignMember(memberInput);
                                }
                              }}
                              aria-label="멤버 이름 직접 입력"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[10px] px-1.5"
                              onClick={() => handleAssignMember(memberInput)}
                              aria-label="입력한 멤버 배정"
                            >
                              추가
                            </Button>
                          </div>
                        </div>
                      </section>

                      {/* 부위별 섹션 */}
                      <div className="space-y-2" role="list" aria-label="부위별 제품 목록">
                        {ALL_AREAS.map((area) => (
                          <div key={area} role="listitem">
                            <AreaSection
                              area={area}
                              products={productsByArea[area] ?? []}
                              onAddProduct={() => handleAddProductOpen(area)}
                              onEditProduct={handleEditProductOpen}
                              onDeleteProduct={handleDeleteProduct}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center space-y-1" role="status">
                      <Paintbrush className="h-6 w-6 text-muted-foreground mx-auto" aria-hidden="true" />
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
