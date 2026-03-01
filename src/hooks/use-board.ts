"use client";

import { useState } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useIndependentEntityIds } from "@/hooks/use-independent-entities";
import { BOARD_CATEGORIES } from "@/types";
import type {
  BoardPostWithDetails,
  BoardPost,
  BoardCommentWithProfile,
  BoardPoll,
  BoardPollOptionWithVotes,
  BoardPostAttachment,
  BoardPostLike,
  BoardCategoryRow,
  Profile,
  Project,
} from "@/types";

const PAGE_SIZE = 10;

export function useBoard(groupId: string, projectId?: string | null) {
  const [category, setCategory] = useState<string>("전체");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // 그룹 뷰일 때만 독립 엔티티 ID 조회 (SWR 캐시 공유로 중복 RPC 방지)
  const { data: independentEntities } = useIndependentEntityIds(
    !projectId ? groupId : undefined,
  );

  const { data, isLoading, mutate } = useSWR(
    // 그룹 뷰: independentEntities 로드 완료 후 실행 / 프로젝트 뷰: 즉시 실행
    projectId !== undefined
      ? swrKeys.board(groupId, projectId, category, search, page)
      : independentEntities !== undefined
        ? swrKeys.board(groupId, projectId, category, search, page)
        : null,
    async () => {
      const supabase = createClient();

      // 현재 사용자 ID 조회 (예약 게시글 필터링에 사용)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? null;

      let query = supabase
        .from("board_posts")
        .select(
          "*, profiles(id, name, avatar_url), board_comments(count), board_post_likes(count), projects(id, name)",
          { count: "exact" },
        )
        .eq("group_id", groupId)
        .is("deleted_at", null)
        .order("pinned_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        // 그룹 뷰: SWR 캐시에서 이미 로드된 독립 엔티티 활용
        const excludeIds = (independentEntities || [])
          .filter((e) => e.feature === "board")
          .map((e) => e.entity_id);
        if (excludeIds.length > 0) {
          query = query.not(
            "project_id",
            "in",
            `(${excludeIds.join(",")})`,
          );
        }
      }

      if (category && category !== "전체") {
        query = query.eq("category", category);
      }

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`,
        );
      }

      // 예약 발행 필터:
      // - published_at IS NULL → 즉시 발행 게시글 (항상 표시)
      // - published_at <= now() → 발행 시각이 지난 예약 게시글 (항상 표시)
      // - published_at > now() AND author_id = userId → 내가 작성한 미발행 예약 게시글 (작성자에게만 표시)
      // 관리자 여부는 클라이언트 UI에서 별도 처리, 여기서는 작성자 기준으로 필터링
      const nowIso = new Date().toISOString();
      if (userId) {
        query = query.or(
          `published_at.is.null,published_at.lte.${nowIso},author_id.eq.${userId}`,
        );
      } else {
        query = query.or(
          `published_at.is.null,published_at.lte.${nowIso}`,
        );
      }

      // 페이지네이션
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      type RawBoardPost = {
        board_comments: { count: number }[] | null;
        board_post_likes: { count: number }[] | null;
        [key: string]: unknown;
      };

      const { data: rawData, count } = await query;

      if (rawData) {
        const posts = ((rawData as RawBoardPost[]).map((post) => ({
          ...post,
          comment_count: post.board_comments?.[0]?.count ?? 0,
          like_count: post.board_post_likes?.[0]?.count ?? 0,
          board_comments: undefined,
          board_post_likes: undefined,
        })) as unknown) as BoardPostWithDetails[];
        return { posts, totalCount: count ?? 0 };
      }

      return { posts: [] as BoardPostWithDetails[], totalCount: 0 };
    },
    { keepPreviousData: true },
  );

  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSetCategory = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const handleSetSearch = (s: string) => {
    setSearch(s);
    setPage(1);
  };

  return {
    posts: data?.posts ?? [],
    loading: isLoading,
    category,
    setCategory: handleSetCategory,
    search,
    setSearch: handleSetSearch,
    page,
    setPage,
    totalPages,
    totalCount,
    refetch: () => mutate(),
  };
}

export function useBoardPost(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardPost(postId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [postRes, commentsRes, pollRes] = await Promise.all([
        supabase
          .from("board_posts")
          .select("id, group_id, project_id, category, author_id, title, content, is_pinned, pinned_at, pinned_by, published_at, created_at, updated_at, deleted_at, profiles(id, name, avatar_url)")
          .eq("id", postId)
          .single(),
        supabase
          .from("board_comments")
          .select("id, post_id, author_id, content, parent_id, is_hidden, created_at, profiles(id, name, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true }),
        supabase
          .from("board_polls")
          .select("id, post_id, allow_multiple, ends_at")
          .eq("post_id", postId)
          .maybeSingle(),
      ]);

      const post =
        (postRes.data as
          | (BoardPost & {
              profiles: {
                id: string;
                name: string;
                avatar_url: string | null;
              };
            })
          | null) ?? null;
      const comments = (commentsRes.data as BoardCommentWithProfile[]) ?? [];
      let poll: BoardPoll | null = null;
      let pollOptions: BoardPollOptionWithVotes[] = [];

      if (pollRes.data) {
        poll = pollRes.data as BoardPoll;

        const { data: optionsWithVotes } = await supabase.rpc(
          "get_poll_options_with_votes",
          {
            p_poll_id: pollRes.data.id,
            p_user_id:
              user?.id ?? "00000000-0000-0000-0000-000000000000",
          },
        );

        if (optionsWithVotes) {
          pollOptions = optionsWithVotes as BoardPollOptionWithVotes[];
        }
      }

      return { post, comments, poll, pollOptions };
    },
  );

  return {
    post: data?.post ?? null,
    comments: data?.comments ?? [],
    poll: data?.poll ?? null,
    pollOptions: data?.pollOptions ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useBoardPostAttachments(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardPostAttachments(postId),
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_post_attachments")
        .select("id, post_id, file_url, file_name, file_type, file_size, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) return [] as BoardPostAttachment[];
      return (data ?? []) as BoardPostAttachment[];
    },
  );

  return {
    attachments: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useBoardPostLikes(postId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardPostLikes(postId),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: likes, error } = await supabase
        .from("board_post_likes")
        .select("id, post_id, user_id, created_at")
        .eq("post_id", postId);

      if (error) return { likes: [] as BoardPostLike[], likedByMe: false };

      const typedLikes = (likes ?? []) as BoardPostLike[];
      const likedByMe = user
        ? typedLikes.some((l) => l.user_id === user.id)
        : false;
      return { likes: typedLikes, likedByMe };
    },
  );

  return {
    likeCount: data?.likes.length ?? 0,
    likedByMe: data?.likedByMe ?? false,
    loading: isLoading,
    refetch: () => mutate(),
    mutate,
  };
}

// 기본 카테고리 목록 ("전체" 제외)
const DEFAULT_WRITE_CATEGORIES = BOARD_CATEGORIES.filter(
  (c) => c !== "전체",
) as string[];

export function useBoardCategories(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardCategories(groupId),
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_categories")
        .select("id, group_id, name, sort_order, created_at")
        .eq("group_id", groupId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) return [] as BoardCategoryRow[];
      return (data ?? []) as BoardCategoryRow[];
    },
  );

  const dbCategories = data ?? [];

  // DB 카테고리가 있으면 DB 사용, 없으면 기본값 fallback
  const writeCategories: string[] =
    dbCategories.length > 0
      ? dbCategories.map((c) => c.name)
      : DEFAULT_WRITE_CATEGORIES;

  // 필터용 (전체 포함)
  const filterCategories: string[] = ["전체", ...writeCategories];

  return {
    categories: dbCategories,
    writeCategories,
    filterCategories,
    loading: isLoading,
    refetch: () => mutate(),
  };
}

// 휴지통: 삭제된 게시글 목록 (리더 전용)
export type BoardTrashPost = BoardPost & {
  profiles: Pick<Profile, "id" | "name" | "avatar_url">;
  projects?: Pick<Project, "id" | "name"> | null;
};

export function useBoardTrash(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.boardTrash(groupId),
    async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("board_posts")
        .select("*, profiles(id, name, avatar_url), projects(id, name)")
        .eq("group_id", groupId)
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) return [] as BoardTrashPost[];
      return (data ?? []) as BoardTrashPost[];
    },
  );

  return {
    posts: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
