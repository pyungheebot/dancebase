// Canvas 2D API를 사용하여 투표 결과 공유 카드를 그리는 유틸리티

export interface PollShareOption {
  text: string;
  voteCount: number;
}

export interface PollShareData {
  question: string;
  options: PollShareOption[];
  totalVotes: number;
  createdAt?: string;
}

const CARD_WIDTH = 600;
const CARD_HEIGHT = 400;

// 색상 팔레트
const COLORS = {
  background: "#ffffff",
  headerBg: "#1d4ed8",   // blue-700
  headerText: "#ffffff",
  title: "#111827",       // gray-900
  label: "#374151",       // gray-700
  subtext: "#6b7280",     // gray-500
  barFirst: "#2563eb",    // blue-600
  barOther: "#d1d5db",    // gray-300
  barFirstText: "#ffffff",
  barOtherText: "#374151",
  border: "#e5e7eb",      // gray-200
  watermark: "#9ca3af",   // gray-400
  footerBg: "#f9fafb",    // gray-50
};

/**
 * 텍스트가 주어진 너비를 초과하면 말줄임(...) 처리
 */
function ellipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 0 && ctx.measureText(trimmed + "...").width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed + "...";
}

/**
 * 투표 결과 카드를 Canvas에 그리고 HTMLCanvasElement를 반환
 */
export function renderPollShareCard(data: PollShareData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D Context를 가져올 수 없습니다.");

  // 배경
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 상단 헤더 영역
  const headerHeight = 72;
  ctx.fillStyle = COLORS.headerBg;
  ctx.fillRect(0, 0, CARD_WIDTH, headerHeight);

  // 헤더: 투표 결과 레이블
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 13px 'Pretendard', 'Noto Sans KR', sans-serif";
  ctx.fillText("투표 결과", 28, 26);

  // 헤더: 질문 제목
  ctx.fillStyle = COLORS.headerText;
  ctx.font = "bold 20px 'Pretendard', 'Noto Sans KR', sans-serif";
  const titleText = ellipsis(ctx, data.question, CARD_WIDTH - 56);
  ctx.fillText(titleText, 28, 52);

  // 옵션 그래프 영역
  const barAreaTop = headerHeight + 20;
  const barAreaBottom = CARD_HEIGHT - 56;
  const barAreaHeight = barAreaBottom - barAreaTop;

  const optionCount = data.options.length;
  // 최대 6개 옵션까지 표시
  const displayOptions = data.options.slice(0, 6);
  const itemHeight = Math.min(48, Math.floor(barAreaHeight / Math.max(optionCount, 1)));
  const barMaxWidth = CARD_WIDTH - 56 - 100; // 왼쪽 여백 + 오른쪽 득표수 텍스트 영역

  // 1위 득표수 계산
  const maxVotes = Math.max(...data.options.map((o) => o.voteCount), 1);

  displayOptions.forEach((option, index) => {
    const y = barAreaTop + index * itemHeight;
    const isFirst = option.voteCount === maxVotes && option.voteCount > 0;
    const pct = data.totalVotes > 0 ? Math.round((option.voteCount / data.totalVotes) * 100) : 0;
    const barWidth = Math.max(barMaxWidth * (option.voteCount / maxVotes), 0);

    // 옵션 텍스트
    ctx.fillStyle = COLORS.label;
    ctx.font = `${isFirst ? "600" : "400"} 13px 'Pretendard', 'Noto Sans KR', sans-serif`;
    const optText = ellipsis(ctx, option.text, 180);
    ctx.fillText(optText, 28, y + 14);

    // 막대 배경
    const barY = y + 20;
    const barH = 18;
    ctx.fillStyle = "#f3f4f6";
    ctx.beginPath();
    roundRect(ctx, 28, barY, barMaxWidth, barH, 4);
    ctx.fill();

    // 막대 채우기
    if (barWidth > 0) {
      ctx.fillStyle = isFirst ? COLORS.barFirst : COLORS.barOther;
      ctx.beginPath();
      roundRect(ctx, 28, barY, barWidth, barH, 4);
      ctx.fill();
    }

    // 퍼센트 텍스트 (막대 위)
    if (barWidth > 36) {
      ctx.fillStyle = isFirst ? COLORS.barFirstText : COLORS.barOtherText;
      ctx.font = "bold 11px 'Pretendard', 'Noto Sans KR', sans-serif";
      ctx.fillText(`${pct}%`, 36, barY + 13);
    }

    // 득표수 텍스트 (오른쪽)
    ctx.fillStyle = COLORS.subtext;
    ctx.font = "12px 'Pretendard', 'Noto Sans KR', sans-serif";
    const voteText = `${option.voteCount}표`;
    const voteTextWidth = ctx.measureText(voteText).width;
    ctx.fillText(voteText, CARD_WIDTH - 28 - voteTextWidth, barY + 13);
  });

  // 하단 푸터 영역
  const footerY = CARD_HEIGHT - 44;
  ctx.fillStyle = COLORS.footerBg;
  ctx.fillRect(0, footerY, CARD_WIDTH, 44);

  // 상단 구분선
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(CARD_WIDTH, footerY);
  ctx.stroke();

  // 총 참여자 수
  ctx.fillStyle = COLORS.subtext;
  ctx.font = "13px 'Pretendard', 'Noto Sans KR', sans-serif";
  ctx.fillText(`총 ${data.totalVotes}명 참여`, 28, footerY + 27);

  // 날짜 (있을 경우)
  if (data.createdAt) {
    const dateStr = new Date(data.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    ctx.fillStyle = COLORS.subtext;
    ctx.font = "12px 'Pretendard', 'Noto Sans KR', sans-serif";
    ctx.fillText(dateStr, 28 + ctx.measureText(`총 ${data.totalVotes}명 참여  `).width, footerY + 27);
  }

  // DanceBase 워터마크 (오른쪽)
  ctx.fillStyle = COLORS.watermark;
  ctx.font = "bold 13px 'Pretendard', 'Noto Sans KR', sans-serif";
  const watermark = "DanceBase";
  const wmWidth = ctx.measureText(watermark).width;
  ctx.fillText(watermark, CARD_WIDTH - 28 - wmWidth, footerY + 27);

  return canvas;
}

/**
 * Canvas roundRect 헬퍼 (구형 브라우저 호환)
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Canvas를 Blob으로 변환
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas를 Blob으로 변환할 수 없습니다."));
    }, "image/png");
  });
}

/**
 * Canvas를 PNG 이미지로 다운로드
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, fileName = "투표결과.png") {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
}

/**
 * navigator.share API로 공유 (지원 브라우저 전용)
 */
export async function shareCanvas(canvas: HTMLCanvasElement, title: string) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], "투표결과.png", { type: "image/png" });
  await navigator.share({
    title,
    text: `${title} - 투표 결과`,
    files: [file],
  });
}
