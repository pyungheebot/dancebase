"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
  const [content, setContent] = useState(defaultContent);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSend = async () => {
    if (!content.trim() || sending) return;
    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: content.trim(),
    });

    setSending(false);
    if (!error) {
      setSent(true);
      setContent("");
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSent(false);
      setContent(defaultContent);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{receiverName}님에게 메시지 보내기</DialogTitle>
        </DialogHeader>

        {sent ? (
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
            <Textarea
              placeholder="메시지 내용을 입력하세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <Button
              className="w-full"
              onClick={handleSend}
              disabled={!content.trim() || sending}
            >
              {sending ? "전송 중..." : "보내기"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
