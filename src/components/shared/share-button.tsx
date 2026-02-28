"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Copy, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonProps {
  /** 공유 제목 */
  title: string;
  /** 공유 본문 텍스트 */
  text?: string;
  /** 공유 URL (기본: 현재 페이지) */
  url?: string;
  /** 버튼 라벨 (기본: "공유") */
  label?: string;
  /** 버튼 variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** 버튼 크기 */
  size?: "default" | "sm" | "lg" | "icon";
  /** 추가 className */
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  label = "공유",
  variant = "outline",
  size = "sm",
  className = "h-7 text-xs",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    );
    return () => clearTimeout(timerRef.current);
  }, []);

  const getShareUrl = () => {
    if (url) return url;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  };

  const handleNativeShare = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("공유할 URL이 없습니다");
      return;
    }
    try {
      await navigator.share({
        title,
        text: text || title,
        url: shareUrl,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      await handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("공유할 URL이 없습니다");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  const handleCopyWithText = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error("공유할 URL이 없습니다");
      return;
    }
    const shareText = text
      ? `${title}\n${text}\n${shareUrl}`
      : `${title}\n${shareUrl}`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success("내용이 복사되었습니다");
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다");
    }
  };

  const iconCls = `h-3 w-3${label ? " mr-1" : ""}`;

  // 모바일: Web Share API 직접 호출 (카카오톡, 라인 등 모든 앱 지원)
  if (canShare) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
        aria-label={label || "공유"}
      >
        <Share2 className={iconCls} />
        {label}
      </Button>
    );
  }

  // 데스크톱: 드롭다운으로 복사 옵션 제공
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} aria-label={label || "공유"}>
          {copied ? (
            <Check className={iconCls} />
          ) : (
            <Share2 className={iconCls} />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Copy className="h-3.5 w-3.5 mr-2" />
          링크 복사
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyWithText}>
          <FileText className="h-3.5 w-3.5 mr-2" />
          내용과 함께 복사
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
