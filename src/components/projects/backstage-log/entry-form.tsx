"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { BackstageLogCategory } from "@/types";
import { CATEGORY_CONFIG } from "./types";

// ============================================================
// 로그 항목 입력 폼
// ============================================================

export function EntryForm({
  sessionId,
  onAdd,
}: {
  sessionId: string;
  onAdd: (
    sessionId: string,
    params: {
      senderName: string;
      message: string;
      category: BackstageLogCategory;
    }
  ) => void;
}) {
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<BackstageLogCategory>("general");
  const { pending: submitting, execute } = useAsyncAction();

  const formId = `entry-form-${sessionId}`;

  const handleSubmit = async () => {
    if (!senderName.trim()) {
      toast.error(TOAST.BACKSTAGE_LOG.SENDER_REQUIRED);
      return;
    }
    if (!message.trim()) {
      toast.error(TOAST.BACKSTAGE_LOG.MESSAGE_REQUIRED);
      return;
    }
    await execute(async () => {
      onAdd(sessionId, { senderName, message, category });
      setMessage("");
      toast.success(TOAST.BACKSTAGE_LOG.LOG_ADDED);
    });
  };

  return (
    <div
      className="border rounded-lg p-3 space-y-2 bg-gray-50"
      role="form"
      aria-label="로그 항목 입력"
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label
            htmlFor={`${formId}-sender`}
            className="text-[10px] text-gray-500"
          >
            발신자
          </Label>
          <Input
            id={`${formId}-sender`}
            placeholder="이름 입력"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            className="h-7 text-xs"
            aria-required="true"
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={`${formId}-category`}
            className="text-[10px] text-gray-500"
          >
            카테고리
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as BackstageLogCategory)}
          >
            <SelectTrigger
              id={`${formId}-category`}
              className="h-7 text-xs"
              aria-label="카테고리 선택"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  <span className="flex items-center gap-1">
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label
          htmlFor={`${formId}-message`}
          className="text-[10px] text-gray-500"
        >
          메시지
        </Label>
        <div className="flex gap-2">
          <Textarea
            id={`${formId}-message`}
            placeholder="메시지를 입력하세요..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="text-xs min-h-[56px] resize-none flex-1"
            aria-required="true"
            aria-describedby={`${formId}-hint`}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSubmit();
              }
            }}
          />
          <Button
            size="sm"
            className="h-auto px-3 text-xs self-end"
            onClick={handleSubmit}
            disabled={submitting}
            aria-busy={submitting}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
            전송
          </Button>
        </div>
        <p
          id={`${formId}-hint`}
          className="text-[10px] text-gray-400"
          aria-live="polite"
        >
          Ctrl+Enter로 전송
        </p>
      </div>
    </div>
  );
}
