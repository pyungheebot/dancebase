/**
 * Canvas API를 이용한 장소 공유 카드 생성 유틸리티
 * 외부 라이브러리 없이 순수 Canvas 2D API로 구현
 */

function getMapUrls(
  location: string,
  address?: string,
  lat?: number,
  lng?: number
): { kakao: string; naver: string } {
  const searchQuery = encodeURIComponent(address || location);

  const kakao =
    lat != null && lng != null
      ? `https://map.kakao.com/link/map/${encodeURIComponent(location)},${lat},${lng}`
      : `https://map.kakao.com/link/search/${searchQuery}`;

  const naver = `https://map.naver.com/v5/search/${searchQuery}`;

  return { kakao, naver };
}

/**
 * Canvas에 둥근 사각형을 그리는 헬퍼
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * 긴 텍스트를 maxWidth에 맞게 줄바꿈하여 반환
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split("");
  const lines: string[] = [];
  let currentLine = "";

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * 장소 공유 카드 이미지를 Canvas로 생성하여 data URL 반환
 */
export async function generateLocationCard(
  title: string,
  location: string,
  address?: string,
  lat?: number,
  lng?: number
): Promise<string> {
  const WIDTH = 400;
  const HEIGHT = 500;
  const PADDING = 28;
  const CARD_RADIUS = 16;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context를 가져올 수 없습니다");

  // 배경 그라데이션
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, "#f0f4ff");
  grad.addColorStop(1, "#fafafa");
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, WIDTH, HEIGHT, CARD_RADIUS);
  ctx.fill();

  // 외곽선
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 0.75, 0.75, WIDTH - 1.5, HEIGHT - 1.5, CARD_RADIUS);
  ctx.stroke();

  // --- 상단 헤더 영역 ---
  const headerHeight = 80;
  const headerGrad = ctx.createLinearGradient(0, 0, WIDTH, headerHeight);
  headerGrad.addColorStop(0, "#4f46e5");
  headerGrad.addColorStop(1, "#7c3aed");
  ctx.fillStyle = headerGrad;
  ctx.beginPath();
  ctx.moveTo(CARD_RADIUS, 0);
  ctx.lineTo(WIDTH - CARD_RADIUS, 0);
  ctx.quadraticCurveTo(WIDTH, 0, WIDTH, CARD_RADIUS);
  ctx.lineTo(WIDTH, headerHeight);
  ctx.lineTo(0, headerHeight);
  ctx.lineTo(0, CARD_RADIUS);
  ctx.quadraticCurveTo(0, 0, CARD_RADIUS, 0);
  ctx.closePath();
  ctx.fill();

  // 헤더 레이블
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DanceBase · 장소 공유", PADDING, 24);

  // 일정 제목
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
  const titleLines = wrapText(ctx, title, WIDTH - PADDING * 2);
  titleLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, PADDING, 50 + i * 20);
  });

  // --- 장소 섹션 ---
  let y = headerHeight + 28;

  // MapPin 아이콘 대체 원형 마커
  ctx.fillStyle = "#4f46e5";
  ctx.beginPath();
  ctx.arc(PADDING + 8, y + 8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("P", PADDING + 8, y + 12);
  ctx.textAlign = "left";

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
  const locationLines = wrapText(ctx, location, WIDTH - PADDING * 2 - 24);
  locationLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, PADDING + 22, y + 4 + i * 18);
  });
  y += Math.max(locationLines.slice(0, 2).length * 18 + 6, 26);

  // 주소
  if (address && address !== location) {
    ctx.fillStyle = "#64748b";
    ctx.font = "13px -apple-system, BlinkMacSystemFont, sans-serif";
    const addrLines = wrapText(ctx, address, WIDTH - PADDING * 2 - 8);
    addrLines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, PADDING + 4, y + i * 17);
    });
    y += addrLines.slice(0, 2).length * 17 + 8;
  }

  y += 12;

  // 구분선
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();

  y += 20;

  // --- 지도 링크 섹션 ---
  const { kakao, naver } = getMapUrls(location, address, lat, lng);

  ctx.fillStyle = "#475569";
  ctx.font = "500 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("지도에서 열기", PADDING, y);
  y += 18;

  // 카카오맵 버튼 박스
  ctx.fillStyle = "#FEF08A";
  roundRect(ctx, PADDING, y, WIDTH - PADDING * 2, 44, 8);
  ctx.fill();
  ctx.strokeStyle = "#EAB308";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#713f12";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("카카오맵에서 열기", PADDING + 12, y + 16);
  ctx.fillStyle = "#92400e";
  ctx.font = "10px monospace";
  const kakaoShort = kakao.length > 52 ? kakao.substring(0, 49) + "..." : kakao;
  ctx.fillText(kakaoShort, PADDING + 12, y + 32);

  y += 54;

  // 네이버지도 버튼 박스
  ctx.fillStyle = "#DCFCE7";
  roundRect(ctx, PADDING, y, WIDTH - PADDING * 2, 44, 8);
  ctx.fill();
  ctx.strokeStyle = "#22C55E";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#14532d";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("네이버지도에서 열기", PADDING + 12, y + 16);
  ctx.fillStyle = "#166534";
  ctx.font = "10px monospace";
  const naverShort = naver.length > 52 ? naver.substring(0, 49) + "..." : naver;
  ctx.fillText(naverShort, PADDING + 12, y + 32);

  y += 54;

  // --- 하단 워터마크 ---
  y = HEIGHT - 28;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DanceBase · 댄스 그룹 관리 플랫폼", WIDTH / 2, y);

  return canvas.toDataURL("image/png");
}

export { getMapUrls };
