"use client";

// ============================================================
// audience-feedback — 폼 다이얼로그
//   - CreateSurveyDialog : 설문 생성
//   - ResponseFormDialog : 응답 입력
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { type CreateSurveyParams } from "@/hooks/use-audience-feedback";
import type { AudienceFeedbackQuestion, AudienceFeedbackSurveyItem } from "@/types";
import { type DraftQuestion, QUESTION_TYPE_LABELS } from "./audience-feedback-types";

// ============================================================
// 별점 입력 컴포넌트
// ============================================================

export function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="별점 선택">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star}점`}
          aria-pressed={star <= value}
          onClick={() => onChange(star)}
          className={`text-lg leading-none transition-colors ${
            star <= value ? "text-yellow-400" : "text-gray-300"
          } hover:text-yellow-300`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 질문 빌더 (설문 생성 다이얼로그 내부)
// ============================================================

function QuestionBuilder({
  questions,
  onAdd,
  onRemove,
  onUpdate,
}: {
  questions: DraftQuestion[];
  onAdd: () => void;
  onRemove: (key: string) => void;
  onUpdate: (key: string, patch: Partial<DraftQuestion>) => void;
}) {
  return (
    <div className="space-y-3">
      <div role="list" aria-label="질문 목록">
        {questions.map((q, idx) => (
          <div
            key={q._key}
            role="listitem"
            className="border rounded-lg p-3 space-y-2 bg-muted/20 mb-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`q-title-${q._key}`} className="sr-only">
                  {idx + 1}번 질문 내용
                </Label>
                <Input
                  id={`q-title-${q._key}`}
                  className="h-7 text-xs"
                  placeholder="질문 내용을 입력하세요"
                  value={q.question}
                  onChange={(e) => onUpdate(q._key, { question: e.target.value })}
                />
                <div
                  className="flex gap-1.5"
                  role="group"
                  aria-label={`${idx + 1}번 질문 유형 선택`}
                >
                  {(["rating", "text", "choice"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={q.type === t}
                      onClick={() => onUpdate(q._key, { type: t })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        q.type === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {QUESTION_TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
                {q.type === "choice" && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Label
                        htmlFor={`q-choice-input-${q._key}`}
                        className="sr-only"
                      >
                        보기 추가 입력
                      </Label>
                      <Input
                        id={`q-choice-input-${q._key}`}
                        className="h-6 text-xs flex-1"
                        placeholder="보기 추가"
                        value={q.choiceInput}
                        onChange={(e) =>
                          onUpdate(q._key, { choiceInput: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = q.choiceInput.trim();
                            if (val && !q.choices.includes(val)) {
                              onUpdate(q._key, {
                                choices: [...q.choices, val],
                                choiceInput: "",
                              });
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => {
                          const val = q.choiceInput.trim();
                          if (val && !q.choices.includes(val)) {
                            onUpdate(q._key, {
                              choices: [...q.choices, val],
                              choiceInput: "",
                            });
                          }
                        }}
                      >
                        추가
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1" role="list" aria-label="추가된 보기 목록">
                      {q.choices.map((c) => (
                        <span
                          key={c}
                          role="listitem"
                          className="text-[10px] bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1"
                        >
                          {c}
                          <button
                            type="button"
                            aria-label={`${c} 보기 삭제`}
                            onClick={() =>
                              onUpdate(q._key, {
                                choices: q.choices.filter((x) => x !== c),
                              })
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-2.5 w-2.5" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`${idx + 1}번 질문 삭제`}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onRemove(q._key)}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
        질문 추가
      </Button>
    </div>
  );
}

// ============================================================
// 설문 생성 다이얼로그
// ============================================================

export function CreateSurveyDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: CreateSurveyParams) => void;
}) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        _key: crypto.randomUUID(),
        question: "",
        type: "rating",
        choices: [],
        choiceInput: "",
      },
    ]);
  };

  const removeQuestion = (key: string) => {
    setQuestions((prev) => prev.filter((q) => q._key !== key));
  };

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q._key === key ? { ...q, ...patch } : q))
    );
  };

  const handleSubmit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error(TOAST.AUDIENCE_FEEDBACK.TITLE_REQUIRED);
      return;
    }
    const validQuestions = questions.filter((q) => q.question.trim() !== "");
    const mapped: Omit<AudienceFeedbackQuestion, "id">[] = validQuestions.map(
      (q) => ({
        question: q.question.trim(),
        type: q.type,
        choices: q.type === "choice" ? q.choices : null,
      })
    );
    onCreate({ title: trimmedTitle, questions: mapped });
    toast.success(TOAST.AUDIENCE_FEEDBACK.CREATED);
    setTitle("");
    setQuestions([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setTitle("");
    setQuestions([]);
    onOpenChange(false);
  };

  const dialogId = "create-survey-dialog";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md max-h-[85vh] overflow-y-auto"
        aria-labelledby={dialogId}
      >
        <DialogHeader>
          <DialogTitle id={dialogId} className="text-sm">
            설문 생성
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="survey-title" className="text-xs">
              설문 제목
            </Label>
            <Input
              id="survey-title"
              className="h-8 text-sm"
              placeholder="예: 2025 정기공연 관객 만족도"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">질문 목록</Label>
            <QuestionBuilder
              questions={questions}
              onAdd={addQuestion}
              onRemove={removeQuestion}
              onUpdate={updateQuestion}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            생성
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 응답 폼 다이얼로그
// ============================================================

export function ResponseFormDialog({
  survey,
  open,
  onOpenChange,
  onSubmit,
}: {
  survey: AudienceFeedbackSurveyItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (
    surveyId: string,
    params: { respondentName: string | null; answers: Record<string, string | number> }
  ) => void;
}) {
  const [respondentName, setRespondentName] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number>>({});

  const setAnswer = (questionId: string, value: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    if (!survey) return;
    onSubmit(survey.id, {
      respondentName: respondentName.trim() || null,
      answers,
    });
    toast.success(TOAST.AUDIENCE_FEEDBACK.SUBMITTED);
    setRespondentName("");
    setAnswers({});
    onOpenChange(false);
  };

  const handleClose = () => {
    setRespondentName("");
    setAnswers({});
    onOpenChange(false);
  };

  if (!survey) return null;

  const dialogId = `response-form-dialog-${survey.id}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm max-h-[85vh] overflow-y-auto"
        aria-labelledby={dialogId}
      >
        <DialogHeader>
          <DialogTitle id={dialogId} className="text-sm">
            {survey.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="respondent-name" className="text-xs">
              이름 (선택, 익명 가능)
            </Label>
            <Input
              id="respondent-name"
              className="h-8 text-sm"
              placeholder="이름을 입력하세요"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </div>
          <div
            role="list"
            aria-label="설문 질문 목록"
            aria-live="polite"
            className="space-y-4"
          >
            {survey.questions.map((q, idx) => (
              <div key={q.id} role="listitem" className="space-y-1.5">
                <Label
                  htmlFor={`answer-${q.id}`}
                  className="text-xs font-medium"
                >
                  {idx + 1}. {q.question}
                </Label>
                {q.type === "rating" && (
                  <StarInput
                    value={Number(answers[q.id] ?? 0)}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                )}
                {q.type === "text" && (
                  <Textarea
                    id={`answer-${q.id}`}
                    className="text-sm min-h-[60px] resize-none"
                    placeholder="자유롭게 입력하세요"
                    value={String(answers[q.id] ?? "")}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                  />
                )}
                {q.type === "choice" && (
                  <div
                    className="space-y-1"
                    role="radiogroup"
                    aria-labelledby={`answer-${q.id}`}
                  >
                    {(q.choices ?? []).map((c) => (
                      <label
                        key={c}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={c}
                          checked={answers[q.id] === c}
                          onChange={() => setAnswer(q.id, c)}
                          className="h-3 w-3"
                        />
                        <span className="text-xs">{c}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {survey.questions.length === 0 && (
            <p
              className="text-xs text-muted-foreground text-center py-2"
              role="status"
            >
              등록된 질문이 없습니다
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            제출
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
