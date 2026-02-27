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
