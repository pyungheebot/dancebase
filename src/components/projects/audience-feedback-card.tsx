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
  ToggleLeft,
  ToggleRight,
  BarChart2,
  ThumbsUp,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAudienceFeedback } from "@/hooks/use-audience-feedback";
import type {
  AudienceFeedbackSurvey,
  AudienceFeedbackRating,
} from "@/types";

// ============================================================
// 상수
// ============================================================

const RATING_AXES: {
  key: keyof AudienceFeedbackRating;
  label: string;
  color: string;
}[] = [
  { key: "overall", label: "전체 만족도", color: "bg-purple-500" },
  { key: "choreography", label: "안무", color: "bg-blue-500" },
  { key: "music", label: "음악", color: "bg-green-500" },
  { key: "costumes", label: "의상", color: "bg-pink-500" },
  { key: "stagePresence", label: "무대 존재감", color: "bg-orange-500" },
];

const DEFAULT_RATINGS: AudienceFeedbackRating = {
  choreography: 3,
  music: 3,
  costumes: 3,
  stagePresence: 3,
  overall: 3,
};

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
          className={`text-base transition-colors ${
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
// 수평 바 차트 컴포넌트
// ============================================================

function HorizontalBar({
  label,
  value,
  max = 5,
  color,
}: {
  label: string;
  value: number;
  max?: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 text-xs text-muted-foreground shrink-0 text-right">
        {label}
      </span>
      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-xs font-medium text-right shrink-0">
        {value > 0 ? value.toFixed(1) : "-"}
      </span>
    </div>
  );
}

// ============================================================
// 설문 관리 탭
// ============================================================

function SurveyManagementTab({
  surveys,
  groupId,
  projectId,
  createSurvey,
  deleteSurvey,
  toggleActive,
  addFeedback,
}: {
  surveys: AudienceFeedbackSurvey[];
  groupId: string;
  projectId: string;
  createSurvey: (title: string) => AudienceFeedbackSurvey;
  deleteSurvey: (id: string) => boolean;
  toggleActive: (id: string) => boolean;
  addFeedback: (
    surveyId: string,
    entry: {
      name?: string;
      email?: string;
      ratings: AudienceFeedbackRating;
      favoritePerformance?: string;
      comment?: string;
      wouldRecommend: boolean;
    }
  ) => boolean;
}) {
  // 설문 생성 다이얼로그
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // 피드백 입력 다이얼로그
  const [feedbackSurveyId, setFeedbackSurveyId] = useState<string | null>(null);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackRatings, setFeedbackRatings] =
    useState<AudienceFeedbackRating>({ ...DEFAULT_RATINGS });
  const [feedbackFavorite, setFeedbackFavorite] = useState("");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRecommend, setFeedbackRecommend] = useState(true);

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("설문 제목을 입력해주세요");
      return;
    }
    createSurvey(title);
    toast.success("설문이 생성되었습니다");
    setNewTitle("");
    setCreateOpen(false);
  };

  const handleDelete = (id: string) => {
    const ok = deleteSurvey(id);
    if (ok) toast.success("설문이 삭제되었습니다");
    else toast.error("삭제에 실패했습니다");
  };

  const handleToggle = (id: string) => {
    toggleActive(id);
  };

  const openFeedbackDialog = (surveyId: string) => {
    setFeedbackSurveyId(surveyId);
    setFeedbackName("");
    setFeedbackEmail("");
    setFeedbackRatings({ ...DEFAULT_RATINGS });
    setFeedbackFavorite("");
    setFeedbackComment("");
    setFeedbackRecommend(true);
  };

  const handleSubmitFeedback = () => {
    if (!feedbackSurveyId) return;
    const ok = addFeedback(feedbackSurveyId, {
      name: feedbackName.trim() || undefined,
      email: feedbackEmail.trim() || undefined,
      ratings: feedbackRatings,
      favoritePerformance: feedbackFavorite.trim() || undefined,
      comment: feedbackComment.trim() || undefined,
      wouldRecommend: feedbackRecommend,
    });
    if (ok) {
      toast.success("피드백이 제출되었습니다");
      setFeedbackSurveyId(null);
    } else {
      toast.error("피드백 제출에 실패했습니다");
    }
  };

  const setRating = (axis: keyof AudienceFeedbackRating, value: number) => {
    setFeedbackRatings((prev) => ({ ...prev, [axis]: value }));
  };

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
            <div
              key={survey.id}
              className="border rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge
                    className={`text-[10px] px-1.5 py-0 shrink-0 ${
                      survey.isActive
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-500 border-gray-200"
                    }`}
                    variant="outline"
                  >
                    {survey.isActive ? "활성" : "비활성"}
                  </Badge>
                  <span className="text-sm font-medium truncate">
                    {survey.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {survey.entries.length}명
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handleToggle(survey.id)}
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
                  onClick={() => openFeedbackDialog(survey.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  피드백 입력
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-[11px] px-2 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(survey.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 설문 생성 다이얼로그 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">설문 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">설문 제목</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 2024 정기공연 관객 만족도"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setCreateOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleCreate}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 피드백 입력 다이얼로그 */}
      <Dialog
        open={feedbackSurveyId !== null}
        onOpenChange={(open) => {
          if (!open) setFeedbackSurveyId(null);
        }}
      >
        <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">관객 피드백 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* 관객 정보 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                관객 정보 (선택)
              </p>
              <div className="space-y-1">
                <Label className="text-xs">이름</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="관객 이름"
                  value={feedbackName}
                  onChange={(e) => setFeedbackName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">이메일</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="이메일 주소"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                />
              </div>
            </div>

            {/* 평가 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                만족도 평가
              </p>
              {RATING_AXES.map((axis) => (
                <div
                  key={axis.key}
                  className="flex items-center justify-between"
                >
                  <Label className="text-xs w-24 shrink-0">{axis.label}</Label>
                  <StarInput
                    value={feedbackRatings[axis.key]}
                    onChange={(v) => setRating(axis.key, v)}
                  />
                </div>
              ))}
            </div>

            {/* 좋아했던 공연 */}
            <div className="space-y-1">
              <Label className="text-xs">가장 인상 깊었던 순서 (선택)</Label>
              <Input
                className="h-8 text-sm"
                placeholder="예: 2번째 무대"
                value={feedbackFavorite}
                onChange={(e) => setFeedbackFavorite(e.target.value)}
              />
            </div>

            {/* 코멘트 */}
            <div className="space-y-1">
              <Label className="text-xs">자유 코멘트 (선택)</Label>
              <Textarea
                className="text-sm min-h-[60px] resize-none"
                placeholder="공연에 대한 자유로운 의견을 남겨주세요"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>

            {/* 추천 여부 */}
            <div className="flex items-center justify-between">
              <Label className="text-xs">다른 분께 추천하시겠어요?</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={feedbackRecommend ? "default" : "outline"}
                  className="h-6 text-[11px] px-2"
                  onClick={() => setFeedbackRecommend(true)}
                >
                  예
                </Button>
                <Button
                  size="sm"
                  variant={!feedbackRecommend ? "default" : "outline"}
                  className="h-6 text-[11px] px-2"
                  onClick={() => setFeedbackRecommend(false)}
                >
                  아니오
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => setFeedbackSurveyId(null)}
            >
              취소
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSubmitFeedback}
            >
              제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 결과 분석 탭
// ============================================================

function AnalyticsTab({
  surveys,
  getStats,
  totalStats,
}: {
  surveys: AudienceFeedbackSurvey[];
  getStats: ReturnType<typeof useAudienceFeedback>["getStats"];
  totalStats: ReturnType<typeof useAudienceFeedback>["totalStats"];
}) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(
    surveys.length > 0 ? surveys[0].id : null
  );

  const currentStats = selectedSurveyId
    ? getStats(selectedSurveyId)
    : totalStats;

  const currentSurvey = selectedSurveyId
    ? surveys.find((s) => s.id === selectedSurveyId)
    : null;

  const comments = (currentSurvey?.entries ?? []).filter((e) => e.comment);

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
      {/* 설문 선택 */}
      <div className="flex flex-wrap gap-1.5">
        <button
          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
            selectedSurveyId === null
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:bg-muted"
          }`}
          onClick={() => setSelectedSurveyId(null)}
        >
          전체
        </button>
        {surveys.map((s) => (
          <button
            key={s.id}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors truncate max-w-[120px] ${
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

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="border rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-primary">
            {currentStats.totalResponses}
          </p>
          <p className="text-[10px] text-muted-foreground">총 응답 수</p>
        </div>
        <div className="border rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1">
            <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
            <p className="text-lg font-bold text-green-600">
              {currentStats.recommendRate}%
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">추천률</p>
        </div>
      </div>

      {/* 5축 수평 바 차트 */}
      <div className="border rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium">항목별 평균 점수</p>
        {currentStats.totalResponses === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            응답 데이터가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {RATING_AXES.map((axis) => (
              <HorizontalBar
                key={axis.key}
                label={axis.label}
                value={currentStats.averageRatings[axis.key]}
                max={5}
                color={axis.color}
              />
            ))}
          </div>
        )}
      </div>

      {/* 코멘트 목록 */}
      {selectedSurveyId && comments.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2">
          <p className="text-xs font-medium">관객 코멘트</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {comments.map((entry) => (
              <div key={entry.id} className="bg-muted/50 rounded p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-medium">
                    {entry.name ?? "익명"}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 ml-auto ${
                      entry.wouldRecommend
                        ? "text-green-600 border-green-200"
                        : "text-gray-400 border-gray-200"
                    }`}
                  >
                    {entry.wouldRecommend ? "추천" : "비추천"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {entry.comment}
                </p>
                <div className="flex flex-wrap gap-1">
                  {RATING_AXES.slice(0, 3).map((axis) => (
                    <span
                      key={axis.key}
                      className="text-[10px] text-muted-foreground"
                    >
                      {axis.label} {entry.ratings[axis.key]}점
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 메인 카드 컴포넌트
// ============================================================

export function AudienceFeedbackCard({
  groupId,
  projectId,
}: {
  groupId: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  const {
    surveys,
    loading,
    createSurvey,
    deleteSurvey,
    toggleActive,
    addFeedback,
    getStats,
    totalStats,
  } = useAudienceFeedback(groupId, projectId);

  const totalResponses = surveys.reduce((sum, s) => sum + s.entries.length, 0);

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
                {surveys.some((s) => s.isActive) && (
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
                  <SurveyManagementTab
                    surveys={surveys}
                    groupId={groupId}
                    projectId={projectId}
                    createSurvey={createSurvey}
                    deleteSurvey={deleteSurvey}
                    toggleActive={toggleActive}
                    addFeedback={addFeedback}
                  />
                </TabsContent>

                <TabsContent value="analytics" className="mt-0">
                  <AnalyticsTab
                    surveys={surveys}
                    getStats={getStats}
                    totalStats={totalStats}
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
