"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  Printer,
  Loader2,
  CalendarRange,
  CheckCircle2,
  TrendingUp,
  Flame,
} from "lucide-react";
import { useAttendanceCertificate } from "@/hooks/use-attendance-certificate";
import { format, subMonths } from "date-fns";

type AttendanceCertificateDialogProps = {
  groupId: string;
  userId: string;
};

function getDefaultPeriod() {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  return {
    start: format(threeMonthsAgo, "yyyy-MM-dd"),
    end: format(today, "yyyy-MM-dd"),
  };
}

function formatDisplayDate(dateStr: string) {
  return dateStr.replace(/-/g, ".");
}

function formatIsoToDisplay(dateStr: string) {
  // YYYY-MM-DD -> YYYY년 MM월 DD일
  const [y, m, d] = dateStr.split("-");
  return `${y}년 ${m}월 ${d}일`;
}

export function AttendanceCertificateDialog({
  groupId,
  userId,
}: AttendanceCertificateDialogProps) {
  const defaults = getDefaultPeriod();
  const [open, setOpen] = useState(false);
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [queryStart, setQueryStart] = useState(defaults.start);
  const [queryEnd, setQueryEnd] = useState(defaults.end);
  const printRef = useRef<HTMLDivElement>(null);

  const { certificate, loading, error } = useAttendanceCertificate({
    groupId,
    userId,
    periodStart: queryStart,
    periodEnd: queryEnd,
  });

  const handleGenerate = useCallback(() => {
    if (!periodStart || !periodEnd) return;
    if (periodStart > periodEnd) return;
    setQueryStart(periodStart);
    setQueryEnd(periodEnd);
  }, [periodStart, periodEnd]);

  const handlePrint = useCallback(() => {
    // window.print()와 @media print CSS를 활용한 안전한 인쇄
    // innerHTML이나 iframeDoc.write()를 사용하지 않음
    window.print();
  }, []);

  const isInvalidRange = periodStart > periodEnd;

  return (
    <>
      {/* 인쇄 전용 CSS — 화면에는 숨김 */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #attendance-certificate-print,
          #attendance-certificate-print * { visibility: visible !important; }
          #attendance-certificate-print {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            background: white !important;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Award className="h-3 w-3" />
            출석 인증서
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-amber-500" />
              출석 인증서 발급
            </DialogTitle>
          </DialogHeader>

          {/* 기간 선택 */}
          <div className="space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarRange className="h-3 w-3" />
                  시작일
                </Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <span className="text-xs text-muted-foreground pb-2">~</span>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">종료일</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={handleGenerate}
                disabled={isInvalidRange || loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "조회"
                )}
              </Button>
            </div>

            {isInvalidRange && (
              <p className="text-xs text-red-500">
                시작일은 종료일보다 이전이어야 합니다.
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500">
                데이터를 불러오는 중 오류가 발생했습니다.
              </p>
            )}
          </div>

          <Separator />

          {/* 인증서 미리보기 */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                출석 데이터를 집계하는 중...
              </p>
            </div>
          ) : certificate ? (
            <>
              {/* 인쇄 시 캡처될 영역 */}
              <div id="attendance-certificate-print" ref={printRef}>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "620px",
                    margin: "0 auto",
                    padding: "40px 44px",
                    border: "3px solid #1e3a5f",
                    position: "relative",
                    background: "#ffffff",
                    fontFamily:
                      "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
                  }}
                >
                  {/* 내부 금색 테두리 */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "8px",
                      border: "1px solid #c8a84b",
                      pointerEvents: "none",
                    }}
                  />

                  {/* 모서리 장식 */}
                  {[
                    { top: "14px", left: "14px", borderTop: "2px solid #c8a84b", borderLeft: "2px solid #c8a84b" },
                    { top: "14px", right: "14px", borderTop: "2px solid #c8a84b", borderRight: "2px solid #c8a84b" },
                    { bottom: "14px", left: "14px", borderBottom: "2px solid #c8a84b", borderLeft: "2px solid #c8a84b" },
                    { bottom: "14px", right: "14px", borderBottom: "2px solid #c8a84b", borderRight: "2px solid #c8a84b" },
                  ].map((style, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "28px",
                        height: "28px",
                        ...style,
                      }}
                    />
                  ))}

                  {/* 본문 */}
                  <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                    {/* 그룹명 */}
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        letterSpacing: "5px",
                        marginBottom: "14px",
                        textTransform: "uppercase" as const,
                      }}
                    >
                      {certificate.groupName}
                    </p>

                    {/* 장식 구분선 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        margin: "0 0 16px",
                      }}
                    >
                      <div
                        style={{
                          height: "1px",
                          width: "72px",
                          background: "linear-gradient(to right, transparent, #c8a84b)",
                        }}
                      />
                      <div
                        style={{
                          width: "7px",
                          height: "7px",
                          background: "#c8a84b",
                          transform: "rotate(45deg)",
                        }}
                      />
                      <div
                        style={{
                          height: "1px",
                          width: "72px",
                          background: "linear-gradient(to left, transparent, #c8a84b)",
                        }}
                      />
                    </div>

                    {/* 인증서 제목 */}
                    <p
                      style={{
                        fontSize: "30px",
                        fontWeight: 700,
                        color: "#1e3a5f",
                        letterSpacing: "10px",
                        margin: "0 0 6px",
                      }}
                    >
                      출석 인증서
                    </p>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        letterSpacing: "3px",
                        marginBottom: "24px",
                      }}
                    >
                      ATTENDANCE CERTIFICATE
                    </p>

                    {/* 멤버 이름 */}
                    <div style={{ margin: "20px 0 18px" }}>
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          letterSpacing: "2px",
                          marginBottom: "8px",
                        }}
                      >
                        성 명
                      </p>
                      <p
                        style={{
                          fontSize: "24px",
                          fontWeight: 700,
                          color: "#111827",
                          letterSpacing: "6px",
                        }}
                      >
                        {certificate.memberName}
                      </p>
                      <div
                        style={{
                          width: "140px",
                          height: "1px",
                          background: "#1e3a5f",
                          margin: "8px auto 0",
                        }}
                      />
                    </div>

                    {/* 기간 */}
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#4b5563",
                        letterSpacing: "1px",
                        margin: "16px 0",
                      }}
                    >
                      <span style={{ color: "#9ca3af", fontSize: "11px", marginRight: "8px" }}>
                        기간
                      </span>
                      {formatDisplayDate(certificate.periodStart)}
                      {" ~ "}
                      {formatDisplayDate(certificate.periodEnd)}
                    </p>

                    {/* 본문 설명 */}
                    <p
                      style={{
                        fontSize: "13px",
                        lineHeight: "2",
                        color: "#374151",
                        maxWidth: "440px",
                        margin: "0 auto 24px",
                      }}
                    >
                      위 사람은 상기 기간 동안{" "}
                      <strong style={{ color: "#1e3a5f" }}>
                        {certificate.groupName}
                      </strong>
                      의 활동에 성실히 참여하였음을 인증합니다.
                    </p>

                    {/* 장식 구분선 */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        margin: "0 0 20px",
                      }}
                    >
                      <div
                        style={{
                          height: "1px",
                          width: "60px",
                          background: "linear-gradient(to right, transparent, #e5e7eb)",
                        }}
                      />
                      <div
                        style={{
                          width: "5px",
                          height: "5px",
                          background: "#e5e7eb",
                          transform: "rotate(45deg)",
                        }}
                      />
                      <div
                        style={{
                          height: "1px",
                          width: "60px",
                          background: "linear-gradient(to left, transparent, #e5e7eb)",
                        }}
                      />
                    </div>

                    {/* 통계 카드 3개 */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "12px",
                        margin: "0 0 24px",
                      }}
                    >
                      {/* 출석 횟수 */}
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderTop: "2px solid #c8a84b",
                          padding: "12px 8px",
                          background: "#fafafa",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "9px",
                            color: "#9ca3af",
                            letterSpacing: "1px",
                            marginBottom: "6px",
                          }}
                        >
                          총 출석 횟수
                        </p>
                        <p
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#1e3a5f",
                            lineHeight: 1,
                          }}
                        >
                          {certificate.attendedCount}
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginLeft: "2px",
                            }}
                          >
                            /{certificate.totalSchedules}
                          </span>
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            marginTop: "3px",
                          }}
                        >
                          회
                        </p>
                      </div>

                      {/* 출석률 */}
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderTop: "2px solid #c8a84b",
                          padding: "12px 8px",
                          background: "#fafafa",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "9px",
                            color: "#9ca3af",
                            letterSpacing: "1px",
                            marginBottom: "6px",
                          }}
                        >
                          출석률
                        </p>
                        <p
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#1e3a5f",
                            lineHeight: 1,
                          }}
                        >
                          {certificate.attendanceRate}
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginLeft: "1px",
                            }}
                          >
                            %
                          </span>
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            marginTop: "3px",
                          }}
                        >
                          참여율
                        </p>
                      </div>

                      {/* 최장 연속 출석 */}
                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderTop: "2px solid #c8a84b",
                          padding: "12px 8px",
                          background: "#fafafa",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "9px",
                            color: "#9ca3af",
                            letterSpacing: "1px",
                            marginBottom: "6px",
                          }}
                        >
                          최장 연속 출석
                        </p>
                        <p
                          style={{
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#1e3a5f",
                            lineHeight: 1,
                          }}
                        >
                          {certificate.longestStreak}
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              marginLeft: "2px",
                            }}
                          >
                            회
                          </span>
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#6b7280",
                            marginTop: "3px",
                          }}
                        >
                          연속
                        </p>
                      </div>
                    </div>

                    {/* 발행일 */}
                    <div
                      style={{
                        marginTop: "20px",
                        paddingTop: "16px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          color: "#9ca3af",
                          letterSpacing: "1px",
                          marginBottom: "4px",
                        }}
                      >
                        발행일
                      </p>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {formatIsoToDisplay(certificate.issuedAt)}
                      </p>
                    </div>

                    {/* 워터마크 */}
                    <p
                      style={{
                        marginTop: "18px",
                        fontSize: "10px",
                        color: "#d1d5db",
                        letterSpacing: "2px",
                      }}
                    >
                      DanceBase에서 발행됨
                    </p>
                  </div>
                </div>
              </div>

              {/* 통계 요약 (다이얼로그 하단) */}
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="flex items-center gap-1.5 rounded-md border px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">출석</p>
                    <p className="text-xs font-semibold tabular-nums">
                      {certificate.attendedCount}/{certificate.totalSchedules}회
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border px-3 py-2">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">출석률</p>
                    <p className="text-xs font-semibold tabular-nums">
                      {certificate.attendanceRate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-md border px-3 py-2">
                  <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">최장 연속</p>
                    <p className="text-xs font-semibold tabular-nums">
                      {certificate.longestStreak}회
                    </p>
                  </div>
                </div>
              </div>

              {/* 인쇄 버튼 */}
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handlePrint}
                >
                  <Printer className="h-3 w-3" />
                  인쇄
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Award className="h-8 w-8 opacity-20" />
              <p className="text-xs">기간을 선택하고 조회 버튼을 눌러주세요.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
