"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SocialCalendarPost, SocialPlatformType, SocialPostStatus } from "@/types";
import { PLATFORMS, PLATFORM_LABEL, type PostForm } from "./types";

// ============================================================
// Props
// ============================================================

type PostFormDialogProps = {
  open: boolean;
  editTarget: SocialCalendarPost | null;
  form: PostForm;
  memberNames: string[];
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (updater: (prev: PostForm) => PostForm) => void;
};

// ============================================================
// 컴포넌트
// ============================================================

export function PostFormDialog({
  open,
  editTarget,
  form,
  memberNames,
  onClose,
  onSubmit,
  onFormChange,
}: PostFormDialogProps) {
  const dialogTitleId = "post-form-dialog-title";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
        aria-labelledby={dialogTitleId}
      >
        <DialogHeader>
          <DialogTitle id={dialogTitleId}>
            {editTarget ? "게시물 수정" : "게시물 추가"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2" role="form" aria-label="게시물 폼">
          {/* 플랫폼 */}
          <div className="space-y-1">
            <Label htmlFor="post-platform" className="text-xs">
              플랫폼
            </Label>
            <Select
              value={form.platform}
              onValueChange={(v) =>
                onFormChange((f) => ({
                  ...f,
                  platform: v as SocialPlatformType,
                }))
              }
            >
              <SelectTrigger
                id="post-platform"
                className="h-8 text-xs"
                aria-label="플랫폼 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((pl) => (
                  <SelectItem key={pl} value={pl} className="text-xs">
                    {PLATFORM_LABEL[pl]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 제목 */}
          <div className="space-y-1">
            <Label htmlFor="post-title" className="text-xs">
              제목 <span aria-label="필수">*</span>
            </Label>
            <Input
              id="post-title"
              className="h-8 text-xs"
              placeholder="게시물 제목"
              value={form.title}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, title: e.target.value }))
              }
              aria-required="true"
            />
          </div>

          {/* 내용 */}
          <div className="space-y-1">
            <Label htmlFor="post-content" className="text-xs">
              내용
            </Label>
            <Textarea
              id="post-content"
              className="text-xs resize-none"
              rows={3}
              placeholder="게시할 내용을 입력하세요."
              value={form.content}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, content: e.target.value }))
              }
            />
          </div>

          {/* 날짜 / 시간 */}
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">예약 일정</legend>
            <div className="space-y-1">
              <Label htmlFor="post-date" className="text-xs">
                날짜 <span aria-label="필수">*</span>
              </Label>
              <Input
                id="post-date"
                type="date"
                className="h-8 text-xs"
                value={form.scheduledDate}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    scheduledDate: e.target.value,
                  }))
                }
                aria-required="true"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="post-time" className="text-xs">
                시간
              </Label>
              <Input
                id="post-time"
                type="time"
                className="h-8 text-xs"
                value={form.scheduledTime}
                onChange={(e) =>
                  onFormChange((f) => ({
                    ...f,
                    scheduledTime: e.target.value,
                  }))
                }
              />
            </div>
          </fieldset>

          {/* 미디어 유형 */}
          <div className="space-y-1">
            <Label htmlFor="post-media-type" className="text-xs">
              미디어 유형
            </Label>
            <Select
              value={form.mediaType}
              onValueChange={(v) =>
                onFormChange((f) => ({
                  ...f,
                  mediaType: v as PostForm["mediaType"],
                }))
              }
            >
              <SelectTrigger
                id="post-media-type"
                className="h-8 text-xs"
                aria-label="미디어 유형 선택"
              >
                <SelectValue placeholder="선택 안 함" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photo" className="text-xs">
                  사진
                </SelectItem>
                <SelectItem value="video" className="text-xs">
                  영상
                </SelectItem>
                <SelectItem value="reel" className="text-xs">
                  릴스
                </SelectItem>
                <SelectItem value="story" className="text-xs">
                  스토리
                </SelectItem>
                <SelectItem value="text" className="text-xs">
                  텍스트
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 해시태그 */}
          <div className="space-y-1">
            <Label htmlFor="post-hashtags" className="text-xs">
              해시태그 (쉼표로 구분)
            </Label>
            <Input
              id="post-hashtags"
              className="h-8 text-xs"
              placeholder="댄스, 퍼포먼스, 연습"
              value={form.hashtagsRaw}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, hashtagsRaw: e.target.value }))
              }
              aria-describedby="post-hashtags-hint"
            />
            <p id="post-hashtags-hint" className="sr-only">
              쉼표로 여러 해시태그를 구분하세요
            </p>
          </div>

          {/* 담당자 */}
          <div className="space-y-1">
            <Label
              htmlFor={memberNames.length > 0 ? "post-assignee-select" : "post-assignee-input"}
              className="text-xs"
            >
              담당자
            </Label>
            {memberNames.length > 0 ? (
              <Select
                value={form.assignee}
                onValueChange={(v) =>
                  onFormChange((f) => ({ ...f, assignee: v }))
                }
              >
                <SelectTrigger
                  id="post-assignee-select"
                  className="h-8 text-xs"
                  aria-label="담당자 선택"
                >
                  <SelectValue placeholder="담당자 선택" />
                </SelectTrigger>
                <SelectContent>
                  {memberNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="post-assignee-input"
                className="h-8 text-xs"
                placeholder="담당자 이름"
                value={form.assignee}
                onChange={(e) =>
                  onFormChange((f) => ({ ...f, assignee: e.target.value }))
                }
              />
            )}
          </div>

          {/* 상태 */}
          <div className="space-y-1">
            <Label htmlFor="post-status" className="text-xs">
              상태
            </Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                onFormChange((f) => ({
                  ...f,
                  status: v as SocialPostStatus,
                }))
              }
            >
              <SelectTrigger
                id="post-status"
                className="h-8 text-xs"
                aria-label="상태 선택"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft" className="text-xs">
                  초안
                </SelectItem>
                <SelectItem value="scheduled" className="text-xs">
                  예정
                </SelectItem>
                <SelectItem value="published" className="text-xs">
                  게시완료
                </SelectItem>
                <SelectItem value="cancelled" className="text-xs">
                  취소
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 메모 */}
          <div className="space-y-1">
            <Label htmlFor="post-notes" className="text-xs">
              메모
            </Label>
            <Textarea
              id="post-notes"
              className="text-xs resize-none"
              rows={2}
              placeholder="추가 메모 사항"
              value={form.notes}
              onChange={(e) =>
                onFormChange((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            취소
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={onSubmit}>
            {editTarget ? "수정" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
