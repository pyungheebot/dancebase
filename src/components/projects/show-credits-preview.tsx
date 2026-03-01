"use client";

import { useRef, useState, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { CreditSection } from "@/types";

interface CreditsPreviewProps {
  open: boolean;
  onClose: () => void;
  sections: CreditSection[];
  projectTitle?: string;
}

export function CreditsPreview({
  open,
  onClose,
  sections,
  projectTitle,
}: CreditsPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const statusId = "credits-preview-status";

  function togglePlay() {
    setPlaying((p) => !p);
  }

  function reset() {
    setPlaying(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }

  // 스크롤 애니메이션
  useEffect(() => {
    if (!playing) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let lastTime: number | null = null;
    function step(timestamp: number) {
      if (lastTime === null) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (scrollRef.current) {
        scrollRef.current.scrollTop += (delta / 1000) * 40; // 40px/s
        const el = scrollRef.current;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
          setPlaying(false);
          return;
        }
      }
      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [playing]);

  // 모달 닫힐 때 정리
  useEffect(() => {
    if (!open) {
      startTransition(() => {
        setPlaying(false);
      });
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        aria-label="공연 엔딩 크레딧 프리뷰"
        aria-describedby={statusId}
      >
        <div
          className="bg-black text-white flex flex-col"
          style={{ height: "560px" }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b border-white/10"
            role="toolbar"
            aria-label="크레딧 재생 컨트롤"
          >
            <span className="text-xs text-white/60 font-medium tracking-wider uppercase">
              Ending Credits
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-white/70 hover:text-white hover:bg-white/10 px-2"
                onClick={reset}
                aria-label="크레딧 처음으로 이동"
              >
                처음으로
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-white hover:bg-white/10 px-2"
                onClick={togglePlay}
                aria-label={playing ? "크레딧 재생 정지" : "크레딧 자동 스크롤 재생"}
                aria-pressed={playing}
              >
                {playing ? "정지" : "재생"}
              </Button>
            </div>
          </div>

          {/* 스크린 리더용 상태 안내 */}
          <span id={statusId} className="sr-only" aria-live="polite">
            {playing ? "크레딧 자동 스크롤 재생 중" : "크레딧 재생 정지됨"}
          </span>

          {/* 스크롤 영역 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
            tabIndex={0}
            aria-label="크레딧 내용"
          >
            <div className="py-16 px-8 text-center space-y-10">
              {/* 공연 제목 */}
              {projectTitle && (
                <div className="mb-12">
                  <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-2">
                    Presented by
                  </p>
                  <h2 className="text-xl font-light tracking-wider text-white">
                    {projectTitle}
                  </h2>
                </div>
              )}

              {/* 섹션 목록 */}
              <div role="list" aria-label="크레딧 섹션 목록">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    role="listitem"
                    className="space-y-3 mb-10"
                  >
                    <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-medium">
                      {section.title}
                    </p>
                    <div className="space-y-1.5" role="list" aria-label={`${section.title} 인원`}>
                      {section.people.length === 0 ? (
                        <p className="text-white/30 text-xs italic" role="listitem">
                          -
                        </p>
                      ) : (
                        section.people.map((person) => (
                          <div key={person.id} role="listitem">
                            <p className="text-white text-sm font-light">
                              {person.name}
                            </p>
                            {person.role && (
                              <p className="text-white/40 text-[10px]">
                                {person.role}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 엔딩 */}
              <div className="pt-8 pb-4">
                <p className="text-white/20 text-[10px] tracking-[0.2em] uppercase">
                  Thank You
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
