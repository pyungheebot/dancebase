"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { BOARD_CATEGORIES } from "@/types";
import type { BoardPost } from "@/types";
import { invalidateBoardPostAttachments } from "@/lib/swr/invalidate";
import { formatFileSize } from "@/lib/utils";
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
import { Plus, Trash2, Paperclip, X, FileText, Image } from "lucide-react";
import { toast } from "sonner";

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

export function BoardPostForm({
  groupId,
  projectId,
  onCreated,
  mode = "create",
  initialData,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: BoardPostFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("미분류");
  const [submitting, setSubmitting] = useState(false);

  // 투표
  const [pollOptions, setPollOptions] = useState<string[]>([""]);
  const [allowMultiple, setAllowMultiple] = useState(false);

  // 첨부파일
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    if (open && mode === "edit" && initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setCategory(initialData.category);
    }
    if (open && mode === "create") {
      setTitle("");
      setContent("");
      setCategory("미분류");
      setPollOptions([""]);
      setAllowMultiple(false);
      setPendingFiles([]);
    }
  }, [open, mode, initialData]);

  // 다이얼로그 닫힐 때 미리보기 URL 정리
  useEffect(() => {
    if (!open) {
      pendingFiles.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
    }
  }, [open]);

  const isVote = category === "투표";
  const writeCategories = BOARD_CATEGORIES.filter((c) => c !== "전체");

  const handleAddOption = () => setPollOptions([...pollOptions, ""]);
  const handleRemoveOption = (idx: number) =>
    setPollOptions(pollOptions.filter((_, i) => i !== idx));
  const handleOptionChange = (idx: number, val: string) =>
    setPollOptions(pollOptions.map((o, i) => (i === idx ? val : o)));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const remaining = MAX_FILES - pendingFiles.length;
    if (remaining <= 0) {
      toast.error(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다`);
      return;
    }

    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error(`10MB를 초과하는 파일은 첨부할 수 없습니다: ${oversized.map((f) => f.name).join(", ")}`);
    }

    const valid = toAdd.filter((f) => f.size <= MAX_FILE_SIZE);
    const newPending: PendingFile[] = valid.map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));

    setPendingFiles((prev) => [...prev, ...newPending]);

    // input 초기화 (같은 파일 재선택 허용)
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (idx: number) => {
    setPendingFiles((prev) => {
      const removed = prev[idx];
      if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadFiles = async (postId: string): Promise<void> => {
    if (pendingFiles.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const pf of pendingFiles) {
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

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);

    if (mode === "edit" && initialData) {
      const { error } = await supabase
        .from("board_posts")
        .update({
          title: title.trim(),
          content: content.trim(),
          category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", initialData.id);

      if (error) {
        toast.error("글 수정에 실패했습니다");
        setSubmitting(false);
        return;
      }

      // 수정 모드에서도 새 파일 업로드 가능
      if (pendingFiles.length > 0) {
        await uploadFiles(initialData.id);
      }

      setSubmitting(false);
      setOpen(false);
      onCreated();
      return;
    }

    // create mode
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const { data: post, error } = await supabase
      .from("board_posts")
      .insert({
        group_id: groupId,
        project_id: projectId || null,
        category,
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
      })
      .select("id")
      .single();

    if (error || !post) {
      toast.error("글 작성에 실패했습니다");
      setSubmitting(false);
      return;
    }

    // 투표 생성
    if (isVote) {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length >= 2) {
        const { data: poll } = await supabase
          .from("board_polls")
          .insert({
            post_id: post.id,
            allow_multiple: allowMultiple,
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

    setTitle("");
    setContent("");
    setCategory("미분류");
    setPollOptions([""]);
    setAllowMultiple(false);
    setPendingFiles([]);
    setSubmitting(false);
    setOpen(false);
    onCreated();
  };

  const dialogContent = (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{mode === "edit" ? "글 수정" : "새 글 작성"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">카테고리</Label>
          <Select value={category} onValueChange={setCategory} disabled={mode === "edit" && category === "투표"}>
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
          <Label className="text-xs">제목</Label>
          <Input
            className="mt-1"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">내용</Label>
          <Textarea
            className="mt-1 min-h-[120px]"
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
                  checked={allowMultiple}
                  onCheckedChange={setAllowMultiple}
                />
              </div>
            </div>
            {pollOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <Input
                  className="flex-1"
                  placeholder={`옵션 ${idx + 1}`}
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                />
                {pollOptions.length > 1 && (
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
          </div>
        )}

        {/* 파일 첨부 영역 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">첨부파일</Label>
            <span className="text-[10px] text-muted-foreground">
              {pendingFiles.length}/{MAX_FILES} · 최대 10MB
            </span>
          </div>

          {/* 선택된 파일 목록 */}
          {pendingFiles.length > 0 && (
            <div className="space-y-1.5">
              {pendingFiles.map((pf, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 bg-muted/40"
                >
                  {pf.previewUrl ? (
                    <img
                      src={pf.previewUrl}
                      alt={pf.file.name}
                      className="h-8 w-8 rounded object-cover shrink-0 border"
                    />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium">{pf.file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(pf.file.size)}</p>
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
          {pendingFiles.length < MAX_FILES && (
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

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
        >
          {submitting ? (mode === "edit" ? "수정 중..." : "작성 중...") : (mode === "edit" ? "수정" : "작성")}
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
