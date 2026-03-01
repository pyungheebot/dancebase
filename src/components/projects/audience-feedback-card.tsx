"use client";

// ============================================================
// audience-feedback — 메인 카드 컨테이너
// ============================================================

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useAudienceFeedback } from "@/hooks/use-audience-feedback";
import type { AudienceFeedbackSurveyItem } from "@/types";
import { CreateSurveyDialog, ResponseFormDialog } from "./audience-feedback-dialogs";
import { SurveyItem } from "./audience-feedback-survey-item";
import { AnalyticsTab } from "./audience-feedback-analytics";

// ============================================================
// 설문 관리 탭
// ============================================================

function SurveyManageTab({
  surveys,
  createSurvey,
  deleteSurvey,
  toggleSurveyActive,
  submitResponse,
}: {
  surveys: AudienceFeedbackSurveyItem[];
  createSurvey: ReturnType<typeof useAudienceFeedback>["createSurvey"];
  deleteSurvey: ReturnType<typeof useAudienceFeedback>["deleteSurvey"];
  toggleSurveyActive: ReturnType<typeof useAudienceFeedback>["toggleSurveyActive"];
  submitResponse: ReturnType<typeof useAudienceFeedback>["submitResponse"];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [responseSurvey, setResponseSurvey] =
    useState<AudienceFeedbackSurveyItem | null>(null);
  const [responseOpen, setResponseOpen] = useState(false);

  const openResponseForm = (survey: AudienceFeedbackSurveyItem) => {
    setResponseSurvey(survey);
    setResponseOpen(true);
  };

  return (
    <section aria-label="설문 관리" className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          설문 생성
        </Button>
      </div>

      {surveys.length === 0 ? (
        <div
          className="text-center py-8 text-muted-foreground text-xs"
          role="status"
        >
          <MessageSquare
            className="h-8 w-8 mx-auto mb-2 opacity-30"
            aria-hidden="true"
          />
          <p>생성된 설문이 없습니다.</p>
          <p className="mt-0.5">설문을 생성하여 관객 피드백을 수집하세요.</p>
        </div>
      ) : (
        <div role="list" aria-label="설문 목록" className="space-y-2">
          {surveys.map((survey) => (
            <div key={survey.id} role="listitem">
              <SurveyItem
                survey={survey}
                onToggleActive={toggleSurveyActive}
                onDelete={deleteSurvey}
                onOpenResponse={openResponseForm}
              />
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
    </section>
  );
}

// ============================================================
// 메인 카드
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
  const headingId = `audience-feedback-heading-${projectId}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger asChild>
            <div
              className="flex items-center justify-between cursor-pointer"
              role="button"
              aria-expanded={open}
              aria-controls={`audience-feedback-content-${projectId}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <CardTitle
                  id={headingId}
                  className="text-sm font-medium"
                >
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
                <ChevronUp
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent id={`audience-feedback-content-${projectId}`}>
          <CardContent className="pt-0 px-4 pb-4">
            {loading ? (
              <div
                className="text-center py-6 text-xs text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                불러오는 중...
              </div>
            ) : (
              <Tabs defaultValue="manage">
                <TabsList className="h-7 mb-3" aria-label="설문 탭">
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
