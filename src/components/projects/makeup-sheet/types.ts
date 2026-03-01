import type { MakeupSheetArea, MakeupSheetProduct, MakeupSheetLook } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

export const AREA_LABELS: Record<MakeupSheetArea, string> = {
  base: "베이스",
  eyes: "눈",
  lips: "입술",
  cheeks: "볼",
  brows: "눈썹",
  special_effects: "특수효과",
};

export const AREA_COLORS: Record<MakeupSheetArea, string> = {
  base: "bg-amber-50 border-amber-200",
  eyes: "bg-purple-50 border-purple-200",
  lips: "bg-rose-50 border-rose-200",
  cheeks: "bg-pink-50 border-pink-200",
  brows: "bg-stone-50 border-stone-200",
  special_effects: "bg-cyan-50 border-cyan-200",
};

export const AREA_BADGE_COLORS: Record<MakeupSheetArea, string> = {
  base: "bg-amber-100 text-amber-700 border-amber-200",
  eyes: "bg-purple-100 text-purple-700 border-purple-200",
  lips: "bg-rose-100 text-rose-700 border-rose-200",
  cheeks: "bg-pink-100 text-pink-700 border-pink-200",
  brows: "bg-stone-100 text-stone-700 border-stone-200",
  special_effects: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export const ALL_AREAS: MakeupSheetArea[] = [
  "base",
  "eyes",
  "lips",
  "cheeks",
  "brows",
  "special_effects",
];

// ============================================================
// Props 인터페이스
// ============================================================

export interface ProductDialogProps {
  open: boolean;
  mode: "add" | "edit";
  initial?: Partial<Omit<MakeupSheetProduct, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<MakeupSheetProduct, "id">) => void;
}

export interface LookDialogProps {
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

export interface AreaSectionProps {
  area: MakeupSheetArea;
  products: MakeupSheetProduct[];
  onAddProduct: () => void;
  onEditProduct: (product: MakeupSheetProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

export interface MakeupSheetCardProps {
  groupId: string;
  projectId: string;
  memberNames?: string[];
}
