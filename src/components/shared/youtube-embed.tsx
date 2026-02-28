"use client";

import { useState, useCallback } from "react";
import { Play } from "lucide-react";

/** 11자리 YouTube video ID 검증 */
function isValidVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id);
}

/** YouTube URL에서 video ID 추출 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();

    if (hostname === "youtu.be" || hostname === "www.youtu.be") {
      const videoId = u.pathname.slice(1).split("/")[0];
      return videoId && isValidVideoId(videoId) ? videoId : null;
    }

    if (hostname === "youtube.com" || hostname === "www.youtube.com" || hostname === "m.youtube.com") {
      const videoId = u.searchParams.get("v");
      return videoId && isValidVideoId(videoId) ? videoId : null;
    }
  } catch {
    // URL 파싱 실패
  }

  return null;
}

interface YouTubeEmbedProps {
  url: string;
  /** 시작 시간(초) */
  startSeconds?: number;
  className?: string;
}

/**
 * YouTube 영상 임베드 컴포넌트
 * - 초기에는 썸네일만 표시 (lazy load)
 * - 클릭 시 iframe 로드하여 재생
 */
export function YouTubeEmbed({
  url,
  startSeconds,
  className,
}: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url);
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    setPlaying(true);
  }, []);

  if (!videoId) return null;

  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const embedParams = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    ...(startSeconds ? { start: String(startSeconds) } : {}),
  });
  const embedUrl = `https://www.youtube.com/embed/${videoId}?${embedParams.toString()}`;

  return (
    <div
      className={`relative w-full aspect-video rounded-lg overflow-hidden border bg-black ${className ?? ""}`}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          title="YouTube 비디오"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
        />
      ) : (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 w-full h-full group cursor-pointer"
          aria-label="영상 재생"
        >
          <img
            src={thumbUrl}
            alt="YouTube 썸네일"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
