import type { DressCodeCategory, DressCodeGuideItem, DressCodeSet } from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

export const CATEGORY_LABELS: Record<DressCodeCategory, string> = {
  outfit: "의상",
  hair: "헤어",
  makeup: "메이크업",
  accessories: "악세사리",
  shoes: "신발",
};

export const CATEGORY_COLORS: Record<DressCodeCategory, string> = {
  outfit: "bg-purple-100 text-purple-700 border-purple-200",
  hair: "bg-pink-100 text-pink-700 border-pink-200",
  makeup: "bg-rose-100 text-rose-700 border-rose-200",
  accessories: "bg-yellow-100 text-yellow-700 border-yellow-200",
  shoes: "bg-orange-100 text-orange-700 border-orange-200",
};

export const ALL_CATEGORIES: DressCodeCategory[] = [
  "outfit",
  "hair",
  "makeup",
  "accessories",
  "shoes",
];

// ============================================================
// 타입 & 인터페이스
// ============================================================

export type GuideDialogMode = "add" | "edit";

export interface GuideDialogProps {
  open: boolean;
  mode: GuideDialogMode;
  initial?: Partial<Omit<DressCodeGuideItem, "id">>;
  onClose: () => void;
  onSubmit: (data: Omit<DressCodeGuideItem, "id">) => void;
}

export interface GuideSectionProps {
  category: DressCodeCategory;
  guides: DressCodeGuideItem[];
  memberNames: string[];
  memberStatuses: DressCodeSet["memberStatuses"];
  onToggleMember: (memberName: string, itemId: string) => void;
  onEditGuide: (guide: DressCodeGuideItem) => void;
  onDeleteGuide: (guideId: string) => void;
}

export interface MemberMatrixProps {
  set: DressCodeSet;
  memberNames: string[];
  onToggleMember: (memberName: string, itemId: string) => void;
}

export interface AddSetDialogProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}
