"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAttendanceBook } from "@/hooks/use-attendance-book";
import type { BookAttendanceStatus } from "@/types";

// ——————————————————————————————
// 상수 / 유틸
// ——————————————————————————————

const STATUS_CONFIG: Record<
  BookAttendanceStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  present: {
    label: "출석",
    color: "bg-green-500 hover:bg-green-600 text-white",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  absent: {
    label: "결석",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: <XCircle className="h-3 w-3" />,
  },
  late: {
    label: "지각",
    color: "bg-yellow-500 hover:bg-yellow-600 text-white",
    icon: <Clock className="h-3 w-3" />,
  },
  excused: {
    label: "사유",
    color: "bg-blue-500 hover:bg-blue-600 text-white",
    icon: <ShieldCheck className="h-3 w-3" />,
  },
};

const STATUS_CYCLE: BookAttendanceStatus[] = ["present", "absent", "late", "excused"];

function nextStatus(current: BookAttendanceStatus): BookAttendanceStatus {
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ——————————————————————————————
// 출석부 생성 다이얼로그
// ——————————————————————————————

interface CreateSheetDialogProps {
  open: boolean;
  onClose: () => void;
  memberNames: string[];
  onConfirm: (params: { date: string; title: string; memberNames: string[] }) => void;
}

function CreateSheetDialog({ open, onClose, memberNames, onConfirm }: CreateSheetDialogProps) {
  const [date, setDate] = useState(todayString());
  const [title, setTitle] = useState("");

  function handleSubmit() {
    if (!date) {
      toast.error("날짜를 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (memberNames.length === 0) {
      toast.error("그룹에 멤버가 없습니다.");
      return;
    }
    onConfirm({ date, title: title.trim(), memberNames });
    setDate(todayString());
    setTitle("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">새 출석부 만들기</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <Label className="text-xs">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">제목</Label>
            <Input
              placeholder="예: 정기 연습, 공연 리허설"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-2">
            <p className="text-[10px] text-muted-foreground mb-1">포함 멤버 ({memberNames.length}명)</p>
            <div className="flex flex-wrap gap-1">
              {memberNames.length === 0 ? (
                <span className="text-[10px] text-muted-foreground">멤버 없음</span>
              ) : (
                memberNames.map((name) => (
                  <Badge key={name} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {name}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ——————————————————————————————
// 메인 컴포넌트
// ——————————————————————————————

interface AttendanceBookCardProps {
  groupId: string;
  memberNames: string[];
}

export function AttendanceBookCard({ groupId, memberNames }: AttendanceBookCardProps) {
  const {
    book,
    loading,
    createSheet,
    deleteSheet,
    updateRecord,
    bulkSetPresent,
    totalSheets,
    overallAttendanceRate,
    memberAttendanceStats,
  } = useAttendanceBook(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);

  function handleCreate(params: { date: string; title: string; memberNames: string[] }) {
    createSheet(params);
    toast.success("출석부가 생성되었습니다.");
  }

  function handleDelete(sheetId: string) {
    deleteSheet(sheetId);
    if (expandedSheet === sheetId) setExpandedSheet(null);
    toast.success("출석부가 삭제되었습니다.");
  }

  function handleToggleStatus(sheetId: string, memberName: string, current: BookAttendanceStatus) {
    const next = nextStatus(current);
    updateRecord(sheetId, memberName, next);
  }

  function handleBulkPresent(sheetId: string) {
    bulkSetPresent(sheetId);
    toast.success("전체 출석 처리되었습니다.");
  }

  return (
    <>
      <CreateSheetDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        memberNames={memberNames}
        onConfirm={handleCreate}
      />

      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">그룹 출석부</span>
                {totalSheets > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {totalSheets}개
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {totalSheets > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStats((v) => !v);
                    }}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    통계
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreate(true);
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  새 출석부
                </Button>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 px-4 pb-4 space-y-3">

              {/* 전체 출석률 */}
              {totalSheets > 0 && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">전체 출석률</span>
                    <span className="text-xs font-semibold text-foreground">
                      {overallAttendanceRate}%
                    </span>
                  </div>
                  <Progress value={overallAttendanceRate} className="h-1.5" />
                </div>
              )}

              {/* 멤버별 출석률 차트 (통계 패널) */}
              {showStats && memberAttendanceStats.length > 0 && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">멤버별 출석률</span>
                  </div>
                  <div className="space-y-2">
                    {memberAttendanceStats.map((stat, idx) => (
                      <div key={stat.memberName} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground w-4 text-right">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium">{stat.memberName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">
                              {stat.present + stat.late}/{stat.total}
                            </span>
                            <span className="text-xs font-semibold w-8 text-right">
                              {stat.rate}%
                            </span>
                          </div>
                        </div>
                        {/* CSS div 기반 막대 차트 */}
                        <div className="ml-5 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500 transition-all duration-300"
                            style={{ width: `${stat.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 범례 */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t">
                    {(["present", "late", "absent", "excused"] as BookAttendanceStatus[]).map((s) => (
                      <div key={s} className="flex items-center gap-1">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            s === "present"
                              ? "bg-green-500"
                              : s === "absent"
                              ? "bg-red-500"
                              : s === "late"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {STATUS_CONFIG[s].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 출석부 리스트 */}
              {loading ? (
                <div className="text-center py-6 text-xs text-muted-foreground">불러오는 중...</div>
              ) : book.sheets.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">아직 출석부가 없습니다.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    첫 출석부 만들기
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {book.sheets.map((sheet) => {
                    const presentCount = sheet.records.filter(
                      (r) => r.status === "present" || r.status === "late"
                    ).length;
                    const total = sheet.records.length;
                    const rate = total === 0 ? 0 : Math.round((presentCount / total) * 100);
                    const isExpanded = expandedSheet === sheet.id;

                    return (
                      <div key={sheet.id} className="rounded-md border overflow-hidden">
                        {/* 시트 헤더 */}
                        <div
                          className="flex items-center justify-between px-3 py-2 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() =>
                            setExpandedSheet(isExpanded ? null : sheet.id)
                          }
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">{sheet.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDate(sheet.date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-semibold">{rate}%</span>
                              <p className="text-[10px] text-muted-foreground">
                                {presentCount}/{total}명
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(sheet.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* 출석률 진행 바 */}
                        <div className="h-1 bg-muted">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${rate}%` }}
                          />
                        </div>

                        {/* 확장 영역: 멤버 목록 */}
                        {isExpanded && (
                          <div className="px-3 py-2 space-y-2">
                            {/* 전체 출석 버튼 */}
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px]"
                                onClick={() => handleBulkPresent(sheet.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                전체 출석
                              </Button>
                            </div>

                            {/* 멤버 출석 상태 */}
                            <div className="grid grid-cols-1 gap-1.5">
                              {sheet.records.map((rec) => {
                                const cfg = STATUS_CONFIG[rec.status];
                                return (
                                  <div
                                    key={rec.memberName}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <span className="text-xs font-medium truncate flex-1">
                                      {rec.memberName}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleToggleStatus(sheet.id, rec.memberName, rec.status)
                                      }
                                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${cfg.color}`}
                                    >
                                      {cfg.icon}
                                      {cfg.label}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            {/* 상태 요약 뱃지 */}
                            <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                              {(["present", "late", "absent", "excused"] as BookAttendanceStatus[]).map(
                                (s) => {
                                  const count = sheet.records.filter((r) => r.status === s).length;
                                  if (count === 0) return null;
                                  return (
                                    <Badge
                                      key={s}
                                      variant="outline"
                                      className={`text-[10px] px-1.5 py-0 ${
                                        s === "present"
                                          ? "border-green-300 text-green-700"
                                          : s === "absent"
                                          ? "border-red-300 text-red-700"
                                          : s === "late"
                                          ? "border-yellow-300 text-yellow-700"
                                          : "border-blue-300 text-blue-700"
                                      }`}
                                    >
                                      {STATUS_CONFIG[s].label} {count}
                                    </Badge>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </>
  );
}
