"use client";

import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { MapPin, ExternalLink, Copy, Download, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { generateLocationCard, getMapUrls } from "@/lib/qr-generator";
import { copyToClipboard } from "@/lib/clipboard";

type MapService = "kakao" | "naver";

type ScheduleLocationShareProps = {
  scheduleTitle: string;
  location: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function ScheduleLocationShare({
  scheduleTitle,
  location,
  address,
  latitude,
  longitude,
}: ScheduleLocationShareProps) {
  const [open, setOpen] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedService, setSelectedService] = useState<MapService>("kakao");

  const lat = latitude ?? undefined;
  const lng = longitude ?? undefined;
  const addr = address ?? undefined;

  const { kakao: kakaoUrl, naver: naverUrl } = getMapUrls(location, addr, lat, lng);

  const generateCard = useCallback(async () => {
    setGenerating(true);
    try {
      const dataUrl = await generateLocationCard(
        scheduleTitle,
        location,
        addr,
        lat,
        lng
      );
      setCardDataUrl(dataUrl);
    } catch {
      toast.error(TOAST.SCHEDULE.LOCATION_IMAGE_ERROR);
    } finally {
      setGenerating(false);
    }
  }, [scheduleTitle, location, addr, lat, lng]);

  useEffect(() => {
    if (open && !cardDataUrl) {
      generateCard();
    }
  }, [open, cardDataUrl, generateCard]);

  const handleOpenMap = () => {
    const url = selectedService === "kakao" ? kakaoUrl : naverUrl;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    await copyToClipboard(kakaoUrl, "카카오맵 링크를 복사했습니다", "링크 복사에 실패했습니다");
  };

  const handleDownloadImage = () => {
    if (!cardDataUrl) return;
    const link = document.createElement("a");
    link.href = cardDataUrl;
    link.download = `${scheduleTitle}_장소공유.png`;
    link.click();
    toast.success(TOAST.SCHEDULE.LOCATION_IMAGE_SAVED);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          aria-label={`${location} 장소 공유`}
        >
          <MapPin className="h-3 w-3" aria-hidden="true" />
          장소 공유
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-1.5">
            <Map className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            장소 공유
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 장소 정보 */}
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5 space-y-0.5">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-500" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-snug truncate">{location}</p>
                {address && address !== location && (
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 break-all">
                    {address}
                  </p>
                )}
                {latitude != null && longitude != null && (
                  <Badge
                    className="mt-1 text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200"
                    variant="outline"
                  >
                    좌표 있음
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* 카드 이미지 미리보기 */}
          <div className="rounded-lg border overflow-hidden bg-gray-50 flex items-center justify-center min-h-[140px]">
            {generating ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-[11px] text-muted-foreground">카드 생성 중...</p>
              </div>
            ) : cardDataUrl ? (
              <NextImage
                src={cardDataUrl}
                alt="장소 공유 카드 미리보기"
                width={320}
                height={140}
                className="w-full h-auto"
                unoptimized
              />
            ) : (
              <p className="text-[11px] text-muted-foreground py-6">미리보기 없음</p>
            )}
          </div>

          {/* 지도 서비스 선택 */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground">지도 서비스 선택</p>
            <RadioGroup
              value={selectedService}
              onValueChange={(v) => setSelectedService(v as MapService)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="kakao" id="kakao" className="h-3.5 w-3.5" />
                <Label htmlFor="kakao" className="text-xs cursor-pointer">
                  카카오맵
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="naver" id="naver" className="h-3.5 w-3.5" />
                <Label htmlFor="naver" className="text-xs cursor-pointer">
                  네이버지도
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
              onClick={() => {
                window.open(kakaoUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              카카오맵
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                window.open(naverUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              네이버지도
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleCopyLink}
            >
              <Copy className="h-3 w-3" aria-hidden="true" />
              링크 복사
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleDownloadImage}
              disabled={!cardDataUrl || generating}
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              이미지 저장
            </Button>
          </div>

          {/* 선택된 서비스 열기 버튼 */}
          <Button
            className="w-full h-8 text-xs gap-1"
            onClick={handleOpenMap}
          >
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {selectedService === "kakao" ? "카카오맵" : "네이버지도"}에서 열기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
