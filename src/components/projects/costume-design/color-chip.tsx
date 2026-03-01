"use client";

// ============================================================
// CSS 색상명을 그대로 사용하는 원형 칩
// ============================================================

interface ColorChipProps {
  colorName: string;
}

export function ColorChip({ colorName }: ColorChipProps) {
  return (
    <span
      role="img"
      aria-label={colorName}
      title={colorName}
      style={{ backgroundColor: colorName }}
      className="inline-block w-4 h-4 rounded-full border border-black/10 shrink-0"
    />
  );
}
