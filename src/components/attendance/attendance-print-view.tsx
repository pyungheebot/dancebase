"use client";

import { useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PdfReportData } from "@/lib/attendance-pdf-data";

type Props = {
  data: PdfReportData;
};

function rateColor(rate: number): string {
  if (rate >= 80) return "#16a34a"; // green-600
  if (rate >= 50) return "#ca8a04"; // yellow-600
  return "#ef4444"; // red-500
}

export function AttendancePrintView({ data }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const { header, memberRows, summary } = data;

  return (
    <div>
      {/* 인쇄 버튼 — 화면에서만 표시 */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} size="sm" className="gap-1.5">
          <Printer className="h-4 w-4" />
          인쇄 / PDF 저장
        </Button>
      </div>

      {/* 인쇄 영역 */}
      <div
        ref={printRef}
        className="bg-white text-black print:p-0"
        style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', sans-serif" }}
      >
        {/* 전역 인쇄 스타일 */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            body * {
              visibility: hidden;
            }
            .print-area,
            .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>

        <div className="print-area">
          {/* ===== 보고서 헤더 ===== */}
          <div
            style={{
              borderBottom: "2px solid #000",
              paddingBottom: "12px",
              marginBottom: "16px",
            }}
          >
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                margin: "0 0 4px 0",
              }}
            >
              출석 요약 보고서
            </h1>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <p style={{ fontSize: "13px", margin: "2px 0", color: "#374151" }}>
                  <span style={{ fontWeight: "600" }}>그룹:</span>{" "}
                  {header.groupName}
                </p>
                <p style={{ fontSize: "13px", margin: "2px 0", color: "#374151" }}>
                  <span style={{ fontWeight: "600" }}>기간:</span>{" "}
                  {header.periodLabel}
                </p>
              </div>
              <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                생성일: {header.generatedAt}
              </p>
            </div>
          </div>

          {/* ===== 요약 통계 ===== */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <SummaryCard
              label="전체 출석률"
              value={`${summary.overallRate}%`}
              valueColor={rateColor(summary.overallRate)}
            />
            <SummaryCard
              label="총 일정 수"
              value={`${summary.totalSchedules}회`}
            />
            <SummaryCard
              label="총 멤버 수"
              value={`${summary.totalMembers}명`}
            />
            <SummaryCard
              label="최다 출석자"
              value={summary.topAttendee ?? "-"}
            />
          </div>

          {/* ===== 멤버별 출석 현황 테이블 ===== */}
          <h2
            style={{
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "8px",
              borderLeft: "3px solid #000",
              paddingLeft: "8px",
            }}
          >
            멤버별 출석 현황
          </h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={thStyle({ width: "40px", textAlign: "center" })}>
                  순위
                </th>
                <th style={thStyle({ textAlign: "left" })}>이름</th>
                <th style={thStyle({ width: "60px", textAlign: "center" })}>
                  출석
                </th>
                <th style={thStyle({ width: "60px", textAlign: "center" })}>
                  지각
                </th>
                <th style={thStyle({ width: "60px", textAlign: "center" })}>
                  결석
                </th>
                <th style={thStyle({ width: "70px", textAlign: "center" })}>
                  전체
                </th>
                <th style={thStyle({ width: "80px", textAlign: "right" })}>
                  출석률
                </th>
              </tr>
            </thead>
            <tbody>
              {memberRows.map((row, idx) => (
                <tr
                  key={row.name}
                  style={{
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f9fafb",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  <td style={tdStyle({ textAlign: "center", color: "#6b7280" })}>
                    {row.rank}
                  </td>
                  <td style={tdStyle({ fontWeight: "500" })}>
                    {row.name}
                    {row.rank === 1 && row.rate > 0 && (
                      <span
                        style={{
                          marginLeft: "6px",
                          fontSize: "10px",
                          color: "#92400e",
                          backgroundColor: "#fef3c7",
                          padding: "1px 5px",
                          borderRadius: "4px",
                        }}
                      >
                        1위
                      </span>
                    )}
                  </td>
                  <td
                    style={tdStyle({
                      textAlign: "center",
                      color: "#16a34a",
                      fontWeight: "600",
                    })}
                  >
                    {row.present}
                  </td>
                  <td
                    style={tdStyle({
                      textAlign: "center",
                      color: "#ca8a04",
                      fontWeight: "600",
                    })}
                  >
                    {row.late}
                  </td>
                  <td
                    style={tdStyle({
                      textAlign: "center",
                      color: "#ef4444",
                      fontWeight: "600",
                    })}
                  >
                    {row.absent}
                  </td>
                  <td
                    style={tdStyle({
                      textAlign: "center",
                      color: "#6b7280",
                    })}
                  >
                    {row.total}회
                  </td>
                  <td
                    style={tdStyle({
                      textAlign: "right",
                      fontWeight: "700",
                      color: rateColor(row.rate),
                    })}
                  >
                    {row.rate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===== 주석 ===== */}
          <p
            style={{
              fontSize: "10px",
              color: "#9ca3af",
              marginTop: "10px",
            }}
          >
            * 출석률 = (출석 + 지각) / 전체 일정 수 × 100. 조퇴는 결석으로 집계됩니다.
          </p>

          {/* ===== 인쇄용 푸터 ===== */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "10px",
              borderTop: "1px solid #d1d5db",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: "#9ca3af",
            }}
          >
            <span>Groop - 댄스 그룹 관리 플랫폼</span>
            <span>{header.generatedAt} 생성</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 헬퍼: 스타일 객체
// ============================================

function thStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: "7px 8px",
    fontSize: "11px",
    fontWeight: "600",
    borderBottom: "2px solid #d1d5db",
    ...extra,
  };
}

function tdStyle(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    padding: "6px 8px",
    fontSize: "12px",
    ...extra,
  };
}

// ============================================
// 요약 카드 (인라인 스타일)
// ============================================

function SummaryCard({
  label,
  value,
  valueColor = "#111827",
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "10px 12px",
        backgroundColor: "#f9fafb",
      }}
    >
      <p style={{ fontSize: "10px", color: "#6b7280", margin: "0 0 4px 0" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: "16px",
          fontWeight: "700",
          margin: 0,
          color: valueColor,
        }}
      >
        {value}
      </p>
    </div>
  );
}
