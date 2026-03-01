import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Calendar, Users, DollarSign, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Groop - 댄서를 위한 그룹 관리 서비스",
  description: "일정 관리부터 출석 체크, 회비 정산, 게시판까지. 댄스 그룹 운영에 필요한 모든 것을 한 곳에서.",
};

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Groop</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">시작하기</Link>
          </Button>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl font-bold tracking-tight">댄스 그룹 관리 플랫폼</h2>
            <p className="text-lg text-muted-foreground">
              일정 관리부터 출석 체크, 회비 정산, 게시판까지.<br />
              댄스 그룹 운영에 필요한 모든 것을 한 곳에서.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">무료로 시작하기</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">로그인</Link>
            </Button>
          </div>
        </div>

        {/* 주요 기능 소개 */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card">
            <div className="p-2.5 rounded-md bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">일정 관리</p>
              <p className="text-xs text-muted-foreground">연습, 공연, 모임 일정을 한눈에</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card">
            <div className="p-2.5 rounded-md bg-green-50 text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">출석 체크</p>
              <p className="text-xs text-muted-foreground">멤버 출석을 간편하게 관리</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card">
            <div className="p-2.5 rounded-md bg-orange-50 text-orange-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">회비 정산</p>
              <p className="text-xs text-muted-foreground">투명한 회비 관리와 정산</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 p-4 rounded-lg border bg-card">
            <div className="p-2.5 rounded-md bg-purple-50 text-purple-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-sm font-medium">게시판</p>
              <p className="text-xs text-muted-foreground">공지사항과 자유로운 소통</p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t px-6 py-4 text-center">
        <p className="text-xs text-muted-foreground">Groop - 댄서를 위한 그룹 관리 서비스</p>
      </footer>
    </div>
  );
}
