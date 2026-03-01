"use client";

import { copyToClipboard } from "@/lib/clipboard";

/**
 * 공유 기능 훅
 * - Web Share API 지원 감지 (SSR 안전)
 * - 네이티브 공유 실패 시 클립보드 폴백 자동 처리
 */
export function useShare(): {
  canNativeShare: boolean;
  share: (data: { title: string; text?: string; url?: string }) => Promise<boolean>;
  copyLink: (url: string) => Promise<boolean>;
} {
  // SSR 안전: window와 navigator 모두 확인
  const canNativeShare =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    "share" in navigator;

  /**
   * Web Share API로 공유 시도
   * 실패 시 url이 있으면 클립보드에 자동 폴백
   */
  const share = async (data: {
    title: string;
    text?: string;
    url?: string;
  }): Promise<boolean> => {
    // 네이티브 공유 지원 시 직접 호출
    if (canNativeShare) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        // 사용자가 취소한 경우 폴백 없이 종료
        if (err instanceof Error && err.name === "AbortError") return false;
        // 그 외 오류: url이 있으면 클립보드 폴백
        if (data.url) {
          return copyLink(data.url);
        }
        return false;
      }
    }

    // 네이티브 공유 미지원: url이 있으면 클립보드 폴백
    if (data.url) {
      return copyLink(data.url);
    }
    return false;
  };

  /**
   * URL을 클립보드에 복사 (링크 공유 폴백)
   */
  const copyLink = async (url: string): Promise<boolean> => {
    return copyToClipboard(url, "링크가 복사되었습니다", "링크 복사에 실패했습니다");
  };

  return { canNativeShare, share, copyLink };
}
