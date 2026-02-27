/**
 * 범용 CSV 생성 및 다운로드 유틸리티
 * UTF-8 BOM 포함 — 한글 Excel 호환
 */

/** 단일 셀 값을 CSV 안전 문자열로 변환 */
function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 헤더 + 행 배열을 UTF-8 BOM 포함 CSV 문자열로 변환
 * @param headers 헤더 행
 * @param rows    데이터 행 배열 (각 셀은 string)
 */
export function generateCSV(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}

/**
 * CSV 문자열을 파일로 다운로드
 * BOM(\uFEFF) 추가로 Excel 한글 깨짐 방지
 * @param filename    파일명 (.csv 자동 추가)
 * @param csvContent  CSV 문자열
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
