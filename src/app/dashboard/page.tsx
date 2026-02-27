"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { GroupCard } from "@/components/groups/group-card";
import { JoinGroupModal } from "@/components/groups/invite-modal";
import { useGroups } from "@/hooks/use-groups";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { groups, loading } = useGroups();

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">내 그룹</h1>
          <div className="flex gap-2">
            <JoinGroupModal />
            <Button variant="outline" size="sm" className="h-8 text-sm" asChild>
              <Link href="/groups/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                새 그룹
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-muted-foreground">아직 참여한 그룹이 없습니다</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" className="h-8" asChild>
                <Link href="/groups/new">그룹 만들기</Link>
              </Button>
              <JoinGroupModal trigger={<Button variant="outline" size="sm" className="h-8">초대 코드로 참여</Button>} />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
