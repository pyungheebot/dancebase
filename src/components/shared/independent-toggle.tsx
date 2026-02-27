"use client";

import { useState } from "react";
import { mutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";

type IndependentToggleProps = {
  ctx: EntityContext;
  feature: "board" | "schedule" | "finance";
  featureLabel: string;
};

export function IndependentToggle({ ctx, feature, featureLabel }: IndependentToggleProps) {
  const [toggling, setToggling] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const independent = optimistic ?? (ctx.independentFeatures[feature] ?? false);

  // 프로젝트 또는 서브그룹에서만 표시
  if (!ctx.projectId && !ctx.parentGroupId) return null;

  const isProject = !!ctx.projectId;

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    setOptimistic(checked);
    const supabase = createClient();

    // schedule 토글 시 attendance도 함께 변경 (단일 쿼리로 원자적 처리)
    const features = feature === "schedule" ? ["schedule", "attendance"] : [feature];

    const { error } = await supabase
      .from("entity_features")
      .update({ independent: checked })
      .eq("entity_type", ctx.entityType)
      .eq("entity_id", ctx.entityId)
      .in("feature", features);
    const hasError = !!error;

    if (hasError) {
      toast.error("설정 변경에 실패했습니다");
      setOptimistic(null);
    } else {
      toast.success(
        checked
          ? `독립 ${featureLabel}(으)로 변경되었습니다`
          : `통합 ${featureLabel}(으)로 변경되었습니다`
      );
      // SWR 캐시 무효화: entity-meta 재조회 → ctx 재생성
      await mutate(`entity-meta/${ctx.entityType}/${ctx.entityId}`);
      setOptimistic(null);
    }
    setToggling(false);
  };

  return (
    <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded border bg-muted/30">
      <Switch
        checked={independent}
        onCheckedChange={handleToggle}
        disabled={!ctx.permissions.canEdit || toggling}
        className="scale-75"
      />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium">
          {independent ? `독립 ${featureLabel}` : `통합 ${featureLabel}`}
        </span>
        <p className="text-[10px] text-muted-foreground">
          {independent
            ? isProject
              ? `이 프로젝트의 ${featureLabel}은(는) 그룹에 포함되지 않습니다`
              : `이 그룹의 ${featureLabel}은(는) 상위 그룹에 포함되지 않습니다`
            : isProject
              ? `이 프로젝트의 ${featureLabel}이(가) 그룹에 통합되어 표시됩니다`
              : `이 그룹의 ${featureLabel}이(가) 상위 그룹에 통합되어 표시됩니다`}
        </p>
      </div>
    </div>
  );
}
