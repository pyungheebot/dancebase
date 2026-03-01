"use client";

import { copyToClipboard } from "@/lib/clipboard";

export function useShare(): {
  canNativeShare: boolean;
  share: (data: { title: string; text?: string; url?: string }) => Promise<boolean>;
  copyLink: (url: string) => Promise<boolean>;
} {
  const canNativeShare =
    typeof navigator !== "undefined" && !!navigator.share;

  const share = async (data: {
    title: string;
    text?: string;
    url?: string;
  }): Promise<boolean> => {
    if (!canNativeShare) return false;
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false;
      return false;
    }
  };

  const copyLink = async (url: string): Promise<boolean> => {
    return copyToClipboard(url, "링크가 복사되었습니다", "링크 복사에 실패했습니다");
  };

  return { canNativeShare, share, copyLink };
}
