import type { SupabaseClient } from "@supabase/supabase-js";
import logger from "@/lib/logger";

type LogPermissionChangeParams = {
  groupId: string;
  actorId: string;
  targetUserId: string;
  action: "role_change" | "member_add" | "member_remove" | "permission_grant" | "permission_revoke";
  oldValue?: string | null;
  newValue?: string | null;
  description?: string | null;
};

export async function logPermissionChange(
  supabase: SupabaseClient,
  params: LogPermissionChangeParams
): Promise<void> {
  const { groupId, actorId, targetUserId, action, oldValue, newValue, description } = params;

  const { error } = await supabase.from("permission_audits").insert({
    group_id: groupId,
    actor_id: actorId,
    target_user_id: targetUserId,
    action,
    old_value: oldValue ?? null,
    new_value: newValue ?? null,
    description: description ?? null,
  });

  if (error) {
    logger.error("권한 감사 로그 기록 실패", "permissionAudit", error.message);
  }
}
