"use client";

type SpotifyContentType = "track" | "album" | "playlist" | "episode" | "show";

/** Spotify URL에서 콘텐츠 타입과 ID 추출 */
export function extractSpotifyInfo(
  url: string
): { type: SpotifyContentType; id: string } | null {
  if (!url || typeof url !== "string") return null;

  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();

    if (hostname !== "open.spotify.com" && hostname !== "spotify.com") {
      return null;
    }

    // 경로: /track/{id}, /album/{id}, /playlist/{id}, /embed/track/{id} 등
    const segments = u.pathname.split("/").filter(Boolean);

    // /embed/track/{id} 형식 처리
    const startIdx = segments[0] === "embed" ? 1 : 0;
    const type = segments[startIdx] as SpotifyContentType;
    const id = segments[startIdx + 1];

    const validTypes: SpotifyContentType[] = [
      "track",
      "album",
      "playlist",
      "episode",
      "show",
    ];

    if (!validTypes.includes(type) || !id) return null;

    // ID 형식 검증 (영숫자 22자)
    const cleanId = id.split("?")[0];
    if (!/^[a-zA-Z0-9]{22}$/.test(cleanId)) return null;

    return { type, id: cleanId };
  } catch {
    return null;
  }
}

interface SpotifyEmbedProps {
  url: string;
  /** 컴팩트 모드: 트랙용 작은 플레이어 (높이 80px) */
  compact?: boolean;
  className?: string;
}

/**
 * Spotify 임베드 컴포넌트
 * - track, album, playlist, episode, show 지원
 * - compact 모드: 높이 80px (곡 목록 인라인용)
 * - 일반 모드: 높이 152px (트랙) / 352px (앨범/플레이리스트)
 */
export function SpotifyEmbed({
  url,
  compact = false,
  className,
}: SpotifyEmbedProps) {
  const info = extractSpotifyInfo(url);
  if (!info) return null;

  const embedUrl = `https://open.spotify.com/embed/${info.type}/${info.id}?utm_source=generator&theme=0`;

  const height = compact
    ? 80
    : info.type === "track" || info.type === "episode"
      ? 152
      : 352;

  return (
    <div className={`rounded-lg overflow-hidden ${className ?? ""}`}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify 플레이어"
        sandbox="allow-same-origin allow-scripts allow-popups"
        className="border-0"
      />
    </div>
  );
}
