import type { SupabaseClient } from "@supabase/supabase-js";

export type WinBackRecipient = {
  userId: string;
  name: string;
};

/**
 * 비활성 멤버에게 복귀 유도 메시지를 발송합니다.
 * messages 테이블(DM)을 사용합니다.
 *
 * @param supabase - Supabase 클라이언트
 * @param senderId - 발신자 user_id
 * @param recipients - 수신자 목록 (userId, name)
 * @param messageTemplate - {name} 플레이스홀더 포함 가능한 메시지 템플릿
 * @returns 발송 성공 수
 */
export async function sendWinBackMessages(
  supabase: SupabaseClient,
  senderId: string,
  recipients: WinBackRecipient[],
  messageTemplate: string
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;

  for (const recipient of recipients) {
    const content = messageTemplate.replace(/\{name\}/g, recipient.name);
    const { error } = await supabase.from("messages").insert({
      sender_id: senderId,
      receiver_id: recipient.userId,
      content,
    });

    if (error) {
      failCount++;
    } else {
      successCount++;
    }
  }

  return { successCount, failCount };
}
