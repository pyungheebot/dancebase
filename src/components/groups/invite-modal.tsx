"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Copy, Check, Download, Link2, QrCode, Hash } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

type InviteModalProps = {
  inviteCode: string;
};

export function InviteModal({ inviteCode }: InviteModalProps) {
  const { copied: copiedCode, copy: copyCode } = useCopyToClipboard({
    successMessage: "초대 코드가 복사되었습니다",
  });
  const { copied: copiedUrl, copy: copyUrl } = useCopyToClipboard({
    successMessage: "초대 링크가 복사되었습니다",
  });

  const getInviteUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join/${inviteCode}`;
  };

  const handleCopyCode = async () => {
    await copyCode(inviteCode);
  };

  const handleCopyUrl = async () => {
    await copyUrl(getInviteUrl());
  };

  const handleDownloadQr = async () => {
    const url = getInviteUrl();
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=400x400&margin=20`;

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `groop-invite-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("QR코드가 저장되었습니다");
    } catch {
      toast.error("QR코드 저장에 실패했습니다");
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    typeof window !== "undefined" ? getInviteUrl() : ""
  )}&size=200x200&margin=10`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">멤버 초대</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>
            초대 코드, 링크, QR코드로 멤버를 초대하세요
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="code" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="code" className="text-xs gap-1">
              <Hash className="h-3 w-3" />
              초대 코드
            </TabsTrigger>
            <TabsTrigger value="url" className="text-xs gap-1">
              <Link2 className="h-3 w-3" />
              초대 링크
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs gap-1">
              <QrCode className="h-3 w-3" />
              QR코드
            </TabsTrigger>
          </TabsList>

          {/* 초대 코드 탭 */}
          <TabsContent value="code" className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">초대 코드</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={handleCopyCode} aria-label="초대 코드 복사">
                  {copiedCode ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              이 코드를 공유하면 상대방이 직접 입력하여 참여할 수 있습니다
            </p>
          </TabsContent>

          {/* 초대 링크 탭 */}
          <TabsContent value="url" className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">초대 링크</Label>
              <div className="flex gap-2">
                <Input
                  value={getInviteUrl()}
                  readOnly
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopyUrl} aria-label="초대 링크 복사">
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              링크를 클릭하면 바로 그룹에 참여할 수 있습니다
            </p>
          </TabsContent>

          {/* QR코드 탭 */}
          <TabsContent value="qr" className="mt-4 space-y-3">
            <div className="flex flex-col items-center gap-3">
              <div className="border rounded-lg p-3 bg-card">
                <Image
                  src={qrImageUrl}
                  alt="초대 QR코드"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleDownloadQr}
              >
                <Download className="h-3 w-3" />
                QR코드 저장
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              QR코드를 스캔하면 바로 그룹에 참여할 수 있습니다
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

type JoinGroupModalProps = {
  trigger?: React.ReactNode;
};

export function JoinGroupModal({ trigger }: JoinGroupModalProps) {
  const [code, setCode] = useState("");
  const { pending: loading, execute } = useAsyncAction();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    await execute(async () => {
    try {
      const { data: group } = await supabase
        .from("groups")
        .select("id, join_policy, invite_code_enabled, invite_code_expires_at")
        .eq("invite_code", code.trim())
        .single();

      if (!group) {
        setError("유효하지 않은 초대 코드입니다");
        return;
      }

      // 비활성화 체크
      if (group.invite_code_enabled === false) {
        setError("현재 초대 코드가 비활성화되어 있습니다");
        return;
      }

      // 만료일 체크
      if (group.invite_code_expires_at) {
        const expiresAt = new Date(group.invite_code_expires_at);
        if (expiresAt < new Date()) {
          setError("초대 코드가 만료되었습니다");
          return;
        }
      }

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
    }
    });
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
