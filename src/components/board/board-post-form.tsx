"use client";

import { useReducer, useEffect, useRef, startTransition } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useBoardCategories } from "@/hooks/use-board";
import { useFormDraft } from "@/hooks/use-form-draft";
import type { BoardPost } from "@/types";
import { invalidateBoardPostAttachments, invalidatePostRevisions } from "@/lib/swr/invalidate";
import { savePostRevision } from "@/hooks/use-post-revisions";
import { formatFileSize } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Paperclip, X, FileText, Clock } from "lucide-react";
import NextImage from "next/image";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { BoardScheduleInput } from "./board-schedule-input";

interface BoardPostFormProps {
  groupId: string;
  projectId?: string | null;
  onCreated: () => void;
  mode?: "create" | "edit";
  initialData?: BoardPost;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

// ── State / Action 타입 ────────────────────────────────────────────────────

type FormState = {
  title: string;
  content: string;
  category: string;
  publishedAt: string | null;
  pollOptions: string[];
  allowMultiple: boolean;
  pollEndsAt: string | null;
  customEndsAt: string;
  pendingFiles: PendingFile[];
};

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: FormState[keyof FormState] }
  | { type: "RESET"; defaultCategory: string }
  | { type: "SET_INITIAL"; state: Partial<FormState> };

const INITIAL_STATE: FormState = {
  title: "",
  content: "",
  category: "미분류",
  publishedAt: null,
  pollOptions: [""],
  allowMultiple: false,
  pollEndsAt: null,
  customEndsAt: "",
  pendingFiles: [],
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...INITIAL_STATE, category: action.defaultCategory };
    case "SET_INITIAL":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────────

export function BoardPostForm({
  groupId,
  projectId,
  onCreated,
  mode = "create",
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: BoardPostFormProps) {
  const [internalOpen, setInternalOpen] = useReducer(
    (_: boolean, v: boolean) => v,
    false
  );
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const { writeCategories } = useBoardCategories(groupId);

  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const { pending: submitting, execute } = useAsyncAction();
  const { user } = useAuth();

  // 헬퍼
  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    dispatch({ type: "SET_FIELD", field, value });

  // 드래프트 훅 - 새 글 작성 모드에서만 활성화
  const draftKey = `draft-board-post-${groupId}${projectId ? `-${projectId}` : ""}`;
  const { hasDraft, restoreDraft, saveDraft, clearDraft } = useFormDraft({
    key: draftKey,
    enabled: mode === "create",
    debounceMs: 3000,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      startTransition(() => {
        dispatch({
          type: "SET_INITIAL",
          state: {
            title: initialData.title,
            content: initialData.content,
            category: initialData.category,
            publishedAt: initialData.published_at ?? null,
          },
        });
      });
    }
    if (open && mode === "create") {
      const defaultCat = writeCategories.includes("미분류")
        ? "미분류"
        : (writeCategories[0] ?? "미분류");
      startTransition(() => {
        dispatch({ type: "RESET", defaultCategory: defaultCat });
      });

      // 드래프트가 있으면 복원 여부를 묻는 토스트 표시
      if (hasDraft) {
        toast("이전 작성 내용 복원", {
          description: "이전에 작성하던 내용이 있습니다.",
          duration: 8000,
          action: {
            label: "복원",
            onClick: () => {
              const draft = restoreDraft();
              if (draft) {
                dispatch({
                  type: "SET_INITIAL",
                  state: {
                    title: draft.title ?? "",
                    content: draft.content ?? "",
                  },
                });
                toast.success(TOAST.BOARD.DRAFT_RESTORED);
              }
            },
          },
          cancel: {
            label: "삭제",
            onClick: () => {
              clearDraft();
              toast("임시 저장 내용을 삭제했습니다.");
            },
          },
        });
      }
    }
  }, [open, mode, initialData, writeCategories, clearDraft, hasDraft, restoreDraft]);

  // 다이얼로그 닫힐 때 미리보기 URL 정리
  useEffect(() => {
    if (!open) {
      state.pendingFiles.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
    }
  }, [open, state.pendingFiles]);

  const isVote = state.category === "투표";

  // ── 투표 핸들러 ──────────────────────────────────────────────────────────

  const handleAddOption = () =>
    setField("pollOptions", [...state.pollOptions, ""]);

  const handleRemoveOption = (idx: number) =>
    setField("pollOptions", state.pollOptions.filter((_, i) => i !== idx));

  const handleOptionChange = (idx: number, val: string) =>
    setField(
      "pollOptions",
      state.pollOptions.map((o, i) => (i === idx ? val : o))
    );

  const handlePollPreset = (days: number | null) => {
    if (days === null) {
      setField("pollEndsAt", null);
      setField("customEndsAt", "");
    } else {
      const d = new Date();
      d.setDate(d.getDate() + days);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setField("customEndsAt", local);
      setField("pollEndsAt", d.toISOString());
    }
  };

  const handleCustomEndsAtChange = (val: string) => {
    setField("customEndsAt", val);
    setField("pollEndsAt", val ? new Date(val).toISOString() : null);
  };

  // ── 파일 핸들러 ──────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = MAX_FILES - state.pendingFiles.length;
    if (remaining <= 0) {
      toast.error(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(
        `10MB를 초과하는 파일은 첨부할 수 없습니다: ${oversized.map((f) => f.name).join(", ")}`
      );
    }

    const valid = toAdd.filter((f) => f.size <= MAX_FILE_SIZE);
    const newPending: PendingFile[] = valid.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));

    setField("pendingFiles", [...state.pendingFiles, ...newPending]);

    // input 초기화 (같은 파일 재선택 허용)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (idx: number) => {
    const removed = state.pendingFiles[idx];
    if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    setField(
      "pendingFiles",
      state.pendingFiles.filter((_, i) => i !== idx)
    );
  };

  // ── 업로드 ────────────────────────────────────────────────────────────────

  const uploadFiles = async (postId: string): Promise<void> => {
    if (state.pendingFiles.length === 0) return;
    if (!user) return;

    for (const pf of state.pendingFiles) {
      const ext = pf.file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${postId}/${Date.now()}_${pf.file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("board-attachments")
        .upload(path, pf.file, { upsert: false });

      if (uploadError || !uploadData) {
        toast.error(`파일 업로드 실패: ${pf.file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("board-attachments")
        .getPublicUrl(uploadData.path);

      const { error: insertError } = await supabase
        .from("board_post_attachments")
        .insert({
          post_id: postId,
          file_url: urlData.publicUrl,
          file_name: pf.file.name,
          file_type: pf.file.type || `application/${ext}`,
          file_size: pf.file.size,
        });

      if (insertError) {
        toast.error(`첨부파일 저장 실패: ${pf.file.name}`);
      }
    }

    invalidateBoardPostAttachments(postId);
  };

  // ── 제출 ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!state.title.trim()) return;

    await execute(async () => {
      if (mode === "edit" && initialData) {
        // 수정 전 내용을 리비전으로 저장
        if (user) {
          await savePostRevision({
            postId: initialData.id,
            title: initialData.title,
            content: initialData.content,
            revisedBy: user.id,
          });
          invalidatePostRevisions(initialData.id);
        }

        const { error } = await supabase
          .from("board_posts")
          .update({
            title: state.title.trim(),
            content: state.content.trim(),
            category: state.category,
            published_at: state.publishedAt ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id);

        if (error) {
          toast.error(TOAST.BOARD.POST_UPDATE_ERROR);
          return;
        }

        // 수정 모드에서도 새 파일 업로드 가능
        if (state.pendingFiles.length > 0) {
          await uploadFiles(initialData.id);
        }

        setOpen(false);
        onCreated();
        return;
      }

      // create mode
      if (!user) return;

      const { data: post, error } = await supabase
        .from("board_posts")
        .insert({
          group_id: groupId,
          project_id: projectId || null,
          category: state.category,
          author_id: user.id,
          title: state.title.trim(),
          content: state.content.trim(),
          published_at: state.publishedAt ?? null,
        })
        .select("id")
        .single();

      if (error || !post) {
        toast.error(TOAST.BOARD.POST_CREATE_ERROR);
        return;
      }

      // 투표 생성
      if (isVote) {
        const validOptions = state.pollOptions.filter((o) => o.trim());
        if (validOptions.length >= 2) {
          const { data: poll } = await supabase
            .from("board_polls")
            .insert({
              post_id: post.id,
              allow_multiple: state.allowMultiple,
              ends_at: state.pollEndsAt ?? null,
            })
            .select("id")
            .single();

          if (poll) {
            await supabase.from("board_poll_options").insert(
              validOptions.map((text, idx) => ({
                poll_id: poll.id,
                text: text.trim(),
                sort_order: idx,
              }))
            );
          }
        }
      }

      // 파일 업로드
      await uploadFiles(post.id);

      // 공지사항 카테고리 게시글 작성 시 그룹 멤버 전체에게 알림 (즉시 발행인 경우만)
      if (state.category === "공지사항" && !state.publishedAt) {
        const { data: members } = await supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId);

        if (members && members.length > 0) {
          const authorName =
            (
              await supabase
                .from("profiles")
                .select("name")
                .eq("id", user.id)
                .single()
            ).data?.name ?? "누군가";
          const postPath = projectId
            ? `/groups/${groupId}/projects/${projectId}/board/${post.id}`
            : `/groups/${groupId}/board/${post.id}`;

          // 본인 제외 멤버에게 알림
          const otherMembers = members.filter(
            (m: { user_id: string }) => m.user_id !== user.id
          );
          await Promise.all(
            otherMembers.map((m: { user_id: string }) =>
              createNotification({
                userId: m.user_id,
                type: "new_post",
                title: "새 공지",
                message: `${authorName}님이 공지사항을 작성했습니다: ${state.title.trim()}`,
                link: postPath,
              })
            )
          );
        }
      }

      // 제출 성공 후 드래프트 삭제
      clearDraft();

      const defaultCat = writeCategories.includes("미분류")
        ? "미분류"
        : (writeCategories[0] ?? "미분류");
      dispatch({ type: "RESET", defaultCategory: defaultCat });
      setOpen(false);

      if (state.publishedAt && new Date(state.publishedAt) > new Date()) {
        toast.success(
          `글이 예약되었습니다. ${new Date(state.publishedAt).toLocaleString("ko-KR", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })} 발행 예정`
        );
      }

      onCreated();
    });
  };

  // ── JSX ───────────────────────────────────────────────────────────────────

  const dialogContent = (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{mode === "edit" ? "글 수정" : "새 글 작성"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">카테고리</Label>
          <Select
            value={state.category}
            onValueChange={(v) => setField("category", v)}
            disabled={mode === "edit" && state.category === "투표"}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {writeCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">
            제목 <span className="text-destructive">*</span>
          </Label>
          <Input
            className="mt-1"
            placeholder="제목을 입력하세요"
            value={state.title}
            maxLength={150}
            onChange={(e) => {
              setField("title", e.target.value);
              if (mode === "create") {
                saveDraft({ title: e.target.value, content: state.content });
              }
            }}
          />
        </div>
        <div>
          <Label className="text-xs">내용</Label>
          <Textarea
            className="mt-1 min-h-[120px]"
            placeholder="내용을 입력하세요"
            value={state.content}
            maxLength={10000}
            onChange={(e) => {
              setField("content", e.target.value);
              if (mode === "create") {
                saveDraft({ title: state.title, content: e.target.value });
              }
            }}
          />
        </div>

        {/* 투표 옵션 - create 모드에서만 */}
        {isVote && mode === "create" && (
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">투표 옵션</Label>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground">복수선택</Label>
                <Switch
                  checked={state.allowMultiple}
                  onCheckedChange={(v) => setField("allowMultiple", v)}
                />
              </div>
            </div>
            {state.pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  className="flex-1"
                  placeholder={`옵션 ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {state.pollOptions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleRemoveOption(idx)}
                    aria-label="옵션 삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleAddOption}
            >
              <Plus className="h-3 w-3 mr-1" />
              옵션 추가
            </Button>

            {/* 마감일 설정 */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <Label className="text-[11px] text-muted-foreground">마감일</Label>
              </div>
              <div className="flex gap-1 flex-wrap">
                {[
                  { label: "1일", days: 1 },
                  { label: "3일", days: 3 },
                  { label: "7일", days: 7 },
                ].map(({ label, days }) => {
                  const isActive = (() => {
                    if (!state.pollEndsAt || !state.customEndsAt) return false;
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    const diff = Math.abs(
                      new Date(state.pollEndsAt).getTime() - d.getTime()
                    );
                    return diff < 60 * 1000;
                  })();
                  return (
                    <Button
                      key={days}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => handlePollPreset(days)}
                    >
                      {label}
                    </Button>
                  );
                })}
                <Button
                  type="button"
                  variant={!state.pollEndsAt ? "default" : "outline"}
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  onClick={() => handlePollPreset(null)}
                >
                  마감 없음
                </Button>
              </div>
              <Input
                type="datetime-local"
                className="h-7 text-xs"
                value={state.customEndsAt}
                onChange={(e) => handleCustomEndsAtChange(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* 파일 첨부 영역 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">첨부파일</Label>
            <span className="text-[10px] text-muted-foreground">
              {state.pendingFiles.length}/{MAX_FILES} · 최대 10MB
            </span>
          </div>

          {/* 선택된 파일 목록 */}
          {state.pendingFiles.length > 0 && (
            <div className="space-y-1.5">
              {state.pendingFiles.map((pf, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-muted/40"
                >
                  {pf.previewUrl ? (
                    <NextImage
                      src={pf.previewUrl}
                      alt={pf.file.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover shrink-0 border"
                      unoptimized
                    />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium">{pf.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(pf.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleRemoveFile(idx)}
                    aria-label="파일 제거"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* 파일 선택 버튼 */}
          {state.pendingFiles.length < MAX_FILES && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs w-full"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-3 w-3 mr-1" />
              파일 선택
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          />
        </div>

        {/* 예약 발행 */}
        <BoardScheduleInput
          value={state.publishedAt}
          onChange={(v) => setField("publishedAt", v)}
        />

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !state.title.trim()}
        >
          {submitting
            ? mode === "edit"
              ? "수정 중..."
              : "작성 중..."
            : state.publishedAt && new Date(state.publishedAt) > new Date()
              ? mode === "edit"
                ? "예약 수정"
                : "예약 발행"
              : mode === "edit"
                ? "수정"
                : "작성"}
        </Button>
      </div>
    </DialogContent>
  );

  // Edit 모드에서는 외부에서 open/onOpenChange 제어
  if (mode === "edit") {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          글쓰기
        </Button>
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
