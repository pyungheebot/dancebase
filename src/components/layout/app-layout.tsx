"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { CommandPalette } from "./command-palette";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <CommandPalette />
      {/* 데스크톱 사이드바 */}
      <aside className="hidden md:flex w-60 shrink-0 border-r bg-sidebar">
        <Sidebar />
      </aside>

      {/* 모바일 사이드바 */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-60 p-0 bg-sidebar">
          <SheetTitle className="sr-only">메뉴</SheetTitle>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 메인 콘텐츠 */}
      <main id="main-content" className="flex-1 overflow-y-auto">
        {/* 모바일 헤더 */}
        <div className="sticky top-0 z-10 flex items-center h-11 px-3 border-b bg-background md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarOpen(true)}
            aria-label="메뉴"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
