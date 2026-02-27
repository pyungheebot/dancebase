/**
 * CSV 내보내기 유틸리티
 *
 * 사용 예시:
 *   exportToCsv("멤버목록", ["이름", "역할", "가입일"], rows);
 */

/** 단일 셀 값을 CSV 안전 문자열로 변환 */
function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  // 쉼표, 줄바꿈, 큰따옴표 포함 시 큰따옴표로 감쌈
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 2차원 데이터 배열을 CSV 문자열로 변환
 * @param headers 헤더 행
 * @param rows    데이터 행 배열
 */
export function toCsvString(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(","));
  }
  return lines.join("\r\n");
}

/**
 * CSV 문자열을 파일로 다운로드
 * @param filename 파일명 (.csv 자동 추가)
 * @param csv      CSV 문자열
 */
export function downloadCsv(filename: string, csv: string): void {
  // BOM 추가 — Excel 한글 깨짐 방지
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 헤더 + 데이터 행을 CSV 파일로 즉시 내보내기
 * @param filename 파일명
 * @param headers  헤더 행
 * @param rows     데이터 행 배열
 */
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csv = toCsvString(headers, rows);
  downloadCsv(filename, csv);
}
