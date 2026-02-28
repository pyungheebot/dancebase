"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  ClipboardList,
  MapPin,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { useDressRehearsal } from "@/hooks/use-dress-rehearsal";
import type {
  DressRehearsalCategory,
  DressRehearsalSeverity,
  DressRehearsalSession,
  DressRehearsalIssue,
} from "@/types";

// ============================================================
// 상수 & 레이블
// ============================================================

const CATEGORIES: DressRehearsalCategory[] = [
  "안무",
  "음악",
  "조명",
  "의상",
  "동선",
  "소품",
  "기타",
];

const SEVERITIES: DressRehearsalSeverity[] = ["높음", "보통", "낮음"];

const CATEGORY_COLORS: Record<DressRehearsalCategory, string> = {
  안무: "bg-purple-100 text-purple-700 border-purple-200",
  음악: "bg-blue-100 text-blue-700 border-blue-200",
  조명: "bg-yellow-100 text-yellow-700 border-yellow-200",
  의상: "bg-pink-100 text-pink-700 border-pink-200",
  동선: "bg-orange-100 text-orange-700 border-orange-200",
  소품: "bg-cyan-100 text-cyan-700 border-cyan-200",
  기타: "bg-gray-100 text-gray-700 border-gray-200",
};

const SEVERITY_COLORS: Record<DressRehearsalSeverity, string> = {
  높음: "bg-red-100 text-red-700 border-red-200",
  보통: "bg-yellow-100 text-yellow-700 border-yellow-200",
  낮음: "bg-green-100 text-green-700 border-green-200",
};

const SEVERITY_DOT_COLORS: Record<DressRehearsalSeverity, string> = {
  높음: "bg-red-500",
  보통: "bg-yellow-500",
  낮음: "bg-green-500",
};

// ============================================================
// 회차 추가/수정 폼 다이얼로그
// ============================================================

interface SessionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: { date: string; time: string; venue: string }) => void;
  editSession?: DressRehearsalSession | null;
}

function SessionFormDialog({
  open,
  onClose,
  onSubmit,
  editSession,
}: SessionFormDialogProps) {
  const [date, setDate] = useState(editSession?.date ?? "");
  const [time, setTime] = useState(editSession?.time ?? "");
  const [venue, setVenue] = useState(editSession?.venue ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setDate(editSession?.date ?? "");
      setTime(editSession?.time ?? "");
      setVenue(editSession?.venue ?? "");
    }
  };

  const handleSubmit = () => {
    if (!date.trim()) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    if (!venue.trim()) {
      toast.error("장소를 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      onSubmit({ date, time, venue });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        handleOpen(v);
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editSession ? "회차 수정" : "회차 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 날짜 */}
          <div className="space-y-1">
            <Label className="text-xs">
              날짜 <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 시간 */}
          <div className="space-y-1">
            <Label className="text-xs">시간</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 장소 */}
          <div className="space-y-1">
            <Label className="text-xs">
              장소 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="리허설 장소를 입력하세요"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editSession ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 이슈 추가/수정 폼 다이얼로그
// ============================================================

interface IssueFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: {
    section: string;
    content: string;
    category: DressRehearsalCategory;
    severity: DressRehearsalSeverity;
    assignee?: string;
  }) => void;
  editIssue?: DressRehearsalIssue | null;
}

function IssueFormDialog({
  open,
  onClose,
  onSubmit,
  editIssue,
}: IssueFormDialogProps) {
  const [section, setSection] = useState(editIssue?.section ?? "");
  const [content, setContent] = useState(editIssue?.content ?? "");
  const [category, setCategory] = useState<DressRehearsalCategory>(
    editIssue?.category ?? "안무"
  );
  const [severity, setSeverity] = useState<DressRehearsalSeverity>(
    editIssue?.severity ?? "보통"
  );
  const [assignee, setAssignee] = useState(editIssue?.assignee ?? "");
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setSection(editIssue?.section ?? "");
      setContent(editIssue?.content ?? "");
      setCategory(editIssue?.category ?? "안무");
      setSeverity(editIssue?.severity ?? "보통");
      setAssignee(editIssue?.assignee ?? "");
    }
  };

  const handleSubmit = () => {
    if (!section.trim()) {
      toast.error("장면/섹션을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("이슈 내용을 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      onSubmit({
        section,
        content,
        category,
        severity,
        assignee: assignee || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        handleOpen(v);
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editIssue ? "이슈 수정" : "이슈 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* 장면/섹션 */}
          <div className="space-y-1">
            <Label className="text-xs">
              장면/섹션 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="예: 1막 오프닝, 피날레 등"
              className="h-8 text-xs"
            />
          </div>

          {/* 이슈 내용 */}
          <div className="space-y-1">
            <Label className="text-xs">
              이슈 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="발견된 이슈를 상세히 작성하세요"
              className="text-xs min-h-[72px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 카테고리 */}
            <div className="space-y-1">
              <Label className="text-xs">카테고리</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as DressRehearsalCategory)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 심각도 */}
            <div className="space-y-1">
              <Label className="text-xs">심각도</Label>
              <Select
                value={severity}
                onValueChange={(v) =>
                  setSeverity(v as DressRehearsalSeverity)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label className="text-xs">담당자</Label>
            <Input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="담당자 이름 (선택)"
              className="h-8 text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSubmit}
            disabled={saving}
          >
            {editIssue ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 이슈 행 컴포넌트
// ============================================================

interface IssueRowProps {
  issue: DressRehearsalIssue;
  onToggle: (issueId: string) => void;
  onEdit: (issue: DressRehearsalIssue) => void;
  onDelete: (issueId: string) => void;
}

function IssueRow({ issue, onToggle, onEdit, onDelete }: IssueRowProps) {
  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${
        issue.resolved
          ? "bg-green-50 border-green-100"
          : "bg-white border-gray-100"
      }`}
    >
      {/* 해결 토글 버튼 */}
      <button
        onClick={() => onToggle(issue.id)}
        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity"
        title={issue.resolved ? "미해결로 변경" : "해결 처리"}
      >
        {issue.resolved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <span className="text-[10px] text-gray-500 font-medium">
            {issue.section}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[issue.category]}`}
          >
            {issue.category}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[issue.severity]}`}
          >
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${SEVERITY_DOT_COLORS[issue.severity]}`}
            />
            {issue.severity}
          </Badge>
        </div>

        <span
          className={`font-medium block leading-snug ${
            issue.resolved ? "line-through text-gray-400" : ""
          }`}
        >
          {issue.content}
        </span>

        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
          {issue.assignee && (
            <span className="flex items-center gap-0.5">
              <User className="h-2.5 w-2.5" />
              {issue.assignee}
            </span>
          )}
          {issue.resolvedAt && issue.resolved && (
            <span className="flex items-center gap-0.5 text-green-600">
              <Clock className="h-2.5 w-2.5" />
              {new Date(issue.resolvedAt).toLocaleString("ko-KR", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              해결
            </span>
          )}
        </div>
      </div>

      {/* 편집/삭제 버튼 */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(issue)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(issue.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 회차 섹션 컴포넌트
// ============================================================

interface SessionSectionProps {
  session: DressRehearsalSession;
  sessionIndex: number;
  onEditSession: (session: DressRehearsalSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddIssue: (sessionId: string) => void;
  onToggleIssue: (sessionId: string, issueId: string) => void;
  onEditIssue: (session: DressRehearsalSession, issue: DressRehearsalIssue) => void;
  onDeleteIssue: (sessionId: string, issueId: string) => void;
}

function SessionSection({
  session,
  sessionIndex,
  onEditSession,
  onDeleteSession,
  onAddIssue,
  onToggleIssue,
  onEditIssue,
  onDeleteIssue,
}: SessionSectionProps) {
  const [open, setOpen] = useState(true);
  const [filterResolved, setFilterResolved] = useState<"all" | "unresolved" | "resolved">("all");

  const resolvedCount = session.issues.filter((i) => i.resolved).length;
  const totalCount = session.issues.length;

  const filteredIssues = session.issues.filter((issue) => {
    if (filterResolved === "unresolved") return !issue.resolved;
    if (filterResolved === "resolved") return issue.resolved;
    return true;
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* 회차 헤더 */}
        <div className="bg-gray-50 px-3 py-2 flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-70 transition-opacity flex-1 min-w-0">
              <span className="text-xs font-semibold text-gray-700 flex-shrink-0">
                {sessionIndex + 1}회차
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500 flex-wrap min-w-0">
                <span className="flex items-center gap-0.5 flex-shrink-0">
                  <Calendar className="h-2.5 w-2.5" />
                  {session.date}
                </span>
                {session.time && (
                  <span className="flex items-center gap-0.5 flex-shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {session.time}
                  </span>
                )}
                <span className="flex items-center gap-0.5 truncate">
                  <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                  {session.venue}
                </span>
              </div>
              {open ? (
                <ChevronUp className="h-3 w-3 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
              )}
            </button>
          </CollapsibleTrigger>

          <div className="flex items-center gap-1 flex-shrink-0">
            {totalCount > 0 && (
              <span className="text-[10px] text-gray-500 mr-1">
                해결 {resolvedCount}/{totalCount}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onEditSession(session)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
              onClick={() => onDeleteSession(session.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={() => onAddIssue(session.id)}
            >
              <Plus className="h-3 w-3 mr-0.5" />
              이슈
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <div className="p-2 space-y-2">
            {/* 이슈 필터 */}
            {totalCount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setFilterResolved("all")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterResolved === "all"
                      ? "bg-gray-700 text-white border-gray-700"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  전체 {totalCount}
                </button>
                <button
                  onClick={() => setFilterResolved("unresolved")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterResolved === "unresolved"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  미해결 {totalCount - resolvedCount}
                </button>
                <button
                  onClick={() => setFilterResolved("resolved")}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    filterResolved === "resolved"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  해결 {resolvedCount}
                </button>
              </div>
            )}

            {/* 이슈 목록 */}
            {totalCount === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400">
                이슈가 없습니다. 이슈 추가 버튼을 눌러 기록하세요.
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-gray-400">
                해당 필터에 맞는 이슈가 없습니다.
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredIssues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    onToggle={(issueId) => onToggleIssue(session.id, issueId)}
                    onEdit={(i) => onEditIssue(session, i)}
                    onDelete={(issueId) => onDeleteIssue(session.id, issueId)}
                  />
                ))}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

interface DressRehearsalCardProps {
  projectId: string;
}

export function DressRehearsalCard({ projectId }: DressRehearsalCardProps) {
  const {
    sessions,
    loading,
    stats,
    addSession,
    updateSession,
    deleteSession,
    addIssue,
    updateIssue,
    deleteIssue,
    toggleIssueResolved,
  } = useDressRehearsal(projectId);

  const [open, setOpen] = useState(true);

  // 회차 폼
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editSession, setEditSession] = useState<DressRehearsalSession | null>(null);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<string | null>(null);

  // 이슈 폼
  const [issueDialogSessionId, setIssueDialogSessionId] = useState<string | null>(null);
  const [editIssueContext, setEditIssueContext] = useState<{
    sessionId: string;
    issue: DressRehearsalIssue;
  } | null>(null);
  const [deleteIssueTarget, setDeleteIssueTarget] = useState<{
    sessionId: string;
    issueId: string;
  } | null>(null);

  // 통계 패널
  const [showStats, setShowStats] = useState(false);

  // ============================================================
  // 핸들러
  // ============================================================

  const handleAddSession = (params: { date: string; time: string; venue: string }) => {
    addSession(params);
    toast.success("리허설 회차가 추가되었습니다.");
  };

  const handleEditSession = (params: { date: string; time: string; venue: string }) => {
    if (!editSession) return;
    const ok = updateSession(editSession.id, params);
    if (ok) {
      toast.success("회차 정보가 수정되었습니다.");
    } else {
      toast.error("회차 수정에 실패했습니다.");
    }
    setEditSession(null);
  };

  const handleDeleteSession = () => {
    if (!deleteSessionTarget) return;
    const ok = deleteSession(deleteSessionTarget);
    if (ok) {
      toast.success("회차가 삭제되었습니다.");
    } else {
      toast.error("회차 삭제에 실패했습니다.");
    }
    setDeleteSessionTarget(null);
  };

  const handleAddIssue = (params: {
    section: string;
    content: string;
    category: DressRehearsalCategory;
    severity: DressRehearsalSeverity;
    assignee?: string;
  }) => {
    if (!issueDialogSessionId) return;
    const result = addIssue(issueDialogSessionId, params);
    if (result) {
      toast.success("이슈가 추가되었습니다.");
    } else {
      toast.error("이슈 추가에 실패했습니다.");
    }
    setIssueDialogSessionId(null);
  };

  const handleEditIssue = (params: {
    section: string;
    content: string;
    category: DressRehearsalCategory;
    severity: DressRehearsalSeverity;
    assignee?: string;
  }) => {
    if (!editIssueContext) return;
    const ok = updateIssue(editIssueContext.sessionId, editIssueContext.issue.id, params);
    if (ok) {
      toast.success("이슈가 수정되었습니다.");
    } else {
      toast.error("이슈 수정에 실패했습니다.");
    }
    setEditIssueContext(null);
  };

  const handleDeleteIssue = () => {
    if (!deleteIssueTarget) return;
    const ok = deleteIssue(deleteIssueTarget.sessionId, deleteIssueTarget.issueId);
    if (ok) {
      toast.success("이슈가 삭제되었습니다.");
    } else {
      toast.error("이슈 삭제에 실패했습니다.");
    }
    setDeleteIssueTarget(null);
  };

  const handleToggleIssue = (sessionId: string, issueId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const issue = session?.issues.find((i) => i.id === issueId);
    const ok = toggleIssueResolved(sessionId, issueId);
    if (!ok) {
      toast.error("상태 변경에 실패했습니다.");
      return;
    }
    if (issue && !issue.resolved) {
      toast.success("이슈를 해결 처리했습니다.");
    }
  };

  // ============================================================
  // 렌더링
  // ============================================================

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-500" />
            드레스 리허설 노트
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="text-xs text-gray-400">불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <ClipboardList className="h-4 w-4 text-violet-500" />
                  <CardTitle className="text-sm font-semibold">
                    드레스 리허설 노트
                  </CardTitle>
                  {open ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </button>
              </CollapsibleTrigger>

              <div className="flex items-center gap-1">
                {stats.totalIssues > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowStats(!showStats)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    통계
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setSessionDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  회차 추가
                </Button>
              </div>
            </div>

            {/* 전체 통계 요약 */}
            {stats.totalIssues > 0 && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600 border-gray-200"
                >
                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                  총 {stats.totalIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-red-50 text-red-600 border-red-200"
                >
                  <Circle className="h-2.5 w-2.5 mr-0.5" />
                  미해결 {stats.unresolvedIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                  해결 {stats.resolvedIssues}건
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200"
                >
                  해결율 {stats.resolveRate}%
                </Badge>
              </div>
            )}

            {/* 통계 패널 */}
            {showStats && stats.totalIssues > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                <p className="text-[10px] font-medium text-gray-600">이슈 통계</p>

                {/* 해결율 바 */}
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>전체 해결율</span>
                    <span className="font-semibold text-violet-600">
                      {stats.resolveRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${stats.resolveRate}%` }}
                    />
                  </div>
                </div>

                {/* 심각도별 분포 */}
                {stats.severityDistribution.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">심각도별</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stats.severityDistribution.map((s) => (
                        <Badge
                          key={s.severity}
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${SEVERITY_COLORS[s.severity]}`}
                        >
                          {s.severity} {s.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 카테고리별 분포 */}
                {stats.categoryDistribution.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">카테고리별</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {stats.categoryDistribution.map((c) => (
                        <Badge
                          key={c.category}
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[c.category]}`}
                        >
                          {c.category} {c.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="px-4 pb-3 space-y-3">
              {/* 회차 없음 */}
              {sessions.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 space-y-2">
                  <ClipboardList className="h-10 w-10 mx-auto text-gray-200" />
                  <p>등록된 리허설 회차가 없습니다.</p>
                  <p className="text-[10px]">
                    회차 추가 버튼을 눌러 드레스 리허설을 기록하세요.
                  </p>
                </div>
              )}

              {/* 회차 목록 */}
              {sessions.map((session, idx) => (
                <SessionSection
                  key={session.id}
                  session={session}
                  sessionIndex={idx}
                  onEditSession={(s) => setEditSession(s)}
                  onDeleteSession={(id) => setDeleteSessionTarget(id)}
                  onAddIssue={(sessionId) => setIssueDialogSessionId(sessionId)}
                  onToggleIssue={handleToggleIssue}
                  onEditIssue={(s, i) =>
                    setEditIssueContext({ sessionId: s.id, issue: i })
                  }
                  onDeleteIssue={(sessionId, issueId) =>
                    setDeleteIssueTarget({ sessionId, issueId })
                  }
                />
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* 회차 추가 다이얼로그 */}
      <SessionFormDialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        onSubmit={handleAddSession}
      />

      {/* 회차 수정 다이얼로그 */}
      <SessionFormDialog
        open={editSession !== null}
        onClose={() => setEditSession(null)}
        onSubmit={handleEditSession}
        editSession={editSession}
      />

      {/* 이슈 추가 다이얼로그 */}
      <IssueFormDialog
        open={issueDialogSessionId !== null}
        onClose={() => setIssueDialogSessionId(null)}
        onSubmit={handleAddIssue}
      />

      {/* 이슈 수정 다이얼로그 */}
      <IssueFormDialog
        open={editIssueContext !== null}
        onClose={() => setEditIssueContext(null)}
        onSubmit={handleEditIssue}
        editIssue={editIssueContext?.issue ?? null}
      />

      {/* 이슈 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteIssueTarget !== null}
        onOpenChange={(v) => !v && setDeleteIssueTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">이슈 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              이 이슈를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-red-500 hover:bg-red-600"
              onClick={handleDeleteIssue}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 회차 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteSessionTarget !== null}
        onOpenChange={(v) => !v && setDeleteSessionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">회차 삭제</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              이 리허설 회차와 포함된 모든 이슈를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">취소</AlertDialogCancel>
            <AlertDialogAction
              className="h-8 text-xs bg-red-500 hover:bg-red-600"
              onClick={handleDeleteSession}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
