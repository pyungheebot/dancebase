"use client";

import { useState, useId } from "react";
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
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { StageRiskItem, StageRiskCategory, StageRiskResponseStatus } from "@/types";
import {
  ALL_CATEGORIES,
  ALL_RESPONSE_STATUSES,
  CATEGORY_LABELS,
  LEVEL_COLORS,
  LEVEL_DOT_COLORS,
  LEVEL_LABELS,
  RESPONSE_LABELS,
  calcRiskLevel,
  type RiskFormParams,
} from "./types";

interface RiskFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (params: RiskFormParams) => void;
  editItem?: StageRiskItem | null;
}

export function RiskFormDialog({
  open,
  onClose,
  onSubmit,
  editItem,
}: RiskFormDialogProps) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const categoryId = `${formId}-category`;
  const likelihoodId = `${formId}-likelihood`;
  const impactId = `${formId}-impact`;
  const mitigationId = `${formId}-mitigation`;
  const statusId = `${formId}-status`;
  const scorePreviewId = `${formId}-score-preview`;

  const [title, setTitle] = useState(editItem?.title ?? "");
  const [category, setCategory] = useState<StageRiskCategory>(
    editItem?.category ?? "stage_structure"
  );
  const [likelihood, setLikelihood] = useState(editItem?.likelihood ?? 3);
  const [impact, setImpact] = useState(editItem?.impact ?? 3);
  const [mitigation, setMitigation] = useState(editItem?.mitigation ?? "");
  const [responseStatus, setResponseStatus] =
    useState<StageRiskResponseStatus>(editItem?.responseStatus ?? "pending");

  const previewScore = likelihood * impact;
  const previewLevel = calcRiskLevel(previewScore);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitle(editItem?.title ?? "");
      setCategory(editItem?.category ?? "stage_structure");
      setLikelihood(editItem?.likelihood ?? 3);
      setImpact(editItem?.impact ?? 3);
      setMitigation(editItem?.mitigation ?? "");
      setResponseStatus(editItem?.responseStatus ?? "pending");
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error(TOAST.RISK.TITLE_REQUIRED);
      return;
    }
    if (!mitigation.trim()) {
      toast.error(TOAST.RISK.COUNTERMEASURE_REQUIRED);
      return;
    }
    onSubmit({
      title: title.trim(),
      category,
      likelihood,
      impact,
      mitigation: mitigation.trim(),
      responseStatus,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {editItem ? "리스크 수정" : "리스크 등록"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* 위험 요소 제목 */}
          <div className="space-y-1">
            <Label htmlFor={titleId} className="text-xs text-muted-foreground">
              위험 요소
            </Label>
            <Input
              id={titleId}
              className="h-8 text-xs"
              placeholder="예: 무대 바닥 미끄러움"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 카테고리 */}
          <div className="space-y-1">
            <Label
              htmlFor={categoryId}
              className="text-xs text-muted-foreground"
            >
              카테고리
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as StageRiskCategory)}
            >
              <SelectTrigger id={categoryId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 발생 가능성 + 영향도 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label
                htmlFor={likelihoodId}
                className="text-xs text-muted-foreground"
              >
                발생 가능성 (1-5)
              </Label>
              <div
                id={likelihoodId}
                className="flex gap-1"
                role="group"
                aria-label="발생 가능성 선택"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setLikelihood(v)}
                    aria-pressed={likelihood === v}
                    aria-label={`발생 가능성 ${v}`}
                    className={`flex-1 h-7 rounded text-xs font-medium border transition-colors ${
                      likelihood === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label
                htmlFor={impactId}
                className="text-xs text-muted-foreground"
              >
                영향도 (1-5)
              </Label>
              <div
                id={impactId}
                className="flex gap-1"
                role="group"
                aria-label="영향도 선택"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setImpact(v)}
                    aria-pressed={impact === v}
                    aria-label={`영향도 ${v}`}
                    className={`flex-1 h-7 rounded text-xs font-medium border transition-colors ${
                      impact === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 점수 미리보기 */}
          <div
            id={scorePreviewId}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/40 border"
            aria-live="polite"
            aria-label={`리스크 점수: ${previewScore}, 등급: ${LEVEL_LABELS[previewLevel]}`}
          >
            <span className="text-xs text-muted-foreground">리스크 점수</span>
            <span className="text-sm font-bold tabular-nums">
              {previewScore}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({likelihood} × {impact})
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ml-auto ${LEVEL_COLORS[previewLevel]}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${LEVEL_DOT_COLORS[previewLevel]}`}
                aria-hidden="true"
              />
              {LEVEL_LABELS[previewLevel]}
            </Badge>
          </div>

          {/* 대응 방안 */}
          <div className="space-y-1">
            <Label
              htmlFor={mitigationId}
              className="text-xs text-muted-foreground"
            >
              대응 방안
            </Label>
            <Textarea
              id={mitigationId}
              className="text-xs min-h-[60px] resize-none"
              placeholder="예: 무대 바닥에 미끄럼 방지 테이프 부착 및 리허설 전 점검"
              value={mitigation}
              onChange={(e) => setMitigation(e.target.value)}
              aria-required="true"
            />
          </div>

          {/* 대응 상태 */}
          <div className="space-y-1">
            <Label htmlFor={statusId} className="text-xs text-muted-foreground">
              대응 상태
            </Label>
            <Select
              value={responseStatus}
              onValueChange={(v) =>
                setResponseStatus(v as StageRiskResponseStatus)
              }
            >
              <SelectTrigger id={statusId} className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_RESPONSE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {RESPONSE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
            {editItem ? "수정" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
