import { createClient } from "@/lib/supabase/client";
import type { ActivityLogAction } from "@/types";

type LogActivityParams = {
  entityType: "group" | "project";
  entityId: string;
  action: ActivityLogAction;
  details?: Record<string, unknown>;
};

/**
 * 활동 로그를 기록합니다.
 * 실패해도 주요 동작을 방해하지 않도록 에러를 조용히 처리합니다.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("activity_logs").insert({
      entity_type: params.entityType,
      entity_id: params.entityId,
      user_id: user.id,
      action: params.action,
      details: params.details ?? null,
    });
  } catch {
    // 로그 실패는 무시 (주요 동작에 영향 없음)
  }
}
