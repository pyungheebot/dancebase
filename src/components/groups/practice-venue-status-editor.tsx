"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_BADGE_CLASS, STATUS_LABELS } from "./practice-venue-types";
import type { PracticeVenueEntry, PracticeVenueStatus } from "@/types";

interface StatusEditorProps {
  venue: PracticeVenueEntry;
  onUpdateStatus: (id: string, status: PracticeVenueStatus) => Promise<void>;
}

export function StatusEditor({ venue, onUpdateStatus }: StatusEditorProps) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<PracticeVenueStatus>(venue.status);

  if (!editing) {
    return (
      <Badge
        className={`text-[10px] px-1.5 py-0 border cursor-pointer hover:opacity-80 ${STATUS_BADGE_CLASS[venue.status]}`}
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        aria-label={`상태: ${STATUS_LABELS[venue.status]}. 클릭하여 변경`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
      >
        {STATUS_LABELS[venue.status]}
      </Badge>
    );
  }

  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label="예약 상태 편집"
    >
      <Select
        value={status}
        onValueChange={(v) => setStatus(v as PracticeVenueStatus)}
      >
        <SelectTrigger
          className="h-6 text-[10px] w-24"
          aria-label="예약 상태 선택"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(STATUS_LABELS) as PracticeVenueStatus[]).map((s) => (
            <SelectItem key={s} value={s} className="text-[10px]">
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
        aria-label="상태 저장"
        onClick={async () => {
          await onUpdateStatus(venue.id, status);
          toast.success("예약 상태가 변경되었습니다.");
          setEditing(false);
        }}
      >
        <Check className="h-3 w-3" aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        aria-label="상태 변경 취소"
        onClick={() => {
          setStatus(venue.status);
          setEditing(false);
        }}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
}
