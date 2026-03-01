"use client";

import { useState } from "react";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MessageCircle,
  CheckCircle2,
  Search,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useQnaBoard,
  QNA_CATEGORIES,
  QNA_STATUS_LABEL,
  type QnaCategory,
  type QnaStatusFilter,
} from "@/hooks/use-qna-board";
import type { QnaQuestion, QnaAnswer, QnaStatus } from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  안무: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  연습: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  운영: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  기타: "bg-gray-100 text-gray-600 hover:bg-gray-100",
};

const STATUS_COLORS: Record<QnaStatus, string> = {
  open: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  answered: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  resolved: "bg-green-100 text-green-700 hover:bg-green-100",
};

// ─── 날짜 포맷 헬퍼 ──────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours().toString().padStart(2, "0");
  const min = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hour}:${min}`;
}

// ─── 답변 아이템 ─────────────────────────────────────────────

function AnswerItem({
  answer,
  onAccept,
}: {
  answer: QnaAnswer;
  onAccept: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        answer.isAccepted
          ? "border-green-400 bg-green-50"
          : "border-gray-200 bg-card"
      }`}
    >
      {/* 채택 표시 */}
      {answer.isAccepted && (
        <div className="mb-1.5 flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-[11px] font-semibold">채택된 답변</span>
        </div>
      )}

      {/* 내용 */}
      <p className="mb-2 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
        {answer.content}
      </p>

      {/* 하단: 작성자 + 날짜 + 채택 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {answer.authorName || "익명"} · {formatDate(answer.createdAt)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 px-2 text-[10px] ${
            answer.isAccepted
              ? "text-green-600 hover:text-green-700"
              : "text-gray-400 hover:text-green-600"
          }`}
          onClick={onAccept}
        >
          <CheckCircle2 className="mr-0.5 h-3 w-3" />
          {answer.isAccepted ? "채택 취소" : "채택"}
        </Button>
      </div>
    </div>
  );
}

// ─── 답변 작성 폼 ─────────────────────────────────────────────

function AddAnswerForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (content: string, authorName: string) => void;
  onCancel: () => void;
}) {
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("답변 내용을 입력해주세요.");
      return;
    }
    onSubmit(content.trim(), authorName.trim());
    setContent("");
    setAuthorName("");
  };

  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-3">
      <p className="mb-2 text-xs font-semibold text-blue-700">답변 작성</p>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 500))}
        placeholder="답변을 입력해주세요. (최대 500자)"
        className="mb-2 min-h-[72px] resize-none text-xs"
      />
      <div className="mb-3 flex gap-2">
        <Input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value.slice(0, 20))}
          placeholder="작성자 이름 (선택)"
          className="h-8 text-xs"
        />
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
        >
          <Send className="mr-1 h-3 w-3" />
          답변 등록
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-500"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 질문 아이템 ─────────────────────────────────────────────

function QuestionItem({
  question,
  onDelete,
  onAddAnswer,
  onAcceptAnswer,
}: {
  question: QnaQuestion;
  onDelete: () => void;
  onAddAnswer: (content: string, authorName: string) => void;
  onAcceptAnswer: (answerId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  const handleAddAnswer = (content: string, authorName: string) => {
    onAddAnswer(content, authorName);
    setShowAnswerForm(false);
    toast.success("답변이 등록되었습니다.");
  };

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      {/* 질문 헤더 */}
      <CollapsibleTrigger asChild>
        <div className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 bg-card p-3 transition-colors hover:bg-gray-50">
          <div className="flex-1 min-w-0">
            {/* 배지 행 */}
            <div className="mb-1 flex flex-wrap items-center gap-1">
              <Badge
                className={`text-[10px] px-1.5 py-0 ${
                  CATEGORY_COLORS[question.category] ?? CATEGORY_COLORS["기타"]
                }`}
              >
                {question.category}
              </Badge>
              <Badge
                className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[question.status]}`}
              >
                {QNA_STATUS_LABEL[question.status]}
              </Badge>
              {question.answers.some((a) => a.isAccepted) && (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                  해결
                </Badge>
              )}
            </div>

            {/* 제목 */}
            <p className="text-xs font-semibold leading-snug text-gray-800 break-words">
              {question.title}
            </p>

            {/* 메타 정보 */}
            <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
              <span>{question.authorName || "익명"}</span>
              <span>·</span>
              <span>{formatDate(question.createdAt)}</span>
              {question.answers.length > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-0.5 text-blue-500">
                    <MessageCircle className="h-2.5 w-2.5" />
                    {question.answers.length}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 우측: 펼치기 + 삭제 */}
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="삭제"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      {/* 펼쳐진 내용 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-3">
          {/* 질문 본문 */}
          <p className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
            {question.content}
          </p>

          {/* 답변 목록 */}
          {question.answers.length > 0 && (
            <div className="mb-3 flex flex-col gap-2">
              <p className="text-[11px] font-semibold text-gray-600">
                답변 {question.answers.length}개
              </p>
              {question.answers.map((answer) => (
                <AnswerItem
                  key={answer.id}
                  answer={answer}
                  onAccept={() => onAcceptAnswer(answer.id)}
                />
              ))}
            </div>
          )}

          {/* 답변 없음 안내 */}
          {question.answers.length === 0 && (
            <p className="mb-3 text-center text-[11px] text-gray-400 py-2">
              아직 답변이 없습니다.
            </p>
          )}

          {/* 답변 작성 폼 or 버튼 */}
          {showAnswerForm ? (
            <AddAnswerForm
              onSubmit={handleAddAnswer}
              onCancel={() => setShowAnswerForm(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
              onClick={() => setShowAnswerForm(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              답변 작성
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── 질문 작성 폼 ─────────────────────────────────────────────

function AddQuestionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (params: {
    title: string;
    content: string;
    authorName: string;
    category: string;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [category, setCategory] = useState<string>("안무");

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("질문 내용을 입력해주세요.");
      return;
    }
    onSubmit({ title: title.trim(), content: content.trim(), authorName: authorName.trim(), category });
    setTitle("");
    setContent("");
    setAuthorName("");
    setCategory("안무");
  };

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700">질문 작성</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-400"
          onClick={onCancel}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* 제목 */}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 80))}
        placeholder="질문 제목 (최대 80자)"
        className="mb-2 h-8 text-xs"
      />

      {/* 내용 */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 600))}
        placeholder="질문 내용을 자세히 작성해주세요. (최대 600자)"
        className="mb-2 min-h-[80px] resize-none text-xs"
      />

      {/* 카테고리 선택 */}
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[11px] text-gray-500 shrink-0">카테고리:</span>
        <div className="flex flex-wrap gap-1">
          {QNA_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                category === cat
                  ? CATEGORY_COLORS[cat] + " border-transparent"
                  : "bg-background text-gray-400 border-gray-200 hover:border-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 작성자 */}
      <Input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value.slice(0, 20))}
        placeholder="작성자 이름 (선택)"
        className="mb-3 h-8 text-xs"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          className="h-7 flex-1 text-xs"
          onClick={handleSubmit}
        >
          <Plus className="mr-1 h-3 w-3" />
          질문 등록
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-500"
          onClick={onCancel}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

// ─── 메인 카드 ────────────────────────────────────────────────

interface QnaBoardCardProps {
  groupId: string;
}

export function QnaBoardCard({ groupId }: QnaBoardCardProps) {
  const [open, setOpen] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    filteredQuestions,
    loading,
    stats,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    addQuestion,
    deleteQuestion,
    addAnswer,
    acceptAnswer,
  } = useQnaBoard(groupId);

  const handleAddQuestion = (params: {
    title: string;
    content: string;
    authorName: string;
    category: string;
  }) => {
    addQuestion(params);
    toast.success("질문이 등록되었습니다.");
    setShowAddForm(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    deleteQuestion(questionId);
    toast.success("질문이 삭제되었습니다.");
  };

  const STATUS_FILTER_OPTIONS: { value: QnaStatusFilter; label: string }[] = [
    { value: "전체", label: "전체" },
    { value: "open", label: "미답변" },
    { value: "answered", label: "답변됨" },
    { value: "resolved", label: "해결됨" },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {/* 헤더 */}
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-gray-200 bg-background px-4 py-2.5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-cyan-500" />
          <span className="text-sm font-semibold text-gray-800">Q&A 보드</span>
          {stats.total > 0 && (
            <Badge className="bg-cyan-100 text-[10px] px-1.5 py-0 text-cyan-700 hover:bg-cyan-100">
              {stats.total}
            </Badge>
          )}
          {stats.openCount > 0 && (
            <Badge className="bg-yellow-100 text-[10px] px-1.5 py-0 text-yellow-700 hover:bg-yellow-100">
              미답변 {stats.openCount}
            </Badge>
          )}
          {stats.resolvedCount > 0 && (
            <Badge className="bg-green-100 text-[10px] px-1.5 py-0 text-green-700 hover:bg-green-100">
              해결 {stats.resolvedCount}
            </Badge>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            {open ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 본문 */}
      <CollapsibleContent>
        <div className="rounded-b-lg border border-gray-200 bg-card p-4">
          {/* 검색 */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용, 작성자 검색..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="mb-2 flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-gray-500 shrink-0">카테고리:</span>
            {(["전체", ...QNA_CATEGORIES] as QnaCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                  categoryFilter === cat
                    ? cat === "전체"
                      ? "bg-gray-800 text-white border-gray-800"
                      : CATEGORY_COLORS[cat] + " border-transparent"
                    : "bg-background text-gray-400 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 상태 필터 */}
          <div className="mb-3 flex flex-wrap items-center gap-1">
            <span className="text-[11px] text-gray-500 shrink-0">상태:</span>
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all ${
                  statusFilter === value
                    ? value === "전체"
                      ? "bg-gray-800 text-white border-gray-800"
                      : value === "open"
                      ? "bg-yellow-200 text-yellow-800 border-yellow-400"
                      : value === "answered"
                      ? "bg-blue-200 text-blue-800 border-blue-400"
                      : "bg-green-200 text-green-800 border-green-400"
                    : "bg-background text-gray-400 border-gray-200 hover:border-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <Separator className="mb-3" />

          {/* 질문 목록 */}
          {loading ? (
            <p className="py-6 text-center text-xs text-gray-400">불러오는 중...</p>
          ) : filteredQuestions.length === 0 ? (
            <div className="py-8 text-center">
              <HelpCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-xs text-gray-400">
                {searchQuery || categoryFilter !== "전체" || statusFilter !== "전체"
                  ? "검색 결과가 없습니다."
                  : "아직 질문이 없습니다. 첫 번째 질문을 올려보세요!"}
              </p>
            </div>
          ) : (
            <div className="mb-3 flex flex-col gap-2">
              {filteredQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  onDelete={() => handleDeleteQuestion(question.id)}
                  onAddAnswer={(content, authorName) =>
                    addAnswer(question.id, { content, authorName })
                  }
                  onAcceptAnswer={(answerId) =>
                    acceptAnswer(question.id, answerId)
                  }
                />
              ))}
            </div>
          )}

          <Separator className="mb-3" />

          {/* 질문 추가 폼 or 버튼 */}
          {showAddForm ? (
            <AddQuestionForm
              onSubmit={handleAddQuestion}
              onCancel={() => setShowAddForm(false)}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs border-dashed"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="mr-1 h-3 w-3" />
              질문 작성
            </Button>
          )}

          {/* 통계 하단 요약 */}
          {stats.total > 0 && (
            <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-400">
              <span>전체 {stats.total}</span>
              <span>·</span>
              <span className="text-yellow-600">미답변 {stats.openCount}</span>
              <span>·</span>
              <span className="text-blue-600">답변됨 {stats.answeredCount}</span>
              <span>·</span>
              <span className="text-green-600">해결됨 {stats.resolvedCount}</span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
