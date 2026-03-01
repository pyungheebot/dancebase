import type {
  MediaPressKitStatus,
  MediaPressKitOutletType,
} from "@/types";
import type {
  AddMediaPressKitInput,
  AddOutletInput,
} from "@/hooks/use-media-press-kit";

// ============================================================
// 상수
// ============================================================

export const STATUS_CONFIG: Record<
  MediaPressKitStatus,
  { label: string; color: string }
> = {
  draft: {
    label: "작성중",
    color: "bg-gray-100 text-gray-600 border-gray-200",
  },
  review: {
    label: "검토중",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  published: {
    label: "배포완료",
    color: "bg-green-100 text-green-700 border-green-200",
  },
};

export const OUTLET_TYPE_CONFIG: Record<
  MediaPressKitOutletType,
  { label: string; color: string }
> = {
  newspaper: { label: "신문", color: "bg-blue-100 text-blue-700 border-blue-200" },
  magazine: { label: "잡지", color: "bg-purple-100 text-purple-700 border-purple-200" },
  online: { label: "온라인", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  broadcast: { label: "방송", color: "bg-orange-100 text-orange-700 border-orange-200" },
  sns: { label: "SNS", color: "bg-pink-100 text-pink-700 border-pink-200" },
  other: { label: "기타", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

export const STATUS_ORDER: MediaPressKitStatus[] = ["draft", "review", "published"];

// ============================================================
// 빈 폼 초기값
// ============================================================

export const EMPTY_ENTRY_FORM: AddMediaPressKitInput & { attachmentInput: string } = {
  title: "",
  writtenAt: new Date().toISOString().split("T")[0],
  content: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  attachmentUrls: [],
  attachmentInput: "",
};

export const EMPTY_OUTLET_FORM: AddOutletInput = {
  name: "",
  type: "online",
  contactName: "",
  contactEmail: "",
  published: false,
  note: "",
};
