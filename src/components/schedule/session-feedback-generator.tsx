"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSessionAutoFeedback } from "@/hooks/use-session-auto-feedback";
import type { SessionAutoFeedback } from "@/types";
import type { Schedule } from "@/types";

// ── 유틸 ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function rateColor(rate: number) {
  if (rate >= 90) return "text-green-600";
  if (rate >= 70) return "text-blue-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-500";
}

function rateBadgeVariant(rate: number): "default" | "secondary" | "outline" {
  if (rate >= 70) return "default";
  if (rate >= 50) return "secondary";
  return "outline";
}

// ── 출석 통계 서브 컴포넌트 ──────────────────────────────────────────────

function AttendanceStat({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{count}명</span>
    </div>
  );
}

// ── 피드백 카드 (저장된 항목) ────────────────────────────────────────────

function SavedFeedbackItem({
  feedback,
  onDelete,
}: {
  feedback: SessionAutoFeedback;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-2 min-w-0">
              <Badge
                variant={rateBadgeVariant(feedback.attendanceRate)}
                className="text-[10px] px-1.5 py-0 shrink-0"
              >
                {feedback.attendanceRate}%
              </Badge>
              <span className="text-xs font-medium truncate">
                {feedback.scheduleName}
              </span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDate(feedback.date)}
              </span>
            </div>
            {open ? (
              <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-2 border-t bg-muted/20">
            <div className="flex items-center gap-3 flex-wrap">
              <AttendanceStat
                label="출석"
                count={feedback.presentCount}
                icon={<CheckCircle2 className="h-3 w-3" />}
                color="text-green-500"
              />
              <AttendanceStat
                label="지각"
                count={feedback.lateCount}
                icon={<Clock className="h-3 w-3" />}
                color="text-yellow-500"
              />
              <AttendanceStat
                label="결석"
                count={feedback.absentCount}
                icon={<XCircle className="h-3 w-3" />}
                color="text-red-500"
              />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {feedback.autoSummary}
            </p>
            {feedback.customNote && (
              <div className="bg-background rounded p-2 border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  리더 메모
                </p>
                <p className="text-xs whitespace-pre-wrap">
                  {feedback.customNote}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground">
                저장일:{" "}
                {new Date(feedback.createdAt).toLocaleDateString("ko-KR")}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[10px] text-destructive hover:text-destructive"
                onClick={() => onDelete(feedback.id)}
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

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────

interface SessionFeedbackGeneratorProps {
  groupId: string;
  /** 특정 일정이 이미 선택된 경우 prop으로 전달 */
  scheduleId?: string;
  /** 일정 선택 드롭다운에 사용할 목록 */
  schedules?: Schedule[];
}

export function SessionFeedbackGenerator({
  groupId,
  scheduleId: defaultScheduleId,
  schedules = [],
}: SessionFeedbackGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    defaultScheduleId ?? ""
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<SessionAutoFeedback | null>(null);
  const [customNote, setCustomNote] = useState("");

  const { feedbacks, generateFeedback, saveFeedback, deleteFeedback } =
    useSessionAutoFeedback(groupId);

  const handleGenerate = async () => {
    if (!selectedScheduleId) {
      toast.error("일정을 선택해주세요.");
      return;
    }
    setGenerating(true);
    setDraft(null);
    setCustomNote("");
    try {
      const result = await generateFeedback(selectedScheduleId);
      setDraft(result);
      toast.success("피드백이 생성되었습니다.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "피드백 생성에 실패했습니다."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!draft) return;
    setSaving(true);
    try {
      saveFeedback({ ...draft, customNote });
      toast.success("피드백이 저장되었습니다.");
      setDraft(null);
      setCustomNote("");
    } catch {
      toast.error("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteFeedback(id);
    toast.success("피드백이 삭제되었습니다.");
  };

  const handleDiscard = () => {
    setDraft(null);
    setCustomNote("");
  };

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                세션 피드백 생성기
                {feedbacks.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {feedbacks.length}
                  </Badge>
                )}
              </CardTitle>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* 일정 선택 + 생성 버튼 */}
            <div className="flex gap-2">
              {!defaultScheduleId && schedules.length > 0 ? (
                <Select
                  value={selectedScheduleId}
                  onValueChange={setSelectedScheduleId}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="일정 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        <span className="font-medium">{s.title}</span>
                        <span className="text-muted-foreground ml-1">
                          {formatDate(s.starts_at)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : !defaultScheduleId ? (
                <p className="text-xs text-muted-foreground flex-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  등록된 일정이 없습니다.
                </p>
              ) : null}

              <Button
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={handleGenerate}
                disabled={generating || (!selectedScheduleId && !defaultScheduleId)}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    피드백 생성
                  </>
                )}
              </Button>
            </div>

            {/* 생성된 피드백 미리보기 */}
            {draft && (
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold">{draft.scheduleName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(draft.date)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${rateColor(draft.attendanceRate)}`}
                  >
                    {draft.attendanceRate}%
                  </span>
                </div>

                {/* 출석 통계 */}
                <div className="flex items-center gap-4 flex-wrap">
                  <AttendanceStat
                    label="출석"
                    count={draft.presentCount}
                    icon={<CheckCircle2 className="h-3 w-3" />}
                    color="text-green-500"
                  />
                  <AttendanceStat
                    label="지각"
                    count={draft.lateCount}
                    icon={<Clock className="h-3 w-3" />}
                    color="text-yellow-500"
                  />
                  <AttendanceStat
                    label="결석"
                    count={draft.absentCount}
                    icon={<XCircle className="h-3 w-3" />}
                    color="text-red-500"
                  />
                </div>

                {/* 자동 요약 */}
                <div className="bg-background rounded p-2 border">
                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5 text-purple-400" />
                    자동 생성 요약
                  </p>
                  <p className="text-xs leading-relaxed">{draft.autoSummary}</p>
                </div>

                {/* 커스텀 메모 */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">
                    리더 메모 (선택)
                  </p>
                  <Textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="추가로 기록할 내용을 입력하세요..."
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>

                {/* 저장 / 취소 */}
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleDiscard}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    저장
                  </Button>
                </div>
              </div>
            )}

            {/* 저장된 피드백 목록 */}
            {feedbacks.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                  저장된 피드백 ({feedbacks.length})
                </p>
                <div className="space-y-1.5">
                  {feedbacks.map((fb) => (
                    <SavedFeedbackItem
                      key={fb.id}
                      feedback={fb}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {feedbacks.length === 0 && !draft && (
              <p className="text-xs text-center text-muted-foreground py-4">
                아직 저장된 세션 피드백이 없습니다.
                <br />
                일정을 선택하고 피드백을 생성해보세요.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
