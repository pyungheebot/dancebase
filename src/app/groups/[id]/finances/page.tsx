"use client";

import { use } from "react";
import { useGroupEntity } from "@/hooks/use-entity-data";
import { useFinance } from "@/hooks/use-finance";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { FinanceContent } from "@/components/finance/finance-content";

export default function FinancesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ctx, loading } = useGroupEntity(id);
  const { transactions, categories, financeRole, loading: financeLoading, stats, refetch } = useFinance(id);

  return (
    <EntityPageLayout ctx={ctx} loading={loading || financeLoading} notFoundMessage="그룹을 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="그룹장" />
          <EntityNav ctx={ctx} />
          {!financeRole ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">접근 권한이 없습니다</p>
            </div>
          ) : (
            <FinanceContent
              ctx={ctx}
              financeRole={financeRole}
              transactions={transactions}
              categories={categories}
              stats={stats}
              refetch={refetch}
              groupMembers={ctx.raw.groupMembers}
            />
          )}
        </>
      )}
    </EntityPageLayout>
  );
}
