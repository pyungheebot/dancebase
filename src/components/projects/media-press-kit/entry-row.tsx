"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Paperclip,
  Pencil,
  Phone,
  Mail,
  Plus,
  Send,
  Trash2,
  User,
  Globe,
} from "lucide-react";
import type { MediaPressKitEntry, MediaPressKitStatus } from "@/types";
import { STATUS_CONFIG, STATUS_ORDER } from "./types";
import { OutletTag } from "./outlet-tag";

interface EntryRowProps {
  entry: MediaPressKitEntry;
  onEdit: (e: MediaPressKitEntry) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MediaPressKitStatus) => void;
  onAddOutlet: (entryId: string) => void;
  onToggleOutlet: (entryId: string, outletId: string) => void;
  onDeleteOutlet: (entryId: string, outletId: string) => void;
}

export const EntryRow = memo(function EntryRow({
  entry,
  onEdit,
  onDelete,
  onStatusChange,
  onAddOutlet,
  onToggleOutlet,
  onDeleteOutlet,
}: EntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const statusConf = STATUS_CONFIG[entry.status];
  const publishedCount = entry.outlets.filter((o) => o.published).length;
  const expandedId = `entry-detail-${entry.id}`;

  return (
    <div
      className="rounded-lg border border-gray-100 bg-card overflow-hidden"
      role="listitem"
    >
      {/* 헤더 */}
      <div className="flex items-start gap-2 p-3">
        <button
          className="mt-0.5 shrink-0"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "상세 접기" : "상세 펼치기"}
          aria-expanded={expanded}
          aria-controls={expandedId}
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={`text-[10px] px-1.5 py-0 ${statusConf.color}`}>
              {statusConf.label}
            </Badge>
            <span className="text-xs font-medium text-gray-800 truncate">
              {entry.title}
            </span>
            <time
              dateTime={entry.writtenAt}
              className="text-[10px] text-gray-400 shrink-0"
            >
              {entry.writtenAt}
            </time>
          </div>

          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <User className="h-3 w-3" aria-hidden="true" />
              {entry.contactName}
            </span>
            {entry.outlets.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Send className="h-3 w-3" aria-hidden="true" />
                {publishedCount}/{entry.outlets.length} 게재
              </span>
            )}
            {entry.attachmentUrls.length > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Paperclip className="h-3 w-3" aria-hidden="true" />
                {entry.attachmentUrls.length}개
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 shrink-0"
              aria-label={`${entry.title} 메뉴`}
            >
              <MoreVertical className="h-3 w-3" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            <DropdownMenuItem onClick={() => onEdit(entry)} className="text-xs">
              <Pencil className="h-3 w-3 mr-2" aria-hidden="true" />
              수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {STATUS_ORDER.filter((s) => s !== entry.status).map((s) => (
              <DropdownMenuItem
                key={s}
                className="text-xs"
                onClick={() => onStatusChange(entry.id, s)}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    s === "draft"
                      ? "bg-gray-400"
                      : s === "review"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  aria-hidden="true"
                />
                {STATUS_CONFIG[s].label}으로 변경
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 text-xs"
              onClick={() => onDelete(entry.id)}
            >
              <Trash2 className="h-3 w-3 mr-2" aria-hidden="true" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 상세 펼침 */}
      {expanded && (
        <div
          id={expandedId}
          className="border-t border-gray-50 px-3 pb-3 pt-2 space-y-3"
          role="region"
          aria-label={`${entry.title} 상세 정보`}
        >
          {/* 내용 */}
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              보도 내용
            </span>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded p-2">
              {entry.content}
            </p>
          </div>

          {/* 담당자 연락처 */}
          <div className="flex flex-wrap gap-3">
            {entry.contactEmail && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Mail className="h-3 w-3 text-gray-400" aria-hidden="true" />
                {entry.contactEmail}
              </span>
            )}
            {entry.contactPhone && (
              <span className="flex items-center gap-1 text-[11px] text-gray-600">
                <Phone className="h-3 w-3 text-gray-400" aria-hidden="true" />
                {entry.contactPhone}
              </span>
            )}
          </div>

          {/* 첨부파일 */}
          {entry.attachmentUrls.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                첨부파일
              </span>
              <ul className="flex flex-col gap-1" role="list" aria-label="첨부파일 목록">
                {entry.attachmentUrls.map((url, idx) => (
                  <li key={idx} role="listitem">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline truncate"
                      aria-label={`첨부파일 ${idx + 1}: ${url}`}
                    >
                      <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 배포 매체 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                배포 매체 ({entry.outlets.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => onAddOutlet(entry.id)}
                aria-label="배포 매체 추가"
              >
                <Plus className="h-2.5 w-2.5 mr-1" aria-hidden="true" />
                매체 추가
              </Button>
            </div>
            {entry.outlets.length > 0 ? (
              <div
                className="flex flex-wrap gap-1.5"
                role="list"
                aria-label="배포 매체 목록"
              >
                {entry.outlets.map((outlet) => (
                  <OutletTag
                    key={outlet.id}
                    outlet={outlet}
                    onToggle={() => onToggleOutlet(entry.id, outlet.id)}
                    onDelete={() => onDeleteOutlet(entry.id, outlet.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-400" role="status">
                아직 배포 매체가 없습니다
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
