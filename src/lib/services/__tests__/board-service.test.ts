import { describe, it, expect, vi } from "vitest";

// Supabase 클라이언트 모킹
// createComment: from("board_comments").insert(data) → Promise<{ error }>
// updateComment: from("board_comments").update(data).eq("id", id) → Promise<{ error }>
// deleteComment: from("board_comments").delete().eq("id", id) → Promise<{ error }>
// getProfileName: from("profiles").select("name").eq("id", id).single() → Promise<{ data, error }>

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import {
  createComment,
  updateComment,
  deleteComment,
  getProfileName,
} from "@/lib/services/board-service";

describe("createComment", () => {
  it("성공 케이스: 댓글 생성 시 insert가 올바른 데이터로 호출된다", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await createComment({
      postId: "post-1",
      authorId: "user-1",
      content: "테스트 댓글",
      parentId: null,
    });

    expect(mockFrom).toHaveBeenCalledWith("board_comments");
    expect(mockInsert).toHaveBeenCalledWith({
      post_id: "post-1",
      author_id: "user-1",
      content: "테스트 댓글",
      parent_id: null,
    });
  });

  it("성공 케이스: 대댓글 생성 시 parent_id가 포함된다", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await createComment({
      postId: "post-1",
      authorId: "user-1",
      content: "대댓글입니다",
      parentId: "parent-comment-1",
    });

    expect(mockInsert).toHaveBeenCalledWith({
      post_id: "post-1",
      author_id: "user-1",
      content: "대댓글입니다",
      parent_id: "parent-comment-1",
    });
  });

  it("에러 케이스: Supabase 에러 발생 시 throw한다", async () => {
    const supabaseError = { message: "insert failed", code: "42000" };
    const mockInsert = vi.fn().mockResolvedValue({ error: supabaseError });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await expect(
      createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "실패 댓글",
        parentId: null,
      })
    ).rejects.toEqual(supabaseError);
  });
});

describe("updateComment", () => {
  it("성공 케이스: 댓글 수정 시 trim된 내용으로 update가 호출된다", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await updateComment("comment-1", "  수정된 댓글 내용  ");

    expect(mockFrom).toHaveBeenCalledWith("board_comments");
    expect(mockUpdate).toHaveBeenCalledWith({ content: "수정된 댓글 내용" });
    expect(mockEq).toHaveBeenCalledWith("id", "comment-1");
  });

  it("성공 케이스: 공백 없는 내용도 정상 처리된다", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await updateComment("comment-2", "정상 내용");

    expect(mockUpdate).toHaveBeenCalledWith({ content: "정상 내용" });
  });

  it("에러 케이스: Supabase 에러 발생 시 throw한다", async () => {
    const supabaseError = { message: "update failed", code: "42000" };
    const mockEq = vi.fn().mockResolvedValue({ error: supabaseError });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await expect(updateComment("comment-1", "수정 내용")).rejects.toEqual(
      supabaseError
    );
  });
});

describe("deleteComment", () => {
  it("성공 케이스: 댓글 삭제 시 올바른 id로 delete가 호출된다", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await deleteComment("comment-1");

    expect(mockFrom).toHaveBeenCalledWith("board_comments");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("id", "comment-1");
  });

  it("에러 케이스: Supabase 에러 발생 시 throw한다", async () => {
    const supabaseError = { message: "delete failed", code: "42000" };
    const mockEq = vi.fn().mockResolvedValue({ error: supabaseError });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    await expect(deleteComment("comment-1")).rejects.toEqual(supabaseError);
  });
});

describe("getProfileName", () => {
  it("성공 케이스: 프로필 이름이 있으면 반환한다", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { name: "홍길동" },
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const name = await getProfileName("user-1");

    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockSelect).toHaveBeenCalledWith("name");
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    expect(name).toBe("홍길동");
  });

  it("성공 케이스: 프로필 데이터가 null이면 '누군가' 반환한다", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const name = await getProfileName("user-unknown");

    expect(name).toBe("누군가");
  });

  it("성공 케이스: name 필드가 없으면 '누군가' 반환한다", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: {}, error: null });
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const name = await getProfileName("user-no-name");

    expect(name).toBe("누군가");
  });
});
