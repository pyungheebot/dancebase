// ============================================
// Wardrobe / Costume Management
// ============================================

export type CostumeStatus = "planned" | "ordered" | "arrived" | "distributed" | "returned";

export type CostumeItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  totalQuantity: number;
  availableQuantity: number;
  status: CostumeStatus;
  note: string;
  createdAt: string;
};

export type CostumeAssignment = {
  costumeId: string;
  memberId: string;
  memberName: string;
  size: string;
  returned: boolean;
};

export type CostumeStore = {
  items: CostumeItem[];
  assignments: CostumeAssignment[];
  updatedAt: string;
};

// ============================================
// Costume Design Board (의상 디자인 보드)
// ============================================

export type CostumeDesignStatus =
  | "idea"
  | "sketched"
  | "approved"
  | "in_production"
  | "completed";

export type CostumeDesignComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type CostumeDesignEntry = {
  id: string;
  title: string;
  description: string;
  designedBy: string;
  category: string;
  colorScheme: string[];
  materialNotes?: string;
  estimatedCost?: number;
  status: CostumeDesignStatus;
  votes: string[];
  comments: CostumeDesignComment[];
  createdAt: string;
};

// ============================================
// Dress Code (공연 드레스 코드)
// ============================================

export type DressCodeCategory =
  | "outfit"
  | "hair"
  | "makeup"
  | "accessories"
  | "shoes";

export type DressCodeGuideItem = {
  id: string;
  category: DressCodeCategory;
  title: string;
  description: string;
  colorCode?: string;
  imageDescription?: string;
  isRequired: boolean;
};

export type DressCodeMemberStatus = {
  memberName: string;
  itemId: string;
  isReady: boolean;
  notes?: string;
};

export type DressCodeSet = {
  id: string;
  projectId: string;
  performanceName: string;
  guides: DressCodeGuideItem[];
  memberStatuses: DressCodeMemberStatus[];
  createdAt: string;
};

// ============================================
// Makeup Sheet (공연 메이크업 시트)
// ============================================

export type MakeupSheetArea =
  | "base"
  | "eyes"
  | "lips"
  | "cheeks"
  | "brows"
  | "special_effects";

export type MakeupSheetProduct = {
  id: string;
  area: MakeupSheetArea;
  productName: string;
  brand?: string;
  colorCode?: string;
  technique?: string;
  order: number;
};

export type MakeupSheetLook = {
  id: string;
  lookName: string;
  performanceName: string;
  products: MakeupSheetProduct[];
  assignedMembers: string[];
  notes?: string;
  estimatedMinutes?: number;
  createdAt: string;
};

// ============================================
// Costume Fitting (공연 의상 핏팅 기록)
// ============================================

export type CostumeFittingMeasurement = {
  height: string | null;
  chest: string | null;
  waist: string | null;
  hip: string | null;
  shoeSize: string | null;
  notes: string | null;
};

export type CostumeFittingStatus = "pending" | "fitted" | "altered" | "completed";

export type CostumeFittingEntry = {
  id: string;
  memberName: string;
  costumeName: string;
  measurements: CostumeFittingMeasurement;
  status: CostumeFittingStatus;
  fittingDate: string | null;
  alterationNotes: string | null;
  photoUrl: string | null;
  createdAt: string;
};

export type CostumeFittingData = {
  projectId: string;
  entries: CostumeFittingEntry[];
  updatedAt: string;
};

// ============================================
// Costume Rental (의상 대여 관리)
// ============================================

export type CostumeRentalItemStatus =
  | "available"
  | "rented"
  | "damaged"
  | "lost";

export type CostumeRentalItem = {
  id: string;
  name: string;
  category: "상의" | "하의" | "소품" | "신발" | "기타";
  size: string;
  status: CostumeRentalItemStatus;
  currentRenter?: string;
  rentedAt?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
};

export type CostumeRentalRecord = {
  id: string;
  itemId: string;
  renterName: string;
  rentedAt: string;
  returnedAt?: string;
  condition?: "good" | "damaged" | "lost";
  notes?: string;
};

// ============================================
// Wardrobe Tracker (의상 추적기)
// ============================================

export type WardrobeTrackStatus =
  | "preparing"
  | "repairing"
  | "ready"
  | "lost";

export type WardrobeTrackItem = {
  id: string;
  name: string;
  scene: string;
  memberName: string;
  size: string;
  color: string;
  status: WardrobeTrackStatus;
  returned: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type WardrobeTrackerData = {
  projectId: string;
  items: WardrobeTrackItem[];
  updatedAt: string;
};

// ============================================
// MakeupHairCard (분장/헤어 관리)
// ============================================

export type MakeupHairMakeupType =
  | "내추럴"
  | "스테이지"
  | "특수분장";

export type MakeupHairStyle =
  | "업스타일"
  | "다운스타일"
  | "반묶음"
  | "특수";

export type MakeupHairPlan = {
  id: string;
  memberName: string;
  scene: number;
  makeupType: MakeupHairMakeupType;
  hairStyle: MakeupHairStyle;
  colorTone: string | null;
  memo: string | null;
  createdAt: string;
};

export type MakeupHairTimelineEntry = {
  id: string;
  memberName: string;
  startTime: string;
  durationMinutes: number;
};

export type MakeupHairChecklistItem = {
  id: string;
  item: string;
  checked: boolean;
};

export type MakeupHairArtist = {
  id: string;
  name: string;
  contact: string | null;
  specialty: string | null;
};

export type MakeupHairData = {
  projectId: string;
  plans: MakeupHairPlan[];
  timeline: MakeupHairTimelineEntry[];
  checklist: MakeupHairChecklistItem[];
  artists: MakeupHairArtist[];
  updatedAt: string;
};
