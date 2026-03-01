import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "로그인 | Groop",
  description: "Groop에 로그인하여 댄스 그룹을 관리하세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="w-full max-w-sm mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Groop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {invite ? "로그인 후 그룹에 참여합니다" : "댄서를 위한 그룹 관리"}
          </p>
        </div>
        <AuthForm inviteCode={invite} />
      </div>
    </div>
  );
}
