import { createClient } from "@/lib/supabase/client";

// ============================================
// 게시판 댓글 서비스
// ============================================

/**
 * 댓글 또는 대댓글 생성
 */
export async function createComment(data: {
  postId: string;
  authorId: string;
  content: string;
  parentId: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("board_comments").insert({
    post_id: data.postId,
    author_id: data.authorId,
    content: data.content,
    parent_id: data.parentId,
  });
  if (error) throw error;
}

/**
 * 댓글 내용 수정
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_comments")
    .update({ content: content.trim() })
    .eq("id", commentId);
  if (error) throw error;
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("board_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw error;
}

/**
 * 프로필 이름 조회 (댓글 알림 발송 시 작성자 이름 확인용)
 */
export async function getProfileName(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", userId)
    .single();
  return data?.name ?? "누군가";
}
