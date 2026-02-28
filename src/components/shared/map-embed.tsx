"use client";

import { useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMapUrls } from "@/lib/qr-generator";

interface MapEmbedProps {
  /** 장소 이름 */
  location: string;
  /** 주소 */
  address?: string | null;
  /** 위도 */
  latitude?: number | null;
  /** 경도 */
  longitude?: number | null;
  /** 지도 높이 (기본: 180px) */
  height?: number;
  /** 외부 지도 링크 버튼 표시 여부 (기본: true) */
  showExternalLinks?: boolean;
  /** 추가 className */
  className?: string;
}

function isValidCoord(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function buildOsmEmbedUrl(lat: number, lng: number): string {
  const delta = 0.004;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

export function MapEmbed({
  location,
  address,
  latitude,
  longitude,
  height = 180,
  showExternalLinks = true,
  className,
}: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const hasCoords =
    latitude != null &&
    longitude != null &&
    isValidCoord(latitude, longitude);

  const { kakao, naver } = getMapUrls(
    location,
    address ?? undefined,
    hasCoords ? latitude : undefined,
    hasCoords ? longitude : undefined
  );

  if (!hasCoords && !showExternalLinks) return null;

  return (
    <div className={className}>
      {/* 지도 미리보기 (유효 좌표가 있을 때만) */}
      {hasCoords && !error && (
        <div
          className="relative rounded-lg overflow-hidden border bg-muted/30"
          style={{ height }}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <MapPin className="h-5 w-5 text-muted-foreground animate-pulse" />
                <span className="text-[11px] text-muted-foreground">지도 로딩 중...</span>
              </div>
            </div>
          )}
          <iframe
            src={buildOsmEmbedUrl(latitude!, longitude!)}
            width="100%"
            height={height}
            style={{ border: 0, opacity: loaded ? 1 : 0 }}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
            title={`${location} 지도`}
            tabIndex={-1}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
          />
        </div>
      )}

      {/* 좌표 에러 시 메시지 */}
      {error && (
        <div className="rounded-lg border bg-muted/30 flex items-center justify-center" style={{ height: 60 }}>
          <span className="text-[11px] text-muted-foreground">지도를 불러올 수 없습니다</span>
        </div>
      )}

      {/* 장소 정보 + 외부 지도 링크 */}
      {showExternalLinks && (
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="min-w-0">
            {address && address !== location && (
              <p className="text-[11px] text-muted-foreground truncate">{address}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-1.5 gap-0.5 text-yellow-600 hover:text-yellow-700"
              onClick={() => window.open(kakao, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-2.5 w-2.5" />
              카카오맵
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-1.5 gap-0.5 text-green-600 hover:text-green-700"
              onClick={() => window.open(naver, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-2.5 w-2.5" />
              네이버지도
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
