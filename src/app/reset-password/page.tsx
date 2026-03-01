"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useAsyncAction } from "@/hooks/use-async-action";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pending: loading, execute } = useAsyncAction();
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    await execute(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar">
        <div className="w-full max-w-sm mx-auto p-6 text-center space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">이메일을 확인해 주세요</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{email}</span>로<br />
              비밀번호 재설정 링크를 발송했습니다.
            </p>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">로그인으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">비밀번호 재설정</h1>
          <p className="text-sm text-muted-foreground mt-1">
            가입한 이메일을 입력하면 재설정 링크를 보내드립니다
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-9 bg-background"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
            {loading ? "처리 중..." : "재설정 링크 보내기"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
