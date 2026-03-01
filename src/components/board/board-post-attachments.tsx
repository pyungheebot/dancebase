"use client";

import { useState } from "react";
import { useBoardPostAttachments } from "@/hooks/use-board";
import { formatFileSize, isImageType } from "@/lib/utils";
import type { BoardPostAttachment } from "@/types";
import { FileText, FileImage, Download, X, ChevronLeft, ChevronRight, Paperclip } from "lucide-react";
import NextImage from "next/image";
import { Button } from "@/components/ui/button";

interface BoardPostAttachmentsProps {
  postId: string;
}

function getFileIcon(fileType: string) {
  if (isImageType(fileType)) return <FileImage className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
  return <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

interface LightboxProps {
  attachments: BoardPostAttachment[];
  initialIndex: number;
  onClose: () => void;
}

function ImageLightbox({ attachments, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const images = attachments.filter((a) => isImageType(a.file_type));
  const img = images[current];

  const goPrev = () => setCurrent((c) => Math.max(0, c - 1));
  const goNext = () => setCurrent((c) => Math.min(images.length - 1, c + 1));

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 h-8 w-8 text-white hover:bg-white/20 z-10"
          onClick={onClose}
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </Button>

        <NextImage
          src={img.file_url}
          alt={img.file_name}
          width={800}
          height={600}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />

        <div className="flex items-center gap-2 text-white">
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={goPrev}
              disabled={current === 0}
              aria-label="이전 이미지"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <span className="text-xs text-white/80">{img.file_name}</span>
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={goNext}
              disabled={current === images.length - 1}
              aria-label="다음 이미지"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BoardPostAttachments({ postId }: BoardPostAttachmentsProps) {
  const { attachments, loading } = useBoardPostAttachments(postId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (loading || attachments.length === 0) return null;

  const images = attachments.filter((a) => isImageType(a.file_type));
  const otherFiles = attachments.filter((a) => !isImageType(a.file_type));

  // 라이트박스용 이미지 인덱스 매핑
  const imageIndexOf = (attachment: BoardPostAttachment) =>
    images.findIndex((img) => img.id === attachment.id);

  return (
    <>
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          <span>첨부파일 {attachments.length}개</span>
        </div>

        {/* 이미지 썸네일 그리드 */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {images.map((attachment) => (
              <button
                key={attachment.id}
                type="button"
                className="relative aspect-square rounded-lg overflow-hidden border bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setLightboxIndex(imageIndexOf(attachment))}
                aria-label={`이미지 보기: ${attachment.file_name}`}
              >
                <NextImage
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* 기타 파일 다운로드 목록 */}
        {otherFiles.length > 0 && (
          <div className="space-y-1">
            {otherFiles.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={attachment.file_name}
                className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/40 hover:bg-muted transition-colors text-xs group"
              >
                {getFileIcon(attachment.file_type)}
                <span className="flex-1 truncate font-medium group-hover:text-primary transition-colors">
                  {attachment.file_name}
                </span>
                <span className="text-muted-foreground shrink-0">
                  {formatFileSize(attachment.file_size)}
                </span>
                <Download className="h-3 w-3 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 라이트박스 */}
      {lightboxIndex !== null && (
        <ImageLightbox
          attachments={attachments}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
