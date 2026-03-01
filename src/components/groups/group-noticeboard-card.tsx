"use client";

import { useState, useMemo } from "react";
import { useAsyncAction } from "@/hooks/use-async-action";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ChevronDown,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useGroupNoticeboard } from "@/hooks/use-group-noticeboard";
import {
  NOTICEBOARD_POST_CATEGORIES,
  type NoticeboardPost,
  type NoticeboardPostCategory,
  type NoticeboardComment,
} from "@/types";

// 카테고리 배지 색상
const CATEGORY_COLOR: Record<NoticeboardPostCategory, string> = {
  자유: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  질문: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  정보공유: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  후기: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

type PostForm = {
  title: string;
  content: string;
  authorName: string;
  category: NoticeboardPostCategory;
};

const DEFAULT_POST_FORM: PostForm = {
  title: "",
  content: "",
  authorName: "",
  category: "자유",
};

type CommentForm = {
  authorName: string;
  content: string;
};

const DEFAULT_COMMENT_FORM: CommentForm = {
  authorName: "",
  content: "",
};

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

// 게시글 상세 Dialog
function PostDetailDialog({
  post,
  open,
  onClose,
  onDeleteComment,
  onAddComment,
  onEdit,
  onDelete,
}: {
  post: NoticeboardPost | null;
  open: boolean;
  onClose: () => void;
  onDeleteComment: (postId: string, commentId: string) => Promise<boolean>;
  onAddComment: (
    postId: string,
    input: CommentForm
  ) => Promise<boolean>;
  onEdit: (post: NoticeboardPost) => void;
  onDelete: (postId: string) => Promise<void>;
}) {
  const [commentForm, setCommentForm] = useState<CommentForm>(DEFAULT_COMMENT_FORM);
  const { pending: commentSubmitting, execute: executeComment } = useAsyncAction();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const { pending: deleting, execute: executeDelete } = useAsyncAction();

  if (!post) return null;

  const handleAddComment = async () => {
    if (!commentForm.content.trim()) return;
    await executeComment(async () => {
      const ok = await onAddComment(post.id, {
        authorName: commentForm.authorName.trim(),
        content: commentForm.content.trim(),
      });
      if (ok) {
        setCommentForm(DEFAULT_COMMENT_FORM);
      }
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    await onDeleteComment(post.id, commentId);
    setDeletingCommentId(null);
  };

  const handleDelete = async () => {
    await executeDelete(async () => {
      await onDelete(post.id);
      onClose();
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold leading-tight pr-6">
            {post.title}
          </DialogTitle>
        </DialogHeader>

        {/* 메타 정보 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLOR[post.category]}`}
          >
            {post.category}
          </span>
          {post.authorName && (
            <span className="text-[10px] text-muted-foreground">
              {post.authorName}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatDate(post.createdAt)}
          </span>
        </div>

        {/* 본문 */}
        <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 rounded p-3">
          {post.content}
        </p>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              onEdit(post);
              onClose();
            }}
            disabled={deleting}
          >
            <Pencil className="h-3 w-3" />
            수정
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            삭제
          </Button>
        </div>

        {/* 댓글 목록 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium text-muted-foreground">
              댓글 {post.comments.length}
            </span>
          </div>

          {post.comments.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-3">
              첫 댓글을 남겨보세요
            </p>
          ) : (
            <div className="space-y-1.5">
              {post.comments.map((comment: NoticeboardComment) => {
                const isDeletingThis = deletingCommentId === comment.id;
                return (
                  <div
                    key={comment.id}
                    className="flex items-start gap-2 rounded bg-muted/30 px-2.5 py-2"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {comment.authorName && (
                          <span className="text-[10px] font-medium">
                            {comment.authorName}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isDeletingThis}
                      title="댓글 삭제"
                    >
                      {isDeletingThis ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <X className="h-2.5 w-2.5" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 댓글 입력 */}
          <div className="space-y-1.5 pt-1 border-t">
            <Input
              value={commentForm.authorName}
              onChange={(e) =>
                setCommentForm((prev) => ({
                  ...prev,
                  authorName: e.target.value,
                }))
              }
              placeholder="작성자명 (선택)"
              className="h-7 text-xs"
            />
            <div className="flex gap-1.5">
              <Textarea
                value={commentForm.content}
                onChange={(e) =>
                  setCommentForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="댓글을 입력하세요"
                className="text-xs min-h-[56px] resize-none flex-1"
              />
              <Button
                size="sm"
                className="h-auto px-2 self-end"
                onClick={handleAddComment}
                disabled={commentSubmitting || !commentForm.content.trim()}
              >
                {commentSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function GroupNoticeboardCard({ groupId }: { groupId: string }) {
  const {
    posts,
    totalCount,
    loading,
    addPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    categoryStats,
  } = useGroupNoticeboard(groupId);

  // 필터 상태
  const [filterCategory, setFilterCategory] = useState<NoticeboardPostCategory | "전체">("전체");

  // 추가 폼 상태
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<PostForm>(DEFAULT_POST_FORM);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // 수정 상태
  const [editingPost, setEditingPost] = useState<NoticeboardPost | null>(null);
  const [editForm, setEditForm] = useState<PostForm>(DEFAULT_POST_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // 삭제 로딩
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 상세 Dialog 상태
  const [detailPost, setDetailPost] = useState<NoticeboardPost | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Collapsible 열림 상태 (게시글 목록 섹션)
  const [listOpen, setListOpen] = useState(true);

  // 필터 적용된 목록
  const filteredPosts = useMemo(() => {
    if (filterCategory === "전체") return posts;
    return posts.filter((p) => p.category === filterCategory);
  }, [posts, filterCategory]);

  const activeCategoryStats = categoryStats.filter((s) => s.count > 0);

  // 추가 핸들러
  const handleAddSubmit = async () => {
    if (!addForm.title.trim() || !addForm.content.trim()) return;
    setAddSubmitting(true);
    const ok = await addPost({
      title: addForm.title.trim(),
      content: addForm.content.trim(),
      authorName: addForm.authorName.trim(),
      category: addForm.category,
    });
    setAddSubmitting(false);
    if (ok) {
      setAddForm(DEFAULT_POST_FORM);
      setShowAddForm(false);
    }
  };

  const handleAddCancel = () => {
    setAddForm(DEFAULT_POST_FORM);
    setShowAddForm(false);
  };

  // 수정 시작
  const handleEditStart = (post: NoticeboardPost) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      content: post.content,
      authorName: post.authorName,
      category: post.category,
    });
    setEditOpen(true);
  };

  // 수정 저장
  const handleEditSubmit = async () => {
    if (!editingPost) return;
    if (!editForm.title.trim() || !editForm.content.trim()) return;
    setEditSubmitting(true);
    const ok = await updatePost(editingPost.id, {
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      authorName: editForm.authorName.trim(),
      category: editForm.category,
    });
    setEditSubmitting(false);
    if (ok) {
      setEditingPost(null);
      setEditForm(DEFAULT_POST_FORM);
      setEditOpen(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    await deletePost(postId);
    setDeletingId(null);
  };

  // 상세 열기
  const handleOpenDetail = (post: NoticeboardPost) => {
    const latest = posts.find((p) => p.id === post.id) ?? post;
    setDetailPost(latest);
    setDetailOpen(true);
  };

  // 상세에서 게시글 삭제
  const handleDetailDelete = async (postId: string) => {
    await deletePost(postId);
  };

  return (
    <div className="rounded-lg border bg-card px-3 py-3 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">그룹 게시판</span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {totalCount}
            </Badge>
          )}
        </div>
        {!showAddForm && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 gap-1"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-3 w-3" />
            글 작성
          </Button>
        )}
      </div>

      {/* 카테고리 통계 / 필터 */}
      {activeCategoryStats.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
              filterCategory === "전체"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
            onClick={() => setFilterCategory("전체")}
          >
            전체 {totalCount}
          </button>
          {activeCategoryStats.map(({ category, count }) => (
            <button
              key={category}
              type="button"
              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                filterCategory === category
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
              onClick={() =>
                setFilterCategory(
                  filterCategory === category ? "전체" : category
                )
              }
            >
              {category} {count}
            </button>
          ))}
        </div>
      )}

      {/* 게시글 추가 폼 */}
      {showAddForm && (
        <div className="rounded border bg-muted/30 p-3 space-y-2.5">
          <p className="text-[11px] font-medium text-muted-foreground">새 게시글 작성</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                카테고리
              </Label>
              <Select
                value={addForm.category}
                onValueChange={(v) =>
                  setAddForm((prev) => ({
                    ...prev,
                    category: v as NoticeboardPostCategory,
                  }))
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTICEBOARD_POST_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                작성자명
              </Label>
              <Input
                value={addForm.authorName}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, authorName: e.target.value }))
                }
                placeholder="이름 (선택)"
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              제목
            </Label>
            <Input
              value={addForm.title}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="제목을 입력하세요"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[10px] text-muted-foreground mb-1 block">
              내용
            </Label>
            <Textarea
              value={addForm.content}
              onChange={(e) =>
                setAddForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="내용을 입력하세요"
              className="text-xs min-h-[80px] resize-none"
            />
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddSubmit}
              disabled={
                addSubmitting ||
                !addForm.title.trim() ||
                !addForm.content.trim()
              }
            >
              {addSubmitting && (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              )}
              등록
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleAddCancel}
              disabled={addSubmitting}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 게시글 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {filterCategory !== "전체"
            ? "해당 카테고리의 게시글이 없습니다"
            : "등록된 게시글이 없습니다"}
        </p>
      ) : (
        <Collapsible open={listOpen} onOpenChange={setListOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${listOpen ? "" : "-rotate-90"}`}
              />
              게시글 {filteredPosts.length}개
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1.5 space-y-1">
              {filteredPosts.map((post: NoticeboardPost) => {
                const isDeleting = deletingId === post.id;
                return (
                  <div
                    key={post.id}
                    className="rounded border bg-background overflow-hidden"
                  >
                    <div className="flex items-center gap-1">
                      {/* 클릭 영역: 제목 */}
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/40 transition-colors min-w-0"
                        onClick={() => handleOpenDetail(post)}
                      >
                        <span
                          className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${CATEGORY_COLOR[post.category]}`}
                        >
                          {post.category}
                        </span>
                        <span className="text-xs font-medium flex-1 min-w-0 truncate">
                          {post.title}
                        </span>
                        {post.comments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                            <MessageCircle className="h-2.5 w-2.5" />
                            {post.comments.length}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(post.createdAt)}
                        </span>
                      </button>

                      {/* 액션 버튼 */}
                      <div className="flex items-center gap-0.5 pr-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-blue-500"
                          onClick={() => handleEditStart(post)}
                          disabled={isDeleting}
                          title="수정"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(post.id)}
                          disabled={isDeleting}
                          title="삭제"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-2.5 w-2.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* 수정 Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => !v && setEditOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">게시글 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  카테고리
                </Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: v as NoticeboardPostCategory,
                    }))
                  }
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTICEBOARD_POST_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">
                  작성자명
                </Label>
                <Input
                  value={editForm.authorName}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      authorName: e.target.value,
                    }))
                  }
                  placeholder="이름 (선택)"
                  className="h-7 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                제목
              </Label>
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="제목을 입력하세요"
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1 block">
                내용
              </Label>
              <Textarea
                value={editForm.content}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="내용을 입력하세요"
                className="text-xs min-h-[100px] resize-none"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleEditSubmit}
                disabled={
                  editSubmitting ||
                  !editForm.title.trim() ||
                  !editForm.content.trim()
                }
              >
                {editSubmitting && (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                )}
                저장
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setEditOpen(false);
                  setEditingPost(null);
                  setEditForm(DEFAULT_POST_FORM);
                }}
                disabled={editSubmitting}
              >
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 상세 Dialog */}
      <PostDetailDialog
        post={
          detailPost
            ? (posts.find((p) => p.id === detailPost.id) ?? detailPost)
            : null
        }
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailPost(null);
        }}
        onDeleteComment={deleteComment}
        onAddComment={addComment}
        onEdit={handleEditStart}
        onDelete={handleDetailDelete}
      />
    </div>
  );
}
