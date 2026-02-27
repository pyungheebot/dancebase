"use client";

import { use } from "react";
import Link from "next/link";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { JoinRequestManager } from "@/components/groups/join-request-manager";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function GroupJoinRequestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);

  // 리더만 접근 가능 (canManageSettings = 리더 전용)
  if (!loading && ctx && !ctx.permissions.canManageSettings) {
    return (
      <AppLayout>
        <div className="px-6 py-6 text-center">
          <p className="text-xs text-muted-foreground">접근 권한이 없습니다</p>
          <Button asChild size="sm" className="mt-2 h-7 text-xs">
            <Link href={`/groups/${id}`}>그룹으로 돌아가기</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  // join_policy가 approval이 아닌 경우 안내
  if (!loading && ctx && ctx.raw.group?.join_policy !== "approval") {
    return (
      <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
        {(ctx) => (
          <>
            <EntityHeader ctx={ctx} />
            <EntityNav ctx={ctx} />
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
              <UserPlus className="h-8 w-8 opacity-30" />
              <p className="text-xs">이 그룹은 가입 신청 방식이 아닙니다</p>
              <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs">
                <Link href={`/groups/${id}/settings`}>설정에서 변경하기</Link>
              </Button>
            </div>
          </>
        )}
      </EntityPageLayout>
    );
  }

  return (
    <EntityPageLayout ctx={ctx} loading={loading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} />
          <EntityNav ctx={ctx} />
          <Card className="max-w-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                가입 신청 관리
              </CardTitle>
            </CardHeader>
            <CardContent>
              <JoinRequestManager
                groupId={ctx.groupId}
                groupName={ctx.raw.group?.name ?? "그룹"}
              />
            </CardContent>
          </Card>
        </>
      )}
    </EntityPageLayout>
  );
}
