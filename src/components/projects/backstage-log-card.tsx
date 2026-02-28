"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Radio,
  AlertTriangle,
  Info,
  Siren,
  MessageSquare,
  Plus,
  CheckCircle2,
  Trash2,
  Filter,
  Play,
  Square,
  CalendarDays,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useBackstageLog } from "@/hooks/use-backstage-log";
import type { BackstageLogCategory, BackstageLogSession } from "@/types";

// ============================================================
// 상수
// ============================================================

const CATEGORY_CONFIG: Record<
  BackstageLogCategory,
  {
    label: string;
    color: string;
    badgeClass: string;
    icon: React.ReactNode;
  }
> = {
  cue: {
    label: "큐",
    color: "blue",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    icon: <Radio className="h-3 w-3" />,
  },
  warning: {
    label: "경고",
    color: "yellow",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  info: {
    label: "정보",
    color: "green",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    icon: <Info className="h-3 w-3" />,
  },
  emergency: {
    label: "긴급",
    color: "red",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: <Siren className="h-3 w-3" />,
  },
  general: {
    label: "일반",
    color: "gray",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    icon: <MessageSquare className="h-3 w-3" />,
  },
};

// ============================================================
// 유틸
// ============================================================

function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
}

// ============================================================
// 세션 생성 다이얼로그
// ============================================================

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (showName: string, showDate: string) => void;
}) {
  const [showName, setShowName] = useState("");
  const [showDate, setShowDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!showName.trim()) {
      toast.error("공연명을 입력해주세요.");
      return;
    }
    if (!showDate) {
      toast.error("공연 날짜를 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      onCreate(showName.trim(), showDate);
      setShowName("");
      setShowDate(new Date().toISOString().split("T")[0]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 공연 세션 시작</DialogTitle>
          <DialogDescription className="text-xs">
            백스테이지 로그를 기록할 새 세션을 생성합니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">공연명</Label>
            <Input
              placeholder="예) 봄 정기공연 2회차"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">공연 날짜</Label>
            <Input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Play className="h-3 w-3 mr-1" />
            세션 시작
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 로그 항목 입력 폼
// ============================================================

function EntryForm({
  sessionId,
  onAdd,
}: {
  sessionId: string;
  onAdd: (
    sessionId: string,
    params: {
      senderName: string;
      message: string;
      category: BackstageLogCategory;
    }
  ) => void;
}) {
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<BackstageLogCategory>("general");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!senderName.trim()) {
      toast.error("발신자 이름을 입력해주세요.");
      return;
    }
    if (!message.trim()) {
      toast.error("메시지를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      onAdd(sessionId, { senderName, message, category });
      setMessage("");
      toast.success("로그가 추가되었습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-500">발신자</Label>
          <Input
            placeholder="이름 입력"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-500">카테고리</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as BackstageLogCategory)}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  <span className="flex items-center gap-1">
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-gray-500">메시지</Label>
        <div className="flex gap-2">
          <Textarea
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-xs min-h-[56px] resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            className="h-auto px-3 text-xs self-end"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Plus className="h-3 w-3" />
            전송
          </Button>
        </div>
        <p className="text-[10px] text-gray-400">Ctrl+Enter로 전송</p>
      </div>
    </div>
  );
}

// ============================================================
// 세션 카드
// ============================================================

function SessionCard({
  session,
  onEnd,
  onDelete,
  onAddEntry,
  onResolveEntry,
  onDeleteEntry,
}: {
  session: BackstageLogSession;
  onEnd: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onAddEntry: (
    sessionId: string,
    params: {
      senderName: string;
      message: string;
      category: BackstageLogCategory;
    }
  ) => void;
  onResolveEntry: (
    sessionId: string,
    entryId: string,
    resolvedBy: string
  ) => void;
  onDeleteEntry: (sessionId: string, entryId: string) => void;
}) {
  const [expanded, setExpanded] = useState(session.isActive);
  const [filterUnresolved, setFilterUnresolved] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [resolveEntryId, setResolveEntryId] = useState<string | null>(null);
  const [resolvedBy, setResolvedBy] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  const entries = session.entries;
  const displayedEntries = filterUnresolved
    ? entries.filter((e) => !e.isResolved)
    : entries;

  const unresolvedCount = entries.filter((e) => !e.isResolved).length;

  useEffect(() => {
    if (expanded && feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries.length, expanded]);

  const handleEnd = () => {
    onEnd(session.id);
    toast.success("세션이 종료되었습니다.");
  };

  const handleResolve = () => {
    if (!resolvedBy.trim()) {
      toast.error("처리자 이름을 입력해주세요.");
      return;
    }
    if (resolveEntryId) {
      onResolveEntry(session.id, resolveEntryId, resolvedBy.trim());
      setResolveEntryId(null);
      setResolvedBy("");
      toast.success("항목이 해결됨으로 처리되었습니다.");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 세션 헤더 */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer ${
          session.isActive ? "bg-blue-50 border-b border-blue-100" : "bg-gray-50 border-b"
        }`}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {session.isActive ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full bg-gray-300 shrink-0" />
          )}
          <span className="text-xs font-medium truncate">{session.showName}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 shrink-0 flex items-center gap-0.5"
          >
            <CalendarDays className="h-2.5 w-2.5" />
            {session.showDate}
          </Badge>
          {unresolvedCount > 0 && (
            <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200 shrink-0">
              미해결 {unresolvedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-gray-400">{entries.length}건</span>
          {session.isActive && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2"
              onClick={(e) => {
                e.stopPropagation();
                handleEnd();
              }}
            >
              <Square className="h-2.5 w-2.5 mr-0.5" />
              종료
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteSessionId(session.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>
      </div>

      {/* 세션 내용 */}
      {expanded && (
        <div className="p-3 space-y-3">
          {/* 필터 */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={filterUnresolved ? "default" : "outline"}
              className="h-6 text-[10px] px-2"
              onClick={() => setFilterUnresolved((v) => !v)}
            >
              <Filter className="h-2.5 w-2.5 mr-0.5" />
              미해결만
            </Button>
            <span className="text-[10px] text-gray-400">
              {displayedEntries.length}건 표시 중
            </span>
          </div>

          {/* 로그 피드 */}
          {displayedEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-gray-400">
              <MessageSquare className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">
                {filterUnresolved ? "미해결 항목이 없습니다." : "로그가 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {displayedEntries.map((entry) => {
                const cfg = CATEGORY_CONFIG[entry.category];
                return (
                  <div
                    key={entry.id}
                    className={`flex gap-2 p-2 rounded-md border text-xs ${
                      entry.isResolved
                        ? "opacity-50 bg-gray-50"
                        : entry.category === "emergency"
                        ? "bg-red-50 border-red-200"
                        : "bg-white"
                    }`}
                  >
                    {/* 왼쪽: 타임라인 점 */}
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <span
                        className={`inline-flex items-center justify-center h-4 w-4 rounded-full border ${cfg.badgeClass}`}
                      >
                        {cfg.icon}
                      </span>
                    </div>
                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-[11px]">
                          {entry.senderName}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1 py-0 ${cfg.badgeClass}`}
                        >
                          {cfg.label}
                        </Badge>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-700 break-words">
                        {entry.message}
                      </p>
                      {entry.isResolved && entry.resolvedBy && (
                        <p className="mt-0.5 text-[10px] text-green-600 flex items-center gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          {entry.resolvedBy} 처리
                        </p>
                      )}
                    </div>
                    {/* 액션 */}
                    {!entry.isResolved && (
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-green-500 hover:text-green-700"
                          title="해결 처리"
                          onClick={() => {
                            setResolveEntryId(entry.id);
                            setResolvedBy("");
                          }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                          title="삭제"
                          onClick={() => {
                            onDeleteEntry(session.id, entry.id);
                            toast.success("항목이 삭제되었습니다.");
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {entry.isResolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 shrink-0 self-start"
                        title="삭제"
                        onClick={() => {
                          onDeleteEntry(session.id, entry.id);
                          toast.success("항목이 삭제되었습니다.");
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
              <div ref={feedEndRef} />
            </div>
          )}

          {/* 항목 입력 폼 (활성 세션만) */}
          {session.isActive && (
            <EntryForm sessionId={session.id} onAdd={onAddEntry} />
          )}

          {!session.isActive && (
            <p className="text-[10px] text-center text-gray-400">
              종료된 세션입니다.
            </p>
          )}
        </div>
      )}

      {/* 세션 삭제 확인 */}
      <AlertDialog
        open={deleteSessionId === session.id}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">세션 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              "{session.showName}" 세션과 모든 로그 항목({entries.length}건)이
              영구 삭제됩니다. 계속하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs bg-red-500 hover:bg-red-600"
              onClick={() => {
                onDelete(session.id);
                setDeleteSessionId(null);
                toast.success("세션이 삭제되었습니다.");
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 해결 처리 다이얼로그 */}
      <Dialog
        open={resolveEntryId !== null}
        onOpenChange={(open) => !open && setResolveEntryId(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">해결 처리</DialogTitle>
            <DialogDescription className="text-xs">
              처리한 담당자 이름을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">처리자 이름</Label>
            <Input
              placeholder="이름 입력"
              value={resolvedBy}
              onChange={(e) => setResolvedBy(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleResolve()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setResolveEntryId(null)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleResolve}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              해결 완료
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 통계 요약
// ============================================================

function StatsSummary({
  totalSessions,
  totalEntries,
  unresolvedCount,
  categoryBreakdown,
}: {
  totalSessions: number;
  totalEntries: number;
  unresolvedCount: number;
  categoryBreakdown: {
    category: BackstageLogCategory;
    count: number;
    percent: number;
  }[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="border rounded-md p-2 text-center">
        <p className="text-[10px] text-gray-500">전체 세션</p>
        <p className="text-sm font-bold text-gray-800">{totalSessions}</p>
      </div>
      <div className="border rounded-md p-2 text-center">
        <p className="text-[10px] text-gray-500">전체 로그</p>
        <p className="text-sm font-bold text-gray-800">{totalEntries}</p>
      </div>
      <div className="border rounded-md p-2 text-center">
        <p className="text-[10px] text-gray-500">미해결</p>
        <p
          className={`text-sm font-bold ${
            unresolvedCount > 0 ? "text-orange-600" : "text-gray-800"
          }`}
        >
          {unresolvedCount}
        </p>
      </div>
      {categoryBreakdown.length > 0 && (
        <div className="col-span-3 border rounded-md p-2">
          <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            카테고리 분포
          </p>
          <div className="space-y-1">
            {categoryBreakdown.map(({ category, count, percent }) => {
              const cfg = CATEGORY_CONFIG[category];
              return (
                <div key={category} className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 w-12 justify-center shrink-0 ${cfg.badgeClass}`}
                  >
                    {cfg.label}
                  </Badge>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full bg-current`}
                      style={{
                        width: `${percent}%`,
                        color:
                          category === "cue"
                            ? "#3b82f6"
                            : category === "warning"
                            ? "#eab308"
                            : category === "info"
                            ? "#22c55e"
                            : category === "emergency"
                            ? "#ef4444"
                            : "#9ca3af",
                        backgroundColor:
                          category === "cue"
                            ? "#3b82f6"
                            : category === "warning"
                            ? "#eab308"
                            : category === "info"
                            ? "#22c55e"
                            : category === "emergency"
                            ? "#ef4444"
                            : "#9ca3af",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 w-8 text-right shrink-0">
                    {count}건
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드
// ============================================================

export function BackstageLogCard({ projectId }: { projectId: string }) {
  const {
    sessions,
    loading,
    createSession,
    endSession,
    deleteSession,
    addEntry,
    resolveEntry,
    deleteEntry,
    totalSessions,
    totalEntries,
    unresolvedCount,
    categoryBreakdown,
  } = useBackstageLog(projectId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">백스테이지 커뮤니케이션 로그</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-400">불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">백스테이지 커뮤니케이션 로그</CardTitle>
            {unresolvedCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200">
                미해결 {unresolvedCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {totalEntries > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] px-2 text-gray-400"
                onClick={() => setShowStats((v) => !v)}
              >
                <BarChart3 className="h-3 w-3 mr-0.5" />
                통계
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              새 세션
            </Button>
          </div>
        </div>
        <CardDescription className="text-xs">
          공연 중 백스테이지 소통 기록 · 큐 시트 · 긴급 알림 관리
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 통계 요약 */}
        {showStats && totalEntries > 0 && (
          <StatsSummary
            totalSessions={totalSessions}
            totalEntries={totalEntries}
            unresolvedCount={unresolvedCount}
            categoryBreakdown={categoryBreakdown}
          />
        )}

        {/* 빈 상태 */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Radio className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-xs font-medium mb-1">공연 세션이 없습니다</p>
            <p className="text-[11px] text-center max-w-48">
              "새 세션" 버튼으로 공연 백스테이지 로그 세션을 시작하세요.
            </p>
            <Button
              size="sm"
              className="h-7 text-xs mt-3"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              첫 세션 시작하기
            </Button>
          </div>
        )}

        {/* 활성 세션 */}
        {activeSessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-blue-600 flex items-center gap-1 uppercase tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
              </span>
              진행 중인 세션
            </p>
            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEnd={endSession}
                onDelete={deleteSession}
                onAddEntry={addEntry}
                onResolveEntry={resolveEntry}
                onDeleteEntry={deleteEntry}
              />
            ))}
          </div>
        )}

        {/* 종료된 세션 */}
        {inactiveSessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-gray-400 flex items-center gap-1 uppercase tracking-wide">
              <CalendarDays className="h-3 w-3" />
              과거 세션 ({inactiveSessions.length})
            </p>
            {inactiveSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEnd={endSession}
                onDelete={deleteSession}
                onAddEntry={addEntry}
                onResolveEntry={resolveEntry}
                onDeleteEntry={deleteEntry}
              />
            ))}
          </div>
        )}
      </CardContent>

      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={(showName, showDate) => {
          createSession({ showName, showDate });
          toast.success(`"${showName}" 세션이 시작되었습니다.`);
        }}
      />
    </Card>
  );
}
