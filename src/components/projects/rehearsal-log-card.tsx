"use client";

import { useState } from "react";
import { useRehearsalLog } from "@/hooks/use-rehearsal-log";
import type { RehearsalLogEntry } from "@/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardEdit,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Users,
  Music2,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

// ============================================
// 완성도 색상 헬퍼
// ============================================

function rateColor(rate: number): string {
  if (rate >= 80) return "text-green-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-500";
}

function rateBg(rate: number): string {
  if (rate >= 80)
    return "bg-gradient-to-r from-green-400 to-green-500";
  if (rate >= 50)
    return "bg-gradient-to-r from-yellow-400 to-yellow-500";
  return "bg-gradient-to-r from-red-400 to-red-500";
}

function rateBadgeClass(rate: number): string {
  if (rate >= 80)
    return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  if (rate >= 50)
    return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
  return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
}

// ============================================
// CSS div 기반 바 차트 (완성도 추이)
// ============================================

interface BarChartProps {
  data: { date: string; rehearsalNumber: number; completionRate: number }[];
}

function BarChart({ data }: BarChartProps) {
  if (data.length === 0) return null;

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-14 text-[10px] text-muted-foreground">
        기록이 2개 이상이면 추이 차트가 표시됩니다.
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 h-14 px-1">
      {data.map((d) => {
        const barHeight = Math.max((d.completionRate / 100) * 44, 2);
        return (
          <div
            key={d.rehearsalNumber}
            className="flex flex-col items-center gap-0.5 flex-1 min-w-0"
          >
            {/* 완성도 숫자 */}
            <span className={`text-[9px] font-medium ${rateColor(d.completionRate)}`}>
              {d.completionRate}
            </span>
            {/* 바 */}
            <div className="w-full flex items-end" style={{ height: 44 }}>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${rateBg(d.completionRate)}`}
                style={{ height: barHeight }}
              />
            </div>
            {/* 차수 레이블 */}
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {d.rehearsalNumber}차
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// 리허설 기록 추가 다이얼로그
// ============================================

interface AddEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextNumber: number;
  onSubmit: (
    params: Omit<RehearsalLogEntry, "id" | "rehearsalNumber" | "createdAt">
  ) => void;
}

function AddEntryDialog({
  open,
  onOpenChange,
  nextNumber,
  onSubmit,
}: AddEntryDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [songsInput, setSongsInput] = useState("");
  const [completionRate, setCompletionRate] = useState(50);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [note, setNote] = useState("");

  const resetForm = () => {
    setDate(today);
    setSongsInput("");
    setCompletionRate(50);
    setAttendeeCount(0);
    setNote("");
  };

  const handleSubmit = () => {
    if (!date) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    const songs = songsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      date,
      songsRehearsed: songs,
      completionRate,
      issues: [],
      nextGoals: [],
      attendeeCount: Number(attendeeCount) || 0,
      note: note.trim(),
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {nextNumber}차 리허설 기록 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {/* 날짜 + 참석 인원 */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">날짜 *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">참석 인원</Label>
              <Input
                type="number"
                min={0}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Number(e.target.value))}
                className="h-7 text-xs"
                placeholder="0"
              />
            </div>
          </div>

          {/* 연습한 곡 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              연습한 곡 (쉼표로 구분)
            </Label>
            <Input
              value={songsInput}
              onChange={(e) => setSongsInput(e.target.value)}
              placeholder="예: Closer, Stay, Love Story"
              className="h-7 text-xs"
            />
          </div>

          {/* 완성도 슬라이더 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">전체 완성도</Label>
              <span className={`text-sm font-bold ${rateColor(completionRate)}`}>
                {completionRate}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={completionRate}
              onChange={(e) => setCompletionRate(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            {/* 완성도 미리보기 바 */}
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-200 ${rateBg(completionRate)}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">메모</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="리허설 전반적인 내용을 자유롭게 기록하세요."
              className="text-xs resize-none min-h-[56px]"
              rows={3}
            />
          </div>

          <div className="flex gap-1.5 justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 리허설 타임라인 항목 (확장 가능)
// ============================================

interface EntryRowProps {
  entry: RehearsalLogEntry;
  onDelete: (id: string) => void;
  onToggleIssue: (entryId: string, issueId: string) => void;
  onAddIssue: (entryId: string, description: string) => boolean;
}

function EntryRow({
  entry,
  onDelete,
  onToggleIssue,
  onAddIssue,
}: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [newIssueText, setNewIssueText] = useState("");
  const unresolvedCount = entry.issues.filter((i) => !i.resolved).length;

  const handleDelete = () => {
    if (
      confirm(`${entry.rehearsalNumber}차 리허설 기록을 삭제하시겠습니까?`)
    ) {
      onDelete(entry.id);
      toast.success("기록이 삭제되었습니다.");
    }
  };

  const handleAddIssue = () => {
    if (!newIssueText.trim()) return;
    const ok = onAddIssue(entry.id, newIssueText.trim());
    if (ok) {
      setNewIssueText("");
      toast.success("이슈가 추가되었습니다.");
    }
  };

  return (
    <div className="border rounded-md overflow-hidden group">
      {/* 요약 행 */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/30 transition-colors select-none"
        onClick={() => setExpanded((prev) => !prev)}
      >
        {/* 차수 배지 */}
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-100 flex-shrink-0 w-10 justify-center"
        >
          {entry.rehearsalNumber}차
        </Badge>

        {/* 날짜 */}
        <span className="text-[11px] text-muted-foreground flex-shrink-0 w-20">
          {entry.date}
        </span>

        {/* 완성도 바 + 숫자 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${rateBg(entry.completionRate)}`}
              style={{ width: `${entry.completionRate}%` }}
            />
          </div>
          <span
            className={`text-[11px] font-semibold flex-shrink-0 w-9 text-right ${rateColor(
              entry.completionRate
            )}`}
          >
            {entry.completionRate}%
          </span>
        </div>

        {/* 연습곡 태그 (첫 2개만 표시) */}
        {entry.songsRehearsed.length > 0 && (
          <div className="hidden sm:flex items-center gap-0.5 flex-shrink-0">
            {entry.songsRehearsed.slice(0, 2).map((song, i) => (
              <Badge
                key={i}
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50"
              >
                {song}
              </Badge>
            ))}
            {entry.songsRehearsed.length > 2 && (
              <span className="text-[10px] text-muted-foreground">
                +{entry.songsRehearsed.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 참석 인원 */}
        {entry.attendeeCount > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
            <Users className="h-3 w-3" />
            {entry.attendeeCount}
          </span>
        )}

        {/* 미해결 이슈 수 배지 */}
        {unresolvedCount > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100 flex-shrink-0"
          >
            <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
            {unresolvedCount}
          </Badge>
        )}

        {/* 토글 아이콘 */}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
      </div>

      {/* 상세 영역 */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-2.5 bg-muted/10 border-t">
          {/* 연습한 곡 전체 */}
          {entry.songsRehearsed.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <Music2 className="h-3 w-3" />
                연습한 곡
              </p>
              <div className="flex flex-wrap gap-1">
                {entry.songsRehearsed.map((song, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50"
                  >
                    {song}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 이슈 목록 + 새 이슈 추가 */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              이슈 목록
              {entry.issues.length > 0 && (
                <span className="text-[9px] text-muted-foreground">
                  ({entry.issues.filter((i) => i.resolved).length}/{entry.issues.length} 해결)
                </span>
              )}
            </p>

            {entry.issues.length > 0 && (
              <div className="space-y-1">
                {entry.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`flex items-start gap-1.5 text-xs rounded px-2 py-1 ${
                      issue.resolved
                        ? "bg-green-50 border border-green-100"
                        : "bg-red-50 border border-red-100"
                    }`}
                  >
                    <button
                      onClick={() => onToggleIssue(entry.id, issue.id)}
                      className="flex-shrink-0 mt-0.5"
                      aria-label={issue.resolved ? "미해결로 변경" : "해결 처리"}
                    >
                      {issue.resolved ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </button>
                    <span
                      className={`flex-1 leading-snug ${
                        issue.resolved
                          ? "line-through text-muted-foreground"
                          : "text-red-700"
                      }`}
                    >
                      {issue.description}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 새 이슈 추가 입력 */}
            <div className="flex gap-1">
              <Input
                value={newIssueText}
                onChange={(e) => setNewIssueText(e.target.value)}
                placeholder="새 이슈를 입력하세요"
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIssue();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 flex-shrink-0"
                onClick={handleAddIssue}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* 다음 목표 */}
          {entry.nextGoals.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                <Target className="h-3 w-3" />
                다음 리허설 목표
              </p>
              <ul className="space-y-0.5 pl-1">
                {entry.nextGoals.map((goal, i) => (
                  <li
                    key={i}
                    className="text-[11px] text-indigo-700 flex items-start gap-1"
                  >
                    <span className="mt-0.5 flex-shrink-0 text-indigo-400">
                      •
                    </span>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 메모 */}
          {entry.note && (
            <p className="text-[11px] text-muted-foreground bg-white border rounded px-2 py-1.5 leading-relaxed">
              {entry.note}
            </p>
          )}

          {/* 삭제 버튼 */}
          <div className="flex justify-end pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              이 기록 삭제
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 메인 카드 컴포넌트
// ============================================

interface RehearsalLogCardProps {
  groupId: string;
  projectId: string;
}

export function RehearsalLogCard({ groupId, projectId }: RehearsalLogCardProps) {
  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    sortedEntries,
    nextRehearsalNumber,
    unresolvedIssueCount,
    latestCompletionRate,
    completionTrend,
    addEntry,
    deleteEntry,
    toggleIssueResolved,
    addIssue,
  } = useRehearsalLog(groupId, projectId);

  const handleAdd = (
    params: Omit<RehearsalLogEntry, "id" | "rehearsalNumber" | "createdAt">
  ) => {
    addEntry(params);
    toast.success(`${nextRehearsalNumber}차 리허설 기록이 저장되었습니다.`);
  };

  return (
    <>
      <AddEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nextNumber={nextRehearsalNumber}
        onSubmit={handleAdd}
      />

      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-3 py-2 border rounded-t-lg bg-card">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              )}
              <ClipboardEdit className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-semibold">리허설 진행 기록</span>

              {sortedEntries.length > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">
                  총 {sortedEntries.length}회
                </span>
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 미해결 이슈 배지 */}
            {unresolvedIssueCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
              >
                <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                이슈 {unresolvedIssueCount}
              </Badge>
            )}

            {/* 최신 완성도 배지 */}
            {sortedEntries.length > 0 && (
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${rateBadgeClass(
                  latestCompletionRate
                )}`}
              >
                {latestCompletionRate}%
              </Badge>
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setDialogOpen(true);
                setOpen(true);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              기록 추가
            </Button>
          </div>
        </div>

        {/* 카드 바디 */}
        <CollapsibleContent>
          <div className="border border-t-0 rounded-b-lg p-3 space-y-3 bg-card">
            {/* 빈 상태 */}
            {sortedEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardEdit className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">아직 리허설 기록이 없습니다.</p>
                <p className="text-[11px] mt-0.5">
                  상단의 &ldquo;기록 추가&rdquo; 버튼으로 시작하세요.
                </p>
              </div>
            )}

            {/* 진행 현황 요약 */}
            {sortedEntries.length > 0 && (
              <div className="space-y-2">
                {/* 최신 완성도 바 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      최신 완성도
                      <span className="ml-1">
                        ({sortedEntries[sortedEntries.length - 1].date})
                      </span>
                    </span>
                    <span
                      className={`text-sm font-bold ${rateColor(
                        latestCompletionRate
                      )}`}
                    >
                      {latestCompletionRate}%
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${rateBg(
                        latestCompletionRate
                      )}`}
                      style={{ width: `${latestCompletionRate}%` }}
                    />
                  </div>
                </div>

                {/* 완성도 추이 바 차트 */}
                {completionTrend.length >= 2 && (
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      완성도 추이
                    </p>
                    <BarChart data={completionTrend} />
                  </div>
                )}
              </div>
            )}

            {/* 타임라인 */}
            {sortedEntries.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  리허설 타임라인
                </p>
                <div className="space-y-1.5">
                  {[...sortedEntries].reverse().map((entry) => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      onDelete={deleteEntry}
                      onToggleIssue={toggleIssueResolved}
                      onAddIssue={addIssue}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 전체 미해결 이슈 요약 */}
            {unresolvedIssueCount > 0 && (
              <div className="border border-red-200 rounded-md p-2.5 bg-red-50 space-y-1.5">
                <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  미해결 이슈 ({unresolvedIssueCount}건)
                </p>
                <div className="space-y-1">
                  {sortedEntries.flatMap((e) =>
                    e.issues
                      .filter((i) => !i.resolved)
                      .map((issue) => (
                        <div
                          key={issue.id}
                          className="flex items-start gap-1.5"
                        >
                          <button
                            onClick={() =>
                              toggleIssueResolved(e.id, issue.id)
                            }
                            className="flex-shrink-0 mt-0.5"
                            aria-label="해결 처리"
                          >
                            <Circle className="h-3 w-3 text-red-400 hover:text-green-500 transition-colors" />
                          </button>
                          <span className="text-[11px] text-red-700 leading-snug">
                            <span className="text-[10px] text-muted-foreground mr-1">
                              [{e.rehearsalNumber}차]
                            </span>
                            {issue.description}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}
