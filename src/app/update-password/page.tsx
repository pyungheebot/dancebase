"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAsyncAction } from "@/hooks/use-async-action";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { pending: loading, execute } = useAsyncAction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    await execute(async () => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">새 비밀번호 설정</h1>
          <p className="text-sm text-muted-foreground mt-1">새 비밀번호를 입력해 주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs text-muted-foreground">새 비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="6자 이상 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs text-muted-foreground">비밀번호 확인</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="h-9 bg-background"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
            {loading ? "처리 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </div>
  );
}
