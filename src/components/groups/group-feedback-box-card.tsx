"use client";

import { useState, useId } from "react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  CheckCircle2,
  Circle,
  Trash2,
  Reply,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useGroupFeedbackBox } from "@/hooks/use-group-feedback-box";
import type { AnonFeedbackCategory, AnonFeedbackItem } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";

// ── 카테고리 메타 ───────────────────────────────────────────────────

const CATEGORY_META: Record<
  AnonFeedbackCategory,
  { label: string; color: string; badgeCls: string }
> = {
  칭찬: {
    label: "칭찬",
    color: "bg-green-500",
    badgeCls: "bg-green-100 text-green-700 border-green-200",
  },
  건의: {
    label: "건의",
    color: "bg-blue-500",
    badgeCls: "bg-blue-100 text-blue-700 border-blue-200",
  },
  불만: {
    label: "불만",
    color: "bg-red-500",
    badgeCls: "bg-red-100 text-red-700 border-red-200",
  },
  아이디어: {
    label: "아이디어",
    color: "bg-purple-500",
    badgeCls: "bg-purple-100 text-purple-700 border-purple-200",
  },
  기타: {
    label: "기타",
    color: "bg-gray-400",
    badgeCls: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

const ALL_CATEGORIES: AnonFeedbackCategory[] = [
  "칭찬",
  "건의",
  "불만",
  "아이디어",
  "기타",
];

// ── 날짜 포매터 ────────────────────────────────────────────────────


// ── 피드백 제출 다이얼로그 ──────────────────────────────────────────

function SubmitFeedbackDialog({
  onAdd,
}: {
  onAdd: (content: string, category: AnonFeedbackCategory) => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<AnonFeedbackCategory>("기타");

  const reset = () => {
    setContent("");
    setCategory("기타");
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("피드백 내용을 입력하세요.");
      return;
    }
    if (content.trim().length < 5) {
      toast.error("피드백 내용을 5자 이상 입력하세요.");
      return;
    }
    onAdd(content, category);
    toast.success("피드백이 익명으로 제출되었습니다.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          피드백 남기기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">익명 피드백 남기기</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-gray-500 -mt-1">
          작성자 정보는 저장되지 않습니다. 솔직한 의견을 남겨 주세요.
        </p>
        <div className="space-y-3 py-1">
          {/* 카테고리 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-cat`} className="text-xs">
              카테고리
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as AnonFeedbackCategory)}
            >
              <SelectTrigger id={`${uid}-cat`} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {CATEGORY_META[cat].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-content`} className="text-xs">
              내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id={`${uid}-content`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="피드백 내용을 입력하세요 (최소 5자)"
              className="text-xs min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-gray-400 text-right">
              {content.length} / 500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            익명으로 제출
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 답변 다이얼로그 ────────────────────────────────────────────────

function ReplyDialog({
  feedback,
  onReply,
}: {
  feedback: AnonFeedbackItem;
  onReply: (feedbackId: string, replyText: string) => boolean;
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [replyText, setReplyText] = useState(feedback.replyText ?? "");

  const handleSubmit = () => {
    if (!replyText.trim()) {
      toast.error("답변 내용을 입력하세요.");
      return;
    }
    const ok = onReply(feedback.id, replyText);
    if (ok) {
      toast.success("답변이 등록되었습니다.");
      setOpen(false);
    } else {
      toast.error("답변 등록에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] px-2 text-blue-600 hover:text-blue-700"
        >
          <Reply className="h-3 w-3 mr-1" />
          {feedback.replyText ? "답변 수정" : "답변하기"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">관리자 답변</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* 원본 피드백 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-2.5 border text-xs text-gray-600">
            <p className="font-medium text-gray-400 text-[10px] mb-1">
              원본 피드백
            </p>
            {feedback.content}
          </div>

          {/* 답변 입력 */}
          <div className="space-y-1">
            <Label htmlFor={`${uid}-reply`} className="text-xs">
              답변 내용 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id={`${uid}-reply`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="답변 내용을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-gray-400 text-right">
              {replyText.length} / 500
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            답변 등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── 피드백 아이템 ──────────────────────────────────────────────────

function FeedbackItem({
  feedback,
  onToggleResolved,
  onReply,
  onDelete,
}: {
  feedback: AnonFeedbackItem;
  onToggleResolved: (id: string) => boolean;
  onReply: (id: string, replyText: string) => boolean;
  onDelete: (id: string) => boolean;
}) {
  const meta = CATEGORY_META[feedback.category];

  const handleToggle = () => {
    const ok = onToggleResolved(feedback.id);
    if (ok) {
      toast.success(
        feedback.resolved ? "미해결로 변경했습니다." : "해결됨으로 표시했습니다."
      );
    }
  };

  const handleDelete = () => {
    const ok = onDelete(feedback.id);
    if (ok) {
      toast.success("피드백이 삭제되었습니다.");
    } else {
      toast.error(TOAST.DELETE_ERROR);
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 space-y-2 ${
        feedback.resolved ? "bg-gray-50 opacity-70" : "bg-card"
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            className={`text-[10px] px-1.5 py-0 border ${meta.badgeCls}`}
          >
            {meta.label}
          </Badge>
          {feedback.resolved ? (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
              해결
            </Badge>
          ) : (
            <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200">
              미해결
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* 해결 토글 */}
          <button
            type="button"
            onClick={handleToggle}
            className="p-0.5 text-gray-400 hover:text-green-600 transition-colors"
            title={feedback.resolved ? "미해결로 변경" : "해결됨 표시"}
          >
            {feedback.resolved ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>
          {/* 삭제 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-300 hover:text-red-500"
            onClick={handleDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <p className="text-xs text-gray-700 leading-relaxed">{feedback.content}</p>

      {/* 작성일 */}
      <p className="text-[10px] text-gray-400">{formatYearMonthDay(feedback.createdAt)}</p>

      {/* 답변 영역 */}
      {feedback.replyText && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-2 space-y-1">
          <p className="text-[10px] font-medium text-blue-600">관리자 답변</p>
          <p className="text-xs text-gray-700">{feedback.replyText}</p>
          {feedback.repliedAt && (
            <p className="text-[10px] text-blue-400">
              {formatYearMonthDay(feedback.repliedAt)}
            </p>
          )}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 pt-0.5">
        <ReplyDialog feedback={feedback} onReply={onReply} />
      </div>
    </div>
  );
}

// ── 카테고리 통계 바 차트 ──────────────────────────────────────────

function CategoryBarChart({
  categoryStats,
}: {
  categoryStats: Array<{
    category: AnonFeedbackCategory;
    count: number;
    percent: number;
  }>;
}) {
  return (
    <div className="space-y-1.5">
      {categoryStats.map(({ category, count, percent }) => {
        const meta = CATEGORY_META[category];
        return (
          <div key={category} className="flex items-center gap-2">
            <span className="text-[11px] text-gray-600 w-12 shrink-0">
              {meta.label}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${meta.color}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-10 shrink-0 text-right">
              {count}건 ({percent}%)
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────

export function GroupFeedbackBoxCard({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"all" | AnonFeedbackCategory>("all");
  const [filterResolved, setFilterResolved] = useState<
    "all" | "resolved" | "unresolved"
  >("all");
  const [showStats, setShowStats] = useState(false);

  const {
    data,
    loading,
    addFeedback,
    toggleResolved,
    setReply,
    deleteFeedback,
    stats,
  } = useGroupFeedbackBox(groupId);

  // 필터링
  const filtered = data.feedbacks.filter((f) => {
    const catMatch = tab === "all" || f.category === tab;
    const resolvedMatch =
      filterResolved === "all"
        ? true
        : filterResolved === "resolved"
        ? f.resolved
        : !f.resolved;
    return catMatch && resolvedMatch;
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border rounded-xl bg-card shadow-sm">
        {/* 카드 헤더 */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">
                익명 피드백 박스
              </span>
              <div className="flex items-center gap-1">
                <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-700 border-yellow-200">
                  미해결 {stats.unresolved}
                </Badge>
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                  해결 {stats.resolved}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SubmitFeedbackDialog onAdd={addFeedback} />
              {open ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            <Separator />

            {/* 해결률 프로그레스 바 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  해결률 {stats.resolveRate}%
                </span>
                <span className="text-[10px] text-gray-400">
                  {stats.resolved} / {stats.total}건
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.resolveRate}%` }}
                />
              </div>
            </div>

            {/* 통계 토글 */}
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 transition-colors"
              onClick={() => setShowStats((v) => !v)}
            >
              <BarChart2 className="h-3 w-3" />
              카테고리별 통계 {showStats ? "접기" : "보기"}
            </button>

            {showStats && (
              <div className="bg-gray-50 rounded-lg p-3 border">
                <p className="text-[11px] font-medium text-gray-600 mb-2">
                  카테고리별 현황
                </p>
                <CategoryBarChart categoryStats={stats.categoryStats} />
              </div>
            )}

            <Separator />

            {/* 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 해결 상태 필터 */}
              <div className="flex items-center gap-1">
                {(
                  [
                    { value: "all", label: "전체" },
                    { value: "unresolved", label: "미해결" },
                    { value: "resolved", label: "해결됨" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilterResolved(value)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      filterResolved === value
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 탭 */}
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as "all" | AnonFeedbackCategory)}
            >
              <TabsList className="h-7 text-xs w-full overflow-x-auto">
                <TabsTrigger value="all" className="flex-1 text-xs h-6">
                  전체 ({stats.total})
                </TabsTrigger>
                {ALL_CATEGORIES.map((cat) => {
                  const catStat = stats.categoryStats.find(
                    (s) => s.category === cat
                  );
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="flex-1 text-xs h-6"
                    >
                      {cat} ({catStat?.count ?? 0})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* 피드백 목록 */}
              <TabsContent value={tab} className="mt-3 space-y-2">
                {loading ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    불러오는 중...
                  </p>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 space-y-1">
                    <MessageSquare className="h-8 w-8 text-gray-200 mx-auto" />
                    <p className="text-xs text-gray-400">
                      피드백이 없습니다.
                    </p>
                    <p className="text-[10px] text-gray-300">
                      피드백 남기기 버튼으로 익명 피드백을 제출하세요.
                    </p>
                  </div>
                ) : (
                  filtered.map((feedback) => (
                    <FeedbackItem
                      key={feedback.id}
                      feedback={feedback}
                      onToggleResolved={toggleResolved}
                      onReply={setReply}
                      onDelete={deleteFeedback}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
