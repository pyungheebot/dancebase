import type { Profile } from "./common";

// ============================================
// Message (메시지)
// ============================================

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
};

export type MessageWithProfile = Message & {
  sender: Pick<Profile, "id" | "name" | "avatar_url">;
};

// ============================================
// Conversation (대화 목록)
// ============================================

export type Conversation = {
  partner_id: string;
  partner_name: string;
  partner_avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};
