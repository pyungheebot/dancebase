"use client";

// ============================================================
// audience-feedback — 설문 아이템 (React.memo 적용)
// ============================================================

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { AudienceFeedbackSurveyItem } from "@/types";

type SurveyItemProps = {
  survey: AudienceFeedbackSurveyItem;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenResponse: (survey: AudienceFeedbackSurveyItem) => void;
};

export const SurveyItem = memo(function SurveyItem({
  survey,
  onToggleActive,
  onDelete,
  onOpenResponse,
}: SurveyItemProps) {
  return (
    <article
      aria-label={`설문: ${survey.title}`}
      className="border rounded-lg p-3 space-y-2"
    >
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
          <span className="text-sm font-medium truncate">{survey.title}</span>
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
          aria-pressed={survey.isActive}
          onClick={() => onToggleActive(survey.id)}
        >
          {survey.isActive ? (
            <>
              <ToggleRight
                className="h-3 w-3 mr-1 text-green-600"
                aria-hidden="true"
              />
              비활성화
            </>
          ) : (
            <>
              <ToggleLeft className="h-3 w-3 mr-1" aria-hidden="true" />
              활성화
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[11px] px-2"
          onClick={() => onOpenResponse(survey)}
        >
          <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
          응답 입력
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[11px] px-2 text-destructive hover:text-destructive"
          aria-label={`${survey.title} 설문 삭제`}
          onClick={() => {
            onDelete(survey.id);
            toast.success(TOAST.AUDIENCE_FEEDBACK.DELETED);
          }}
        >
          <Trash2 className="h-3 w-3 mr-1" aria-hidden="true" />
          삭제
        </Button>
      </div>
    </article>
  );
});
