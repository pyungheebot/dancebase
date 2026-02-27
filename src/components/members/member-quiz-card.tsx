"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  HelpCircle,
  Plus,
  Trash2,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useMemberQuiz } from "@/hooks/use-member-quiz";
import type { QuizQuestion, QuizAttempt } from "@/types";

// ============================================
// 타입
// ============================================

interface MemberQuizCardProps {
  groupId: string;
  memberNames?: string[];
}

// 퀴즈 플레이 모드 단계
type PlayStep = "idle" | "playing" | "result";

// ============================================
// 유틸
// ============================================

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const QUIZ_COUNT = 5;

// ============================================
// 문제 추가 다이얼로그
// ============================================

function AddQuestionDialog({
  memberNames,
  onAdd,
}: {
  memberNames: string[];
  onAdd: (q: Omit<QuizQuestion, "id">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [aboutMember, setAboutMember] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOptionChange(idx: number, value: string) {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  }

  function handleSubmit() {
    if (!question.trim()) {
      toast.error("질문을 입력해주세요.");
      return;
    }
    const filledOptions = options.map((o) => o.trim());
    if (filledOptions.some((o) => !o)) {
      toast.error("4개 선택지를 모두 입력해주세요.");
      return;
    }
    if (!aboutMember) {
      toast.error("대상 멤버를 선택해주세요.");
      return;
    }
    if (!createdBy.trim()) {
      toast.error("출제자 이름을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      onAdd({
        question: question.trim(),
        options: filledOptions,
        correctIndex,
        aboutMember,
        createdBy: createdBy.trim(),
      });
      toast.success("문제가 추가되었습니다.");
      setOpen(false);
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      setAboutMember("");
      setCreatedBy("");
    } catch {
      toast.error("문제 추가 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          문제 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">새 퀴즈 문제 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          {/* 질문 */}
          <div className="space-y-1">
            <Label className="text-xs">질문</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예) OO님의 취미는 무엇일까요?"
              className="h-8 text-xs"
            />
          </div>

          {/* 선택지 + 정답 표시 */}
          <div className="space-y-1.5">
            <Label className="text-xs">선택지 (정답 선택)</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectIndex(idx)}
                  className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${
                    correctIndex === idx
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground text-muted-foreground hover:border-green-400"
                  }`}
                  aria-label={`선택지 ${idx + 1} 정답으로 설정`}
                >
                  {idx + 1}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`선택지 ${idx + 1}`}
                  className="h-8 text-xs flex-1"
                />
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">
              번호를 클릭하면 정답으로 설정됩니다.
            </p>
          </div>

          {/* 대상 멤버 */}
          <div className="space-y-1">
            <Label className="text-xs">대상 멤버</Label>
            {memberNames.length > 0 ? (
              <Select value={aboutMember} onValueChange={setAboutMember}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="멤버 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={aboutMember}
                onChange={(e) => setAboutMember(e.target.value)}
                placeholder="이 문제의 주인공 이름"
                className="h-8 text-xs"
              />
            )}
          </div>

          {/* 출제자 */}
          <div className="space-y-1">
            <Label className="text-xs">출제자</Label>
            {memberNames.length > 0 ? (
              <Select value={createdBy} onValueChange={setCreatedBy}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="출제자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="출제자 이름"
                className="h-8 text-xs"
              />
            )}
          </div>

          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            문제 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// 퀴즈 플레이 영역
// ============================================

function QuizPlayArea({
  questions,
  onComplete,
}: {
  questions: QuizQuestion[];
  onComplete: (
    playerName: string,
    answers: { questionId: string; selectedIndex: number }[]
  ) => QuizAttempt;
}) {
  const [step, setStep] = useState<PlayStep>("idle");
  const [playerName, setPlayerName] = useState("");
  const [playQuestions, setPlayQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<
    { questionId: string; selectedIndex: number }[]
  >([]);
  const [result, setResult] = useState<QuizAttempt | null>(null);

  function handleStart() {
    if (!playerName.trim()) {
      toast.error("참여자 이름을 입력해주세요.");
      return;
    }
    if (questions.length === 0) {
      toast.error("문제가 없습니다. 먼저 문제를 추가해주세요.");
      return;
    }
    const shuffled = shuffleArray(questions).slice(0, QUIZ_COUNT);
    setPlayQuestions(shuffled);
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setResult(null);
    setStep("playing");
  }

  function handleSelect(idx: number) {
    if (selected !== null) return; // 이미 선택됨
    setSelected(idx);
  }

  function handleNext() {
    if (selected === null) {
      toast.error("선택지를 선택해주세요.");
      return;
    }

    const currentQ = playQuestions[currentIndex];
    const newAnswers = [
      ...answers,
      { questionId: currentQ.id, selectedIndex: selected },
    ];
    setAnswers(newAnswers);

    if (currentIndex + 1 < playQuestions.length) {
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    } else {
      // 퀴즈 완료
      const attempt = onComplete(playerName.trim(), newAnswers);
      setResult(attempt);
      setStep("result");
    }
  }

  function handleReset() {
    setStep("idle");
    setPlayerName("");
    setPlayQuestions([]);
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setResult(null);
  }

  // 시작 화면
  if (step === "idle") {
    return (
      <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-3 space-y-2.5">
        <p className="text-xs font-medium text-purple-700">퀴즈 시작</p>
        <p className="text-[10px] text-muted-foreground">
          전체 {questions.length}개 문제 중 최대 {QUIZ_COUNT}개를 랜덤으로 풀어봅니다.
        </p>
        <div className="space-y-1">
          <Label className="text-xs">참여자 이름</Label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="이름을 입력해주세요"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart();
            }}
          />
        </div>
        <Button
          size="sm"
          className="h-7 text-xs w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleStart}
          disabled={questions.length === 0}
        >
          <Play className="h-3 w-3 mr-1" />
          퀴즈 시작
        </Button>
      </div>
    );
  }

  // 결과 화면
  if (step === "result" && result) {
    const accuracy =
      result.totalQuestions > 0
        ? Math.round((result.score / result.totalQuestions) * 100)
        : 0;

    return (
      <div className="rounded-lg border border-dashed border-green-300 bg-green-50 p-3 space-y-2.5">
        <p className="text-xs font-medium text-green-700 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          퀴즈 완료!
        </p>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-foreground">
            {result.score} / {result.totalQuestions}
          </p>
          <p className="text-[10px] text-muted-foreground">
            정답률 {accuracy}%
          </p>
          {accuracy >= 80 ? (
            <p className="text-xs text-green-600 font-medium">훌륭해요!</p>
          ) : accuracy >= 60 ? (
            <p className="text-xs text-yellow-600 font-medium">잘했어요!</p>
          ) : (
            <p className="text-xs text-orange-600 font-medium">
              조금 더 친해져 볼까요?
            </p>
          )}
        </div>

        {/* 문제별 정오 */}
        <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {result.answers.map((a, idx) => {
            const q = playQuestions.find((q) => q.id === a.questionId);
            if (!q) return null;
            return (
              <li
                key={a.questionId}
                className="flex items-start gap-1.5 text-[10px]"
              >
                {a.isCorrect ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                )}
                <span className="flex-1 text-muted-foreground">
                  <span className="font-medium text-foreground mr-1">
                    Q{idx + 1}.
                  </span>
                  {q.question}
                  {!a.isCorrect && (
                    <span className="ml-1 text-green-600">
                      (정답: {q.options[q.correctIndex]})
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs w-full"
          onClick={handleReset}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          다시 도전
        </Button>
      </div>
    );
  }

  // 플레이 화면
  const currentQ = playQuestions[currentIndex];
  const progress = `${currentIndex + 1} / ${playQuestions.length}`;

  return (
    <div className="rounded-lg border border-dashed border-purple-300 bg-purple-50 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-purple-700">
          {playerName}님의 퀴즈
        </p>
        <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200">
          {progress}
        </Badge>
      </div>

      {/* 문제 */}
      <div className="rounded bg-white border p-2.5 space-y-0.5">
        <p className="text-[10px] text-muted-foreground">
          {currentQ.aboutMember}님에 관한 문제
        </p>
        <p className="text-xs font-medium text-foreground leading-relaxed">
          {currentQ.question}
        </p>
      </div>

      {/* 선택지 */}
      <div className="grid grid-cols-2 gap-1.5">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(idx)}
            disabled={selected !== null}
            className={`rounded border px-2 py-2 text-xs text-left transition-colors leading-tight ${
              selected === null
                ? "bg-white hover:bg-purple-100 hover:border-purple-400 border-border"
                : selected === idx
                ? idx === currentQ.correctIndex
                  ? "bg-green-100 border-green-500 text-green-700"
                  : "bg-red-100 border-red-400 text-red-600"
                : idx === currentQ.correctIndex
                ? "bg-green-50 border-green-400 text-green-600"
                : "bg-white border-border text-muted-foreground opacity-60"
            }`}
          >
            <span className="font-bold mr-1">{idx + 1}.</span>
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && (
        <p className="text-[10px] text-center font-medium">
          {selected === currentQ.correctIndex ? (
            <span className="text-green-600">정답!</span>
          ) : (
            <span className="text-red-500">
              오답 - 정답: {currentQ.options[currentQ.correctIndex]}
            </span>
          )}
        </p>
      )}

      <Button
        size="sm"
        className="h-7 text-xs w-full bg-purple-600 hover:bg-purple-700 text-white"
        onClick={handleNext}
        disabled={selected === null}
      >
        {currentIndex + 1 < playQuestions.length ? "다음 문제" : "결과 보기"}
      </Button>
    </div>
  );
}

// ============================================
// 메인 카드
// ============================================

export function MemberQuizCard({
  groupId,
  memberNames = [],
}: MemberQuizCardProps) {
  const {
    questions,
    attempts,
    addQuestion,
    deleteQuestion,
    submitAttempt,
    getLeaderboard,
    totalQuestions,
    totalAttempts,
    avgScore,
    topScorer,
  } = useMemberQuiz(groupId);

  const [open, setOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("play");

  const leaderboard = useMemo(() => getLeaderboard(), [getLeaderboard, attempts]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete(id: string) {
    deleteQuestion(id);
    toast.success("문제가 삭제되었습니다.");
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <HelpCircle className="h-4 w-4 text-purple-500" />
              <span>멤버 자기소개 퀴즈</span>
              {totalQuestions > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200">
                  {totalQuestions}문제
                </Badge>
              )}
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* 통계 요약 */}
            {(totalQuestions > 0 || totalAttempts > 0) && (
              <div className="grid grid-cols-4 gap-1.5">
                <div className="rounded border bg-muted/30 p-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">문제 수</p>
                  <p className="text-xs font-bold">{totalQuestions}</p>
                </div>
                <div className="rounded border bg-muted/30 p-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">시도 수</p>
                  <p className="text-xs font-bold">{totalAttempts}</p>
                </div>
                <div className="rounded border bg-muted/30 p-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">평균 점수</p>
                  <p className="text-xs font-bold">{avgScore}</p>
                </div>
                <div className="rounded border bg-muted/30 p-1.5 text-center">
                  <p className="text-[10px] text-muted-foreground">1등</p>
                  <p className="text-xs font-bold truncate">
                    {topScorer ?? "-"}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* 탭 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-7 w-full">
                <TabsTrigger value="play" className="flex-1 h-6 text-[11px]">
                  퀴즈 풀기
                </TabsTrigger>
                <TabsTrigger
                  value="leaderboard"
                  className="flex-1 h-6 text-[11px]"
                >
                  리더보드
                </TabsTrigger>
                <TabsTrigger
                  value="manage"
                  className="flex-1 h-6 text-[11px]"
                >
                  문제 관리
                </TabsTrigger>
              </TabsList>

              {/* 퀴즈 풀기 */}
              <TabsContent value="play" className="mt-2">
                <QuizPlayArea
                  questions={questions}
                  onComplete={submitAttempt}
                />
              </TabsContent>

              {/* 리더보드 */}
              <TabsContent value="leaderboard" className="mt-2">
                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Trophy className="h-6 w-6 mb-1 text-muted-foreground/40" />
                    <p className="text-xs">아직 퀴즈 기록이 없어요.</p>
                    <p className="text-[10px]">
                      첫 번째로 퀴즈를 풀어보세요!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {leaderboard.map((entry, idx) => (
                      <li
                        key={entry.playerName}
                        className="flex items-center gap-2 rounded-lg border bg-muted/20 px-2.5 py-2"
                      >
                        <span
                          className={`text-sm shrink-0 ${
                            idx === 0
                              ? "text-yellow-500"
                              : idx === 1
                              ? "text-gray-400"
                              : idx === 2
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {idx === 0
                            ? "1"
                            : idx === 1
                            ? "2"
                            : idx === 2
                            ? "3"
                            : `${idx + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {entry.playerName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            시도 {entry.totalAttempts}회
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-purple-600">
                            {entry.bestScore}점
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {entry.bestAccuracy}%
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              {/* 문제 관리 */}
              <TabsContent value="manage" className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    전체 {totalQuestions}개 문제
                  </p>
                  <AddQuestionDialog
                    memberNames={memberNames}
                    onAdd={addQuestion}
                  />
                </div>

                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <HelpCircle className="h-6 w-6 mb-1 text-muted-foreground/40" />
                    <p className="text-xs">아직 문제가 없어요.</p>
                    <p className="text-[10px]">
                      첫 번째 퀴즈 문제를 추가해보세요!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {questions.map((q) => (
                      <li
                        key={q.id}
                        className="rounded-lg border bg-muted/20 px-2.5 py-2 group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className="text-[9px] px-1 py-0 bg-purple-100 text-purple-700 border-purple-200">
                                {q.aboutMember}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground">
                                출제: {q.createdBy}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground leading-relaxed">
                              {q.question}
                            </p>
                            <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                              {q.options.map((opt, idx) => (
                                <li
                                  key={idx}
                                  className={`text-[10px] truncate ${
                                    idx === q.correctIndex
                                      ? "text-green-600 font-semibold"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {idx + 1}. {opt}
                                  {idx === q.correctIndex && " (정답)"}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-muted-foreground hover:text-destructive"
                            aria-label="문제 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
