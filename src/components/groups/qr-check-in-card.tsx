"use client";

import { useState } from "react";
import {
  QrCode,
  Plus,
  Users,
  CheckCircle2,
  StopCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Clock,
  CalendarDays,
  BarChart3,
  RefreshCw,
  X,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQrCheckIn } from "@/hooks/use-qr-check-in";
import type { QrCheckInSession, QrCheckInRecord } from "@/types";

// ============================================================
// Props
// ============================================================

type Props = {
  groupId: string;
  memberNames?: string[];
};

// ============================================================
// 서브 컴포넌트 - QR 코드 디스플레이
// ============================================================

function QrCodeDisplay({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {/* QR 코드 시뮬레이션 - 텍스트 기반 */}
      <div className="relative border-4 border-gray-800 rounded-lg p-4 bg-white w-40 h-40 flex flex-col items-center justify-center gap-1">
        {/* 모서리 마커 */}
        <div className="absolute top-2 left-2 w-7 h-7 border-4 border-gray-800 rounded-sm" />
        <div className="absolute top-2 right-2 w-7 h-7 border-4 border-gray-800 rounded-sm" />
        <div className="absolute bottom-2 left-2 w-7 h-7 border-4 border-gray-800 rounded-sm" />
        {/* 내부 패턴 (CSS dot grid) */}
        <div className="grid grid-cols-5 gap-0.5 z-10">
          {Array.from({ length: 25 }).map((_, i) => {
            // 코드 문자를 기반으로 의사 랜덤 패턴 생성
            const charCode = code.charCodeAt(i % code.length);
            const filled = (charCode + i * 7 + i) % 3 !== 0;
            return (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-[1px]",
                  filled ? "bg-gray-800" : "bg-transparent"
                )}
              />
            );
          })}
        </div>
      </div>
      {/* 코드 텍스트 */}
      <div className="font-mono text-lg font-bold tracking-[0.3em] text-gray-800 bg-gray-100 px-4 py-1.5 rounded-md border border-gray-200">
        {code}
      </div>
      <p className="text-[11px] text-gray-500">위 코드를 입력하거나 화면을 보여주세요</p>
    </div>
  );
}

// ============================================================
// 서브 컴포넌트 - 세션 카드
// ============================================================

function SessionCard({
  session,
  records,
  memberNames,
  onEnd,
  onDelete,
  onCheckIn,
  onCheckInByQr,
  onRemoveRecord,
}: {
  session: QrCheckInSession;
  records: QrCheckInRecord[];
  memberNames: string[];
  onEnd: (id: string) => void;
  onDelete: (id: string) => void;
  onCheckIn: (sessionId: string, memberName: string) => void;
  onCheckInByQr: (qrCode: string, memberName: string) => void;
  onRemoveRecord: (recordId: string) => void;
}) {
  const [open, setOpen] = useState(session.isActive);
  const [manualName, setManualName] = useState("");
  const [qrInput, setQrInput] = useState("");
  const [qrName, setQrName] = useState("");

  const handleManualCheckIn = () => {
    const name = manualName.trim();
    if (!name) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    onCheckIn(session.id, name);
    setManualName("");
  };

  const handleQrCheckIn = () => {
    const code = qrInput.trim().toUpperCase();
    const name = qrName.trim();
    if (!code) {
      toast.error("QR 코드를 입력해주세요.");
      return;
    }
    if (!name) {
      toast.error("멤버 이름을 입력해주세요.");
      return;
    }
    onCheckInByQr(code, name);
    setQrInput("");
    setQrName("");
  };

  const checkinCount = records.length;
  const memberCount = memberNames.length;
  const rate =
    memberCount > 0 ? Math.round((checkinCount / memberCount) * 100) : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "border rounded-lg overflow-hidden",
          session.isActive
            ? "border-green-300 bg-green-50/40"
            : "border-gray-200 bg-white"
        )}
      >
        {/* 세션 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-gray-50/80 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              {session.isActive ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-gray-900 truncate">
                {session.title}
              </span>
              {session.isActive && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  진행 중
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-gray-500">
                {checkinCount}명 체크인
              </span>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-gray-100">
            {/* 세션 메타 정보 */}
            <div className="flex items-center gap-3 pt-2.5 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {session.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.startTime}
                {session.endTime ? ` ~ ${session.endTime}` : " ~"}
              </span>
            </div>

            {/* QR 코드 표시 (활성 세션만) */}
            {session.isActive && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                  <QrCode className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-xs font-medium text-gray-700">
                    출석 QR 코드
                  </span>
                </div>
                <QrCodeDisplay code={session.qrCode} />
              </div>
            )}

            {/* QR 코드 체크인 폼 (활성 세션만) */}
            {session.isActive && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-600">
                  QR 코드로 체크인
                </p>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="QR 코드 입력"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value.toUpperCase())}
                    className="h-7 text-xs font-mono tracking-wider"
                    onKeyDown={(e) => e.key === "Enter" && handleQrCheckIn()}
                  />
                  <Input
                    placeholder="이름"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    className="h-7 text-xs w-24 flex-shrink-0"
                    list={`qr-names-${session.id}`}
                    onKeyDown={(e) => e.key === "Enter" && handleQrCheckIn()}
                  />
                  <datalist id={`qr-names-${session.id}`}>
                    {memberNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <Button
                    size="sm"
                    className="h-7 text-xs px-2.5 flex-shrink-0"
                    onClick={handleQrCheckIn}
                  >
                    <QrCode className="h-3 w-3 mr-1" />
                    확인
                  </Button>
                </div>
              </div>
            )}

            {/* 수동 체크인 폼 (활성 세션만) */}
            {session.isActive && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-gray-600">
                  수동 체크인
                </p>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="멤버 이름 입력"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="h-7 text-xs"
                    list={`manual-names-${session.id}`}
                    onKeyDown={(e) => e.key === "Enter" && handleManualCheckIn()}
                  />
                  <datalist id={`manual-names-${session.id}`}>
                    {memberNames.map((n) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs px-2.5 flex-shrink-0"
                    onClick={handleManualCheckIn}
                  >
                    <UserCheck className="h-3 w-3 mr-1" />
                    추가
                  </Button>
                </div>
              </div>
            )}

            {/* 출석 현황 바 */}
            {memberCount > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>출석 현황</span>
                  <span>
                    {checkinCount} / {memberCount}명 ({rate}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            )}

            {/* 체크인 목록 */}
            {records.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-gray-600">
                  체크인 목록
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {records.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between bg-white border border-gray-100 rounded px-2 py-1"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-800 truncate">
                          {r.memberName}
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] px-1 py-0",
                            r.method === "qr"
                              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          )}
                        >
                          {r.method === "qr" ? "QR" : "수동"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">
                          {new Date(r.checkedInAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                        </span>
                        <button
                          onClick={() => onRemoveRecord(r.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                          title="체크인 취소"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 text-center py-2">
                아직 체크인한 멤버가 없습니다.
              </p>
            )}

            {/* 세션 액션 */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              {session.isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
                  onClick={() => onEnd(session.id)}
                >
                  <StopCircle className="h-3 w-3 mr-1" />
                  세션 종료
                </Button>
              ) : (
                <div />
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(session.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                삭제
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================================
// 서브 컴포넌트 - 통계 패널
// ============================================================

function StatsPanel({
  totalSessions,
  totalCheckIns,
  averageAttendance,
  ranking,
}: {
  totalSessions: number;
  totalCheckIns: number;
  averageAttendance: number;
  ranking: Array<{ memberName: string; count: number }>;
}) {
  const maxCount = ranking[0]?.count ?? 0;

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "총 세션", value: totalSessions, unit: "회" },
          { label: "총 체크인", value: totalCheckIns, unit: "건" },
          { label: "세션 평균", value: averageAttendance, unit: "명" },
        ].map(({ label, value, unit }) => (
          <div
            key={label}
            className="bg-gray-50 border border-gray-100 rounded-lg px-2 py-2.5 text-center"
          >
            <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
            <p className="text-base font-bold text-gray-900">
              {value}
              <span className="text-[11px] font-normal text-gray-500 ml-0.5">
                {unit}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* 멤버 참여 순위 */}
      {ranking.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">멤버 참여 순위</p>
          <div className="space-y-1.5">
            {ranking.slice(0, 8).map((item, idx) => (
              <div key={item.memberName} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-4 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs text-gray-700 w-20 truncate flex-shrink-0">
                  {item.memberName}
                </span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      idx === 0
                        ? "bg-yellow-400"
                        : idx === 1
                        ? "bg-gray-400"
                        : idx === 2
                        ? "bg-orange-400"
                        : "bg-indigo-300"
                    )}
                    style={{
                      width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 flex-shrink-0 w-8 text-right">
                  {item.count}회
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function QrCheckInCard({ groupId, memberNames = [] }: Props) {
  const {
    sessions,
    records,
    loading,
    createSession,
    endSession,
    deleteSession,
    checkIn,
    checkInByQr,
    removeCheckIn,
    getSessionRecords,
    activeSession,
    totalSessions,
    totalCheckIns,
    averageAttendance,
    memberAttendanceRanking,
  } = useQrCheckIn(groupId);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // 새 세션 폼 상태
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [formStartTime, setFormStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });

  const handleCreate = () => {
    const title = formTitle.trim();
    if (!title) {
      toast.error("세션 제목을 입력해주세요.");
      return;
    }
    if (!formDate) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!formStartTime) {
      toast.error("시작 시간을 입력해주세요.");
      return;
    }
    createSession(title, formDate, formStartTime);
    toast.success("새 출석 세션이 생성되었습니다.");
    setShowCreateDialog(false);
    setFormTitle("");
  };

  const handleEnd = (sessionId: string) => {
    endSession(sessionId);
    toast.success("세션이 종료되었습니다.");
  };

  const handleDelete = (sessionId: string) => {
    deleteSession(sessionId);
    toast.success("세션이 삭제되었습니다.");
  };

  const handleCheckIn = (sessionId: string, memberName: string) => {
    const result = checkIn(sessionId, memberName);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleCheckInByQr = (qrCode: string, memberName: string) => {
    const result = checkInByQr(qrCode, memberName);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <Card className="border-gray-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                QR 출석 체크인
              </h3>
              {activeSession && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  세션 진행 중
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-gray-500"
                onClick={() => setShowStats((v) => !v)}
                title="통계 보기"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                새 세션
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          {/* 통계 패널 */}
          {showStats && (
            <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
              <StatsPanel
                totalSessions={totalSessions}
                totalCheckIns={totalCheckIns}
                averageAttendance={averageAttendance}
                ranking={memberAttendanceRanking}
              />
            </div>
          )}

          {/* 세션 목록 */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400 ml-2">불러오는 중...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <QrCode className="h-8 w-8 text-gray-200" />
              <p className="text-sm text-gray-500 font-medium">
                출석 세션이 없습니다
              </p>
              <p className="text-xs text-gray-400">
                "새 세션" 버튼을 눌러 출석 체크인을 시작하세요.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs mt-1"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                첫 세션 만들기
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  records={getSessionRecords(session.id)}
                  memberNames={memberNames}
                  onEnd={handleEnd}
                  onDelete={handleDelete}
                  onCheckIn={handleCheckIn}
                  onCheckInByQr={handleCheckInByQr}
                  onRemoveRecord={removeCheckIn}
                />
              ))}
            </div>
          )}

          {/* 하단 요약 */}
          {sessions.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                총 {totalSessions}회 세션 · {totalCheckIns}건 체크인
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 세션 생성 다이얼로그 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <QrCode className="h-4 w-4 text-indigo-500" />
              새 출석 세션 만들기
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">
                세션 제목 <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="예: 2024년 2월 정기 연습"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  날짜 <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">
                  시작 시간 <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <p className="text-[11px] text-gray-400">
              세션을 생성하면 자동으로 QR 코드가 발급됩니다.
              기존 활성 세션이 있으면 자동으로 종료됩니다.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setShowCreateDialog(false)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleCreate}
            >
              <Plus className="h-3 w-3 mr-1" />
              세션 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
