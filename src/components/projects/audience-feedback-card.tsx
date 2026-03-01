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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  MessageSquare,
  BarChart2,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import {
  useAudienceFeedback,
  type CreateSurveyParams,
  type QuestionResult,
  type SurveyResults,
} from "@/hooks/use-audience-feedback";
import type { AudienceFeedbackQuestion, AudienceFeedbackSurveyItem } from "@/types";

// ============================================================
// 별점 입력 컴포넌트
// ============================================================

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
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
// 별점 표시 컴포넌트
// ============================================================

function StarDisplay({ value }: { value: number }) {
  return (
    <span className="text-yellow-400 text-xs">
      {"★".repeat(Math.round(value))}
      {"☆".repeat(5 - Math.round(value))}
    </span>
  );
}

// ============================================================
// 수평 바 차트 컴포넌트
// ============================================================

function HorizontalBar({
  label,
  count,
  total,
  color = "bg-blue-500",
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-muted-foreground shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-xs font-medium text-right shrink-0">{count}</span>
    </div>
  );
}

// ============================================================
// 질문 결과 뷰어
// ============================================================

function QuestionResultView({ result }: { result: QuestionResult }) {
  if (result.type === "rating") {
    const total = result.totalAnswers;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <StarDisplay value={result.averageScore} />
          <span className="text-sm font-semibold">{result.averageScore.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/ 5 ({total}명 응답)</span>
        </div>
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((star) => (
            <HorizontalBar
              key={star}
              label={`${star}점`}
              count={result.distribution[star] ?? 0}
              total={total}
              color={star >= 4 ? "bg-yellow-400" : star === 3 ? "bg-blue-400" : "bg-gray-400"}
            />
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "text") {
    return (
      <div className="space-y-1">
        {result.responses.length === 0 ? (
          <p className="text-xs text-muted-foreground">응답 없음</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {result.responses.map((r, i) => (
              <p key={i} className="text-xs bg-muted/50 rounded px-2 py-1 leading-relaxed">
                {r}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // choice
  const total = Object.values(result.distribution).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-1">
      {result.choices.length === 0 ? (
        <p className="text-xs text-muted-foreground">보기 없음</p>
      ) : (
        result.choices.map((c) => (
          <HorizontalBar
            key={c}
            label={c}
            count={result.distribution[c] ?? 0}
            total={total}
            color="bg-purple-500"
          />
        ))
      )}
    </div>
  );
}

// ============================================================
// 설문 생성 다이얼로그 내부 - 질문 빌더
// ============================================================

type DraftQuestion = {
  _key: string;
  question: string;
  type: "rating" | "text" | "choice";
  choices: string[];
  choiceInput: string;
};

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
      {questions.map((q) => (
        <div key={q._key} className="border rounded-lg p-3 space-y-2 bg-muted/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="질문 내용을 입력하세요"
                value={q.question}
                onChange={(e) => onUpdate(q._key, { question: e.target.value })}
              />
              <div className="flex gap-1.5">
                {(["rating", "text", "choice"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdate(q._key, { type: t })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      q.type === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {t === "rating" ? "별점" : t === "text" ? "주관식" : "객관식"}
                  </button>
                ))}
              </div>
              {q.type === "choice" && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Input
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
                  <div className="flex flex-wrap gap-1">
                    {q.choices.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdate(q._key, {
                              choices: q.choices.filter((x) => x !== c),
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
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
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onRemove(q._key)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={onAdd}
      >
        <Plus className="h-3 w-3 mr-1" />
        질문 추가
      </Button>
    </div>
  );
}

// ============================================================
// 설문 생성 다이얼로그
// ============================================================

function CreateSurveyDialog({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">설문 생성</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs">설문 제목</Label>
            <Input
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

function ResponseFormDialog({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{survey.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs">이름 (선택, 익명 가능)</Label>
            <Input
              className="h-8 text-sm"
              placeholder="이름을 입력하세요"
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
            />
          </div>
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="space-y-1.5">
              <Label className="text-xs font-medium">
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
                  className="text-sm min-h-[60px] resize-none"
                  placeholder="자유롭게 입력하세요"
                  value={String(answers[q.id] ?? "")}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
              {q.type === "choice" && (
                <div className="space-y-1">
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
          {survey.questions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
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

// ============================================================
// 결과 분석 뷰
// ============================================================

function ResultsView({ results }: { results: SurveyResults }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium truncate">{results.title}</p>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
          {results.totalResponses}명 응답
        </Badge>
      </div>
      {results.totalResponses === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          아직 응답이 없습니다
        </p>
      ) : (
        <div className="space-y-3">
          {results.questionResults.map((qr) => (
            <div key={qr.questionId} className="border rounded-lg p-2.5 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                {qr.question}
                <Badge
                  variant="outline"
                  className={`ml-1.5 text-[9px] px-1 py-0 ${
                    qr.type === "rating"
                      ? "text-yellow-600 border-yellow-200"
                      : qr.type === "text"
                      ? "text-blue-600 border-blue-200"
                      : "text-purple-600 border-purple-200"
                  }`}
                >
                  {qr.type === "rating" ? "별점" : qr.type === "text" ? "주관식" : "객관식"}
                </Badge>
              </p>
              <QuestionResultView result={qr} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 설문 관리 탭
// ============================================================

function SurveyManageTab({
  surveys,
  projectId,
  createSurvey,
  deleteSurvey,
  toggleSurveyActive,
  submitResponse,
}: {
  surveys: AudienceFeedbackSurveyItem[];
  projectId: string;
  createSurvey: (params: CreateSurveyParams) => void;
  deleteSurvey: (id: string) => void;
  toggleSurveyActive: (id: string) => void;
  submitResponse: (
    surveyId: string,
    params: { respondentName: string | null; answers: Record<string, string | number> }
  ) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [responseSurvey, setResponseSurvey] =
    useState<AudienceFeedbackSurveyItem | null>(null);
  const [responseOpen, setResponseOpen] = useState(false);

  const openResponseForm = (survey: AudienceFeedbackSurveyItem) => {
    setResponseSurvey(survey);
    setResponseOpen(true);
  };

  // projectId 사용 (lint 경고 방지 - 실제로는 훅에서 이미 사용됨)
  void projectId;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          설문 생성
        </Button>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>생성된 설문이 없습니다.</p>
          <p className="mt-0.5">설문을 생성하여 관객 피드백을 수집하세요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {surveys.map((survey) => (
            <div key={survey.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${
                      survey.isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}
                  >
                    {survey.isActive ? "활성" : "비활성"}
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {survey.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {survey.responses.length}명
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {survey.questions.length}문항
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] px-2"
                  onClick={() => toggleSurveyActive(survey.id)}
                >
                  {survey.isActive ? (
                    <>
                      <ToggleRight className="h-3 w-3 mr-1 text-green-600" />
                      비활성화
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-3 w-3 mr-1" />
                      활성화
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] px-2"
                  onClick={() => openResponseForm(survey)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  응답 입력
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] px-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteSurvey(survey.id);
                    toast.success(TOAST.AUDIENCE_FEEDBACK.DELETED);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateSurveyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createSurvey}
      />

      <ResponseFormDialog
        survey={responseSurvey}
        open={responseOpen}
        onOpenChange={setResponseOpen}
        onSubmit={submitResponse}
      />
    </div>
  );
}

// ============================================================
// 결과 분석 탭
// ============================================================

function AnalyticsTab({
  surveys,
  getSurveyResults,
  totalSurveys,
  totalResponses,
  averageRating,
}: {
  surveys: AudienceFeedbackSurveyItem[];
  getSurveyResults: (surveyId: string) => SurveyResults | null;
  totalSurveys: number;
  totalResponses: number;
  averageRating: number;
}) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(
    surveys.length > 0 ? surveys[0].id : null
  );

  const results = selectedSurveyId ? getSurveyResults(selectedSurveyId) : null;

  if (surveys.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs">
        <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>분석할 설문 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 전체 요약 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="border rounded-lg p-2 text-center">
          <p className="text-base font-bold text-primary">{totalSurveys}</p>
          <p className="text-[10px] text-muted-foreground">총 설문</p>
        </div>
        <div className="border rounded-lg p-2 text-center">
          <p className="text-base font-bold text-blue-600">{totalResponses}</p>
          <p className="text-[10px] text-muted-foreground">총 응답</p>
        </div>
        <div className="border rounded-lg p-2 text-center">
          <div className="flex items-center justify-center gap-0.5">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <p className="text-base font-bold text-yellow-600">
              {averageRating > 0 ? averageRating.toFixed(1) : "-"}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">평균 별점</p>
        </div>
      </div>

      {/* 설문 선택 */}
      <div className="flex flex-wrap gap-1.5">
        {surveys.map((s) => (
          <button
            key={s.id}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors truncate max-w-[140px] ${
              selectedSurveyId === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setSelectedSurveyId(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* 선택된 설문 결과 */}
      {results ? (
        <ResultsView results={results} />
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">
          설문을 선택하면 결과를 확인할 수 있습니다
        </p>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function AudienceFeedbackCard({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);

  const {
    feedbackData,
    loading,
    createSurvey,
    deleteSurvey,
    toggleSurveyActive,
    submitResponse,
    getSurveyResults,
    totalSurveys,
    totalResponses,
    averageRating,
  } = useAudienceFeedback(projectId);

  const activeSurveyCount = feedbackData.surveys.filter((s) => s.isActive).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  공연 관객 피드백
                </CardTitle>
                {totalResponses > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {totalResponses}개 응답
                  </Badge>
                )}
                {activeSurveyCount > 0 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                  >
                    수집 중
                  </Badge>
                )}
              </div>
              {open ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 px-4 pb-4">
            {loading ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                불러오는 중...
              </div>
            ) : (
              <Tabs defaultValue="manage">
                <TabsList className="h-7 mb-3">
                  <TabsTrigger value="manage" className="text-xs h-6 px-3">
                    설문 관리
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="text-xs h-6 px-3">
                    결과 분석
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manage" className="mt-0">
                  <SurveyManageTab
                    surveys={feedbackData.surveys}
                    projectId={projectId}
                    createSurvey={createSurvey}
                    deleteSurvey={deleteSurvey}
                    toggleSurveyActive={toggleSurveyActive}
                    submitResponse={submitResponse}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab
                    surveys={feedbackData.surveys}
                    getSurveyResults={getSurveyResults}
                    totalSurveys={totalSurveys}
                    totalResponses={totalResponses}
                    averageRating={averageRating}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
