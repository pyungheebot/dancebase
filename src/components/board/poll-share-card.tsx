"use client";

import { useState, useRef, useCallback } from "react";
import { Share2, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  renderPollShareCard,
  downloadCanvasAsPng,
  shareCanvas,
  type PollShareOption,
} from "@/lib/poll-share-renderer";
import { toast } from "sonner";

interface PollShareCardProps {
  question: string;
  options: PollShareOption[];
  totalVotes: number;
  createdAt?: string;
}

export function PollShareCard({
  question,
  options,
  totalVotes,
  createdAt,
}: PollShareCardProps) {
  const [open, setOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  const generatePreview = useCallback(() => {
    setGenerating(true);
    try {
      const canvas = renderPollShareCard({
        question,
        options,
        totalVotes,
        createdAt,
      });
      canvasRef.current = canvas;
      setPreviewSrc(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error(err);
      toast.error("미리보기 생성에 실패했습니다.");
    } finally {
      setGenerating(false);
    }
  }, [question, options, totalVotes, createdAt]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      // Dialog가 열릴 때 미리보기 생성
      generatePreview();
    } else {
      setPreviewSrc(null);
      canvasRef.current = null;
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      toast.error("이미지를 먼저 생성해주세요.");
      return;
    }
    try {
      downloadCanvasAsPng(canvasRef.current, `${question}_투표결과.png`);
      toast.success("이미지가 저장되었습니다.");
    } catch (err) {
      console.error(err);
      toast.error("이미지 저장에 실패했습니다.");
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) {
      toast.error("이미지를 먼저 생성해주세요.");
      return;
    }
    try {
      await shareCanvas(canvasRef.current, question);
      toast.success("공유되었습니다.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // 사용자가 공유 취소 — 무시
        return;
      }
      console.error(err);
      toast.error("공유에 실패했습니다.");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1 text-muted-foreground"
        onClick={() => handleOpenChange(true)}
      >
        <Share2 className="h-3 w-3" />
        결과 공유
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[640px] p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Image className="h-4 w-4" />
              투표 결과 공유
            </DialogTitle>
          </DialogHeader>

          {/* 미리보기 영역 */}
          <div className="rounded-lg border overflow-hidden bg-muted/30 flex items-center justify-center min-h-[200px]">
            {generating && (
              <span className="text-xs text-muted-foreground">이미지 생성 중...</span>
            )}
            {!generating && previewSrc && (
              <img
                src={previewSrc}
                alt="투표 결과 미리보기"
                className="w-full h-auto rounded"
                style={{ maxHeight: 340 }}
              />
            )}
            {!generating && !previewSrc && (
              <span className="text-xs text-muted-foreground">미리보기를 불러올 수 없습니다.</span>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {canShare && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={handleShare}
                disabled={!previewSrc}
              >
                <Share2 className="h-3 w-3" />
                공유
              </Button>
            )}
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleDownload}
              disabled={!previewSrc}
            >
              <Download className="h-3 w-3" />
              이미지 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
