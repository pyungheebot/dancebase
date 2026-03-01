"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FlipHorizontal, Maximize, SwitchCamera, VideoOff } from "lucide-react";

export function MirrorModeDialog() {
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(false);
  const [mirrored, setMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const openRef = useRef(false);

  // SSR 안전: 카메라 지원 여부 판단
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && "getUserMedia" in navigator.mediaDevices) {
      setSupported(true);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (facing: "user" | "environment"): Promise<boolean> => {
      stopStream();
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
        });
        // Race condition 방어: getUserMedia 완료 시 다이얼로그가 이미 닫혔으면 즉시 해제
        if (!openRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return false;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        return true;
      } catch {
        setError("카메라에 접근할 수 없습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.");
        return false;
      }
    },
    [stopStream]
  );

  // 다이얼로그 열릴 때 카메라 시작, 닫힐 때 해제
  useEffect(() => {
    openRef.current = open;
    if (open && supported) {
      startStream(facingMode);
    }
    if (!open) {
      stopStream();
    }
    return () => {
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supported]);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
  };

  const handleToggleMirror = () => {
    setMirrored((prev) => !prev);
  };

  const handleSwitchCamera = async () => {
    if (switching) return;
    setSwitching(true);
    const next = facingMode === "user" ? "environment" : "user";
    const success = await startStream(next);
    if (success) {
      setFacingMode(next);
    }
    setSwitching(false);
  };

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (el as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
    } else if ((el as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      (el as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  };

  if (!supported) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <FlipHorizontal className="h-3 w-3" />
          거울 모드
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <FlipHorizontal className="h-4 w-4 text-muted-foreground" />
            거울 모드
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {error ? (
            <div role="alert" className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <VideoOff className="h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
              <p className="text-xs text-center">{error}</p>
            </div>
          ) : (
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
                style={{
                  transform: mirrored ? "scaleX(-1)" : "none",
                }}
              />
            </div>
          )}

          {/* 컨트롤 */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={mirrored ? "default" : "outline"}
              size="sm"
              className="min-h-[44px] text-xs gap-1.5 px-3"
              onClick={handleToggleMirror}
            >
              <FlipHorizontal className="h-3.5 w-3.5" />
              {mirrored ? "반전 켜짐" : "반전 꺼짐"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs gap-1.5 px-3"
              onClick={handleSwitchCamera}
              disabled={switching}
            >
              <SwitchCamera className="h-3.5 w-3.5" />
              카메라 전환
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] text-xs gap-1.5 px-3"
              onClick={handleFullscreen}
            >
              <Maximize className="h-3.5 w-3.5" />
              전체화면
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            안무 연습 시 거울 대신 사용하세요. 다이얼로그를 닫으면 카메라가 해제됩니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
