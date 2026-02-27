import { createClient } from "@/lib/supabase/client";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    });
  } catch {
    // 알림 생성 실패는 메인 동작에 영향을 주지 않도록 무시
  }
}

// ============================================
// 회의록 액션 아이템 담당자 알림
// ============================================

/** localStorage 발송 이력 키 */
const ACTION_ITEM_NOTIFIED_KEY = "action_item_notified_ids";

/** 이미 알림 발송된 action item 복합 ID 집합 반환 */
export function getNotifiedActionItemIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(ACTION_ITEM_NOTIFIED_KEY);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** 발송 완료된 action item 복합 ID를 localStorage에 기록 */
export function markActionItemNotified(compositeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const set = getNotifiedActionItemIds();
    set.add(compositeId);
    localStorage.setItem(ACTION_ITEM_NOTIFIED_KEY, JSON.stringify([...set]));
  } catch {
    // 무시
  }
}

/**
 * 회의록 action_item 담당자에게 알림 발송
 * - notifications 테이블 INSERT 시도
 * - 실패 시 무시 (메인 동작에 영향 없음)
 */
export async function notifyActionItemAssigned(params: {
  groupId: string;
  projectId?: string | null;
  minuteId: string;
  minuteTitle: string;
  actionItemTitle: string;
  assigneeUserId: string;
  assignerUserId: string;
}): Promise<void> {
  // 자기 자신에게는 알림 발송하지 않음
  if (params.assigneeUserId === params.assignerUserId) return;

  await createNotification({
    userId: params.assigneeUserId,
    type: "action_item",
    title: "액션 아이템 배정",
    message: `회의록 '${params.minuteTitle}'에서 '${params.actionItemTitle}' 할일이 배정되었습니다.`,
    link: params.projectId
      ? `/groups/${params.groupId}/projects/${params.projectId}`
      : `/groups/${params.groupId}`,
  });
}
