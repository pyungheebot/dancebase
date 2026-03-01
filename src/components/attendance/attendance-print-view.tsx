"use client";

import type { PdfReportData } from "@/lib/attendance-pdf-data";
import {
  PrintLayout,
  PrintSummaryCard,
  thStyle,
  tdStyle,
} from "@/components/shared/print-layout";

type Props = {
  data: PdfReportData;
};

function rateColor(rate: number): string {
  if (rate >= 80) return "#16a34a"; // green-600
  if (rate >= 50) return "#ca8a04"; // yellow-600
  return "#ef4444"; // red-500
}

export function AttendancePrintView({ data }: Props) {
  const { header, memberRows, summary } = data;

  return (
    <PrintLayout
      title="출석 요약 보고서"
      groupName={header.groupName}
      periodLabel={header.periodLabel}
      generatedAt={header.generatedAt}
      footnote={
        <p
          style={{
            fontSize: "10px",
            color: "#9ca3af",
            marginTop: "10px",
          }}
        >
          * 출석률 = (출석 + 지각) / 전체 일정 수 × 100. 조퇴는 결석으로 집계됩니다.
        </p>
      }
    >
      {/* ===== 요약 통계 ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <PrintSummaryCard
          label="전체 출석률"
          value={`${summary.overallRate}%`}
          valueColor={rateColor(summary.overallRate)}
        />
        <PrintSummaryCard
          label="총 일정 수"
          value={`${summary.totalSchedules}회`}
        />
        <PrintSummaryCard
          label="총 멤버 수"
          value={`${summary.totalMembers}명`}
        />
        <PrintSummaryCard
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
    </PrintLayout>
  );
}
