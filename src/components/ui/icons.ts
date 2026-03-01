/**
 * 아이콘 중앙 관리 모듈
 *
 * 자주 쓰이는 lucide-react 아이콘을 한 곳에서 재수출합니다.
 * 이 파일을 통해 import하면 나중에 아이콘 교체/변경이 쉬워집니다.
 *
 * 사용법:
 *   import { Plus, Trash2, Loader2 } from "@/components/ui/icons";
 *
 * 기존 lucide-react 직접 import도 계속 작동합니다.
 */

// ─── 가장 많이 쓰이는 아이콘 (사용 빈도순) ───────────────────────────────────

export {
  Loader2,        // 56회 - 로딩 스피너
  Plus,           // 50회 - 추가 버튼
  Users,          // 48회 - 멤버/그룹
  Trash2,         // 48회 - 삭제
  X,              // 40회 - 닫기/취소
  ChevronDown,    // 40회 - 아코디언/드롭다운
  Clock,          // 32회 - 시간
  ChevronUp,      // 29회 - 펼침 역방향
  Check,          // 21회 - 완료/확인
  TrendingUp,     // 18회 - 통계 상승
  Pencil,         // 18회 - 편집
  Calendar,       // 17회 - 날짜/일정
  Star,           // 15회 - 즐겨찾기/평점
  MessageSquare,  // 14회 - 메시지/댓글
  MapPin,         // 14회 - 위치
  FileText,       // 13회 - 문서
  BarChart3,      // 13회 - 차트/통계
  Download,       // 12회 - 다운로드
  Bell,           // 12회 - 알림
  AlertTriangle,  // 12회 - 경고
} from "lucide-react";

// ─── 의미론적 alias (기능 목적을 이름으로 표현) ──────────────────────────────

// 인증/계정
export { LogOut as SignOutIcon } from "lucide-react";
export { UserPlus as InviteIcon } from "lucide-react";

// 이미지 (lucide-react의 Image는 ImageIcon으로 통일)
// 일부 파일에서 `Image as ImageIcon`, 일부에서 `ImageIcon`을 직접 사용하는 혼용 패턴이 있습니다.
// 새 코드에서는 이 alias를 사용하세요.
export { ImageIcon } from "lucide-react";

// ─── LucideIcon 타입 ─────────────────────────────────────────────────────────
export type { LucideIcon } from "lucide-react";
