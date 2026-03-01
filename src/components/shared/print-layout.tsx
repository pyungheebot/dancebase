"use client";

import type { CSSProperties, ReactNode } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRINT_COLORS, printTableStyles } from "@/lib/print-styles";

// ============================================
// PrintLayout
// ============================================

type PrintLayoutProps = {
  title: string;
  groupName: string;
  periodLabel: string;
  generatedAt: string;
  printAreaClass?: string;
  extraPrintCss?: string;
  children: ReactNode;
  footnote?: ReactNode;
};

export function PrintLayout({
  title,
  groupName,
  periodLabel,
  generatedAt,
  printAreaClass = "print-area",
  extraPrintCss = "",
  children,
  footnote,
}: PrintLayoutProps) {
  const handlePrint = () => {
    window.print();
  };

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
            .${printAreaClass},
            .${printAreaClass} * {
              visibility: visible;
              color-scheme: light !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .${printAreaClass} {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background-color: ${PRINT_COLORS.white} !important;
              color: ${PRINT_COLORS.black} !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            ${extraPrintCss}
          }
        `}</style>

        <div className={printAreaClass}>
          {/* ===== 보고서 헤더 ===== */}
          <div
            style={{
              borderBottom: `2px solid ${PRINT_COLORS.black}`,
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
              {title}
            </h1>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div>
                <p style={{ fontSize: "13px", margin: "2px 0", color: PRINT_COLORS.dark }}>
                  <span style={{ fontWeight: "600" }}>그룹:</span>{" "}
                  {groupName}
                </p>
                <p style={{ fontSize: "13px", margin: "2px 0", color: PRINT_COLORS.dark }}>
                  <span style={{ fontWeight: "600" }}>기간:</span>{" "}
                  {periodLabel}
                </p>
              </div>
              <p style={{ fontSize: "11px", color: PRINT_COLORS.muted, margin: 0 }}>
                생성일: {generatedAt}
              </p>
            </div>
          </div>

          {/* ===== 콘텐츠 영역 ===== */}
          {children}

          {/* ===== 주석 (선택) ===== */}
          {footnote}

          {/* ===== 인쇄용 푸터 ===== */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "10px",
              borderTop: `1px solid ${PRINT_COLORS.borderStrong}`,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px",
              color: PRINT_COLORS.faint,
            }}
          >
            <span>Groop - 댄스 그룹 관리 플랫폼</span>
            <span>{generatedAt} 생성</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PrintSummaryCard
// ============================================

export function PrintSummaryCard({
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
        border: `1px solid ${PRINT_COLORS.border}`,
        borderRadius: "6px",
        padding: "10px 12px",
        backgroundColor: PRINT_COLORS.rowAltBg,
      }}
    >
      <p style={{ fontSize: "10px", color: PRINT_COLORS.muted, margin: "0 0 4px 0" }}>
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

// ============================================
// 헬퍼: 스타일 객체 (하위 호환 export)
// ============================================

export function thStyle(extra: CSSProperties = {}): CSSProperties {
  return printTableStyles.th(extra);
}

export function tdStyle(extra: CSSProperties = {}): CSSProperties {
  return printTableStyles.td(extra);
}
