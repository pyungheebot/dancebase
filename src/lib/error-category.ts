import {
  isNetworkError,
  isAuthError,
  isNotFoundError,
  isServerError,
} from "@/lib/swr/error-handler";

export type ErrorCategory = "network" | "auth" | "not-found" | "server" | "unknown";

export interface ErrorInfo {
  title: string;
  description: string;
  canRetry: boolean;
  icon: string;
}

/**
 * 에러를 카테고리로 분류합니다.
 * Error 객체, Response 객체, string, Supabase 에러 등 다양한 입력을 처리합니다.
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return "unknown";

  // 네트워크 단절
  if (isNetworkError(error)) return "network";

  // 인증/권한 에러
  if (isAuthError(error)) return "auth";

  // 리소스 없음
  if (isNotFoundError(error)) return "not-found";

  // 서버 에러 (5xx)
  if (isServerError(error)) return "server";

  // string 에러 메시지 패턴 매칭
  if (typeof error === "string") {
    const lower = error.toLowerCase();
    if (lower.includes("fetch") || lower.includes("network")) return "network";
    if (lower.includes("auth") || lower.includes("permission") || lower.includes("unauthorized")) return "auth";
    if (lower.includes("not found") || lower.includes("404")) return "not-found";
    if (lower.includes("server") || lower.includes("500")) return "server";
  }

  // Error 객체 메시지 패턴 매칭
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("network")) return "network";
    if (msg.includes("auth") || msg.includes("permission") || msg.includes("unauthorized") || msg.includes("jwt")) return "auth";
    if (msg.includes("not found") || msg.includes("404")) return "not-found";
    if (msg.includes("server error") || msg.includes("500") || msg.includes("internal")) return "server";
  }

  return "unknown";
}

/**
 * 에러 카테고리별 UI 메타데이터를 반환합니다.
 */
export function getErrorMessage(category: ErrorCategory): ErrorInfo {
  switch (category) {
    case "network":
      return {
        title: "네트워크 오류",
        description: "인터넷 연결을 확인하고 다시 시도하세요.",
        canRetry: true,
        icon: "WifiOff",
      };
    case "auth":
      return {
        title: "접근 권한 없음",
        description: "이 콘텐츠에 접근할 권한이 없습니다. 로그인 상태를 확인하세요.",
        canRetry: false,
        icon: "ShieldAlert",
      };
    case "not-found":
      return {
        title: "데이터를 찾을 수 없음",
        description: "요청한 데이터가 존재하지 않거나 삭제되었습니다.",
        canRetry: false,
        icon: "SearchX",
      };
    case "server":
      return {
        title: "서버 오류",
        description: "서버에서 문제가 발생했습니다. 잠시 후 다시 시도하세요.",
        canRetry: true,
        icon: "ServerCrash",
      };
    case "unknown":
    default:
      return {
        title: "오류 발생",
        description: "예기치 않은 오류가 발생했습니다.",
        canRetry: true,
        icon: "AlertTriangle",
      };
  }
}
