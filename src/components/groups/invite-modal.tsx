"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";

type InviteModalProps = {
  inviteCode: string;
};

export function InviteModal({ inviteCode }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">멤버 초대</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            아래 초대 코드를 공유하여 멤버를 초대하세요
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">초대 코드</Label>
            <div className="flex gap-2">
              <Input value={inviteCode} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type JoinGroupModalProps = {
  trigger?: React.ReactNode;
};

export function JoinGroupModal({ trigger }: JoinGroupModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { data: group } = await supabase
        .from("groups")
        .select("id, join_policy")
        .eq("invite_code", code.trim())
        .single();

      if (!group) {
        setError("유효하지 않은 초대 코드입니다");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("로그인이 필요합니다");
        return;
      }

      if (group.join_policy === "approval") {
        const { error: joinReqError } = await supabase.from("join_requests").insert({
          group_id: group.id,
          user_id: user.id,
          status: "pending",
        });
        if (joinReqError) {
          if (joinReqError.code === "23505") {
            setError("이미 가입 신청한 그룹입니다");
          } else {
            setError("가입 신청에 실패했습니다");
          }
          return;
        }
        setMessage("가입 신청이 접수되었습니다. 그룹장의 승인을 기다려주세요.");
        return;
      }

      // open 또는 invite_only: 바로 가입
      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      });

      if (joinError) {
        if (joinError.code === "23505") {
          setError("이미 참여한 그룹입니다");
        } else {
          throw joinError;
        }
        return;
      }

      setOpen(false);
      router.push(`/groups/${group.id}`);
      router.refresh();
    } catch {
      setError("그룹 참여에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">초대 코드로 참여</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>그룹 참여</DialogTitle>
          <DialogDescription>초대 코드를 입력하여 그룹에 참여하세요</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleJoin} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="invite-code" className="text-xs">초대 코드</Label>
            <Input
              id="invite-code"
              placeholder="초대 코드를 입력하세요"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="font-mono"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}
          <Button type="submit" className="w-full h-8 text-sm" disabled={loading}>
            {loading ? "참여 중..." : "참여하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
