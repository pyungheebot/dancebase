"use client";

import React, { memo, useState } from "react";
import { MapPin, Users, Clock, Phone, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticeRoom } from "@/types";
import { RoomFormDialog } from "./room-form-dialog";
import { formatCost, type RoomFormValues } from "./practice-room-types";

// ─── 연습실 개별 아이템 ───────────────────────────────────────

interface RoomItemProps {
  room: PracticeRoom;
  onUpdate: (v: RoomFormValues) => void;
  onDelete: () => void;
}

const RoomItem = memo(function RoomItem({
  room,
  onUpdate,
  onDelete,
}: RoomItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 헤더: 이름 + 주소 + 액션 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{room.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-muted-foreground truncate">
              {room.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* 수정 버튼 */}
          <RoomFormDialog
            title="연습실 수정"
            initial={{
              name: room.name,
              address: room.address,
              capacity: String(room.capacity),
              costPerHour: String(room.costPerHour),
              contact: room.contact,
            }}
            onSave={onUpdate}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label={`${room.name} 수정`}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
            }
          />

          {/* 삭제 확인 버튼 */}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive"
                onClick={onDelete}
                aria-label={`${room.name} 삭제 확인`}
              >
                <Check className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setConfirmDelete(false)}
                aria-label="삭제 취소"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              aria-label={`${room.name} 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* 상세 정보: 인원, 비용, 연락처 */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          {room.capacity}명
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatCost(room.costPerHour)}/시간
        </span>
        {room.contact && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" aria-hidden="true" />
            {room.contact}
          </span>
        )}
      </div>
    </div>
  );
});

// ─── 연습실 목록 섹션 ─────────────────────────────────────────

interface RoomListSectionProps {
  rooms: PracticeRoom[];
  onAddRoom: (v: RoomFormValues) => void;
  onUpdateRoom: (id: string, v: RoomFormValues) => void;
  onDeleteRoom: (id: string) => void;
}

export const RoomListSection = memo(function RoomListSection({
  rooms,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
}: RoomListSectionProps) {
  return (
    <div className="space-y-3">
      {/* 헤더: 총 개수 + 추가 버튼 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground" aria-live="polite">
          총 {rooms.length}개 연습실
        </span>
        <RoomFormDialog
          title="연습실 등록"
          onSave={onAddRoom}
          trigger={
            <Button
              size="sm"
              className="h-7 text-xs gap-1"
              aria-label="새 연습실 추가"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              연습실 추가
            </Button>
          }
        />
      </div>

      {/* 목록 또는 빈 상태 */}
      {rooms.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground" role="status">
          등록된 연습실이 없습니다.
          <br />
          연습실을 추가해보세요.
        </div>
      ) : (
        <div className="space-y-2" role="list" aria-label="연습실 목록">
          {rooms.map((room) => (
            <div key={room.id} role="listitem">
              <RoomItem
                room={room}
                onUpdate={(v) => onUpdateRoom(room.id, v)}
                onDelete={() => onDeleteRoom(room.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
