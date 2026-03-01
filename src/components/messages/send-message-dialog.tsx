"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeText } from "@/lib/sanitize";
import { useDialogForm } from "@/hooks/use-dialog-form";

interface SendMessageDialogProps {
  receiverId: string;
  receiverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContent?: string;
}

export function SendMessageDialog({
  receiverId,
  receiverName,
  open,
  onOpenChange,
  defaultContent = "",
}: SendMessageDialogProps) {
  const { values, setValue, handleOpenChange } = useDialogForm(
    { content: defaultContent, sent: false },
    { onClose: () => onOpenChange(false) }
  );
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleClose = (value: boolean) => {
    handleOpenChange(value);
    if (!value) onOpenChange(false);
  };

  const handleSend = async () => {
    if (!values.content.trim() || sending) return;
    setSending(true);

    if (!user) {
      setSending(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: sanitizeText(values.content),
    });

    setSending(false);
    if (!error) {
      setValue("sent", true);
      setValue("content", "");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{receiverName}님에게 메시지 보내기</DialogTitle>
        </DialogHeader>

        {values.sent ? (
          <div className="space-y-3 text-center py-2">
            <p className="text-sm text-muted-foreground">메시지를 보냈습니다</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
                닫기
              </Button>
              <Button size="sm" asChild>
                <Link href={`/messages/${receiverId}`}>대화로 이동</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Textarea
                placeholder="메시지 내용을 입력하세요"
                value={values.content}
                onChange={(e) => setValue("content", e.target.value)}
                maxLength={2000}
                showCharCount={true}
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={!values.content.trim() || sending}
            >
              {sending ? "전송 중..." : "보내기"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
