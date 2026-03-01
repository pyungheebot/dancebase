"use client";

/**
 * 사이드바 하단 푸터 - 화면 설정 Popover
 * 테마 선택 (라이트/다크/고대비) + 글꼴 크기 슬라이더
 * React.memo 적용: 테마/폰트 변경 시에만 리렌더
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { useSettings, type Theme } from "@/hooks/use-settings";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings, Sun, Moon, Eye, Type } from "lucide-react";

// 테마 옵션 목록
const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "라이트", icon: Sun },
  { value: "dark", label: "다크", icon: Moon },
  { value: "high-contrast", label: "고대비", icon: Eye },
];

export const SidebarFooter = memo(function SidebarFooter() {
  const { theme, fontScale, setTheme, setFontScale } = useSettings();

  return (
    <div className="px-2 pb-2 pt-1">
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-sm px-2 py-1 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 transition-colors w-full"
            aria-label="화면 설정 열기"
            aria-haspopup="dialog"
          >
            <Settings className="h-4 w-4 opacity-50" aria-hidden="true" />
            화면 설정
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-52" aria-label="화면 설정">
          <div className="space-y-3">
            {/* 테마 선택 */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground" id="theme-group-label">테마</p>
              <div className="grid grid-cols-3 gap-0.5" role="group" aria-labelledby="theme-group-label">
                {THEME_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      aria-pressed={theme === opt.value}
                      aria-label={`${opt.label} 테마`}
                      className={cn(
                        "flex items-center justify-center gap-1 rounded-sm px-1.5 py-1 text-xs transition-colors",
                        theme === opt.value
                          ? "bg-accent font-medium"
                          : "hover:bg-accent text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 글꼴 크기 슬라이더 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1" id="font-scale-label">
                  <Type className="h-3.5 w-3.5" aria-hidden="true" />
                  글꼴
                </p>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                  {Math.round(fontScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground" aria-hidden="true">가</span>
                <Slider
                  value={[fontScale]}
                  min={0.75}
                  max={1.25}
                  step={0.05}
                  onValueChange={([v]) => setFontScale(v)}
                  className="flex-1"
                  aria-label="글꼴 크기"
                  aria-valuemin={75}
                  aria-valuemax={125}
                  aria-valuenow={Math.round(fontScale * 100)}
                  aria-valuetext={`${Math.round(fontScale * 100)}%`}
                />
                <span className="text-sm text-muted-foreground" aria-hidden="true">가</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
