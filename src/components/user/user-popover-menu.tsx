"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SendMessageDialog } from "@/components/messages/send-message-dialog";
import { InviteToGroupDialog } from "@/components/user/invite-to-group-dialog";
import { InviteToProjectDialog } from "@/components/user/invite-to-project-dialog";
import { User, Mail, UserPlus, FolderPlus } from "lucide-react";

interface UserPopoverMenuProps {
  userId: string;
  displayName: string;
  groupId?: string;
  className?: string;
  children?: React.ReactNode;
}

export function UserPopoverMenu({
  userId,
  displayName,
  groupId,
  className,
  children,
}: UserPopoverMenuProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [groupInviteOpen, setGroupInviteOpen] = useState(false);
  const [projectInviteOpen, setProjectInviteOpen] = useState(false);

  // 본인 클릭 → 프로필로 직접 이동
  if (user?.id === userId) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => router.push(`/users/${userId}`)}
      >
        {children ?? displayName}
      </button>
    );
  }

  const openDialog = (dialog: "message" | "group" | "project") => {
    setPopoverOpen(false);
    // 약간 지연하여 focus trap 충돌 방지
    setTimeout(() => {
      if (dialog === "message") setMessageOpen(true);
      else if (dialog === "group") setGroupInviteOpen(true);
      else if (dialog === "project") setProjectInviteOpen(true);
    }, 100);
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button type="button" className={className}>
            {children ?? displayName}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          <button
            className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            onClick={() => {
              setPopoverOpen(false);
              router.push(`/users/${userId}`);
            }}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            프로필 보기
          </button>
          <button
            className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            onClick={() => openDialog("message")}
          >
            <Mail className="h-4 w-4 text-muted-foreground" />
            쪽지 보내기
          </button>
          <button
            className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
            onClick={() => openDialog("group")}
          >
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            그룹에 초대
          </button>
          {groupId && (
            <button
              className="flex items-center gap-2 w-full rounded px-2 py-1.5 text-sm hover:bg-muted transition-colors"
              onClick={() => openDialog("project")}
            >
              <FolderPlus className="h-4 w-4 text-muted-foreground" />
              프로젝트에 초대
            </button>
          )}
        </PopoverContent>
      </Popover>

      <SendMessageDialog
        receiverId={userId}
        receiverName={displayName}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />

      <InviteToGroupDialog
        userId={userId}
        userName={displayName}
        open={groupInviteOpen}
        onOpenChange={setGroupInviteOpen}
      />

      {groupId && (
        <InviteToProjectDialog
          userId={userId}
          userName={displayName}
          groupId={groupId}
          open={projectInviteOpen}
          onOpenChange={setProjectInviteOpen}
        />
      )}
    </>
  );
}
