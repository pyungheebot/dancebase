"use client";

import { use } from "react";
import { useProjectEntity } from "@/hooks/use-entity-data";
import { useFinance } from "@/hooks/use-finance";
import { EntityPageLayout } from "@/components/layout/entity-page-layout";
import { EntityHeader } from "@/components/layout/entity-header";
import { EntityNav } from "@/components/layout/entity-nav";
import { FinanceContent } from "@/components/finance/finance-content";

export default function ProjectFinancesPage({
  params,
}: {
  params: Promise<{ id: string; projectId: string }>;
}) {
  const { id, projectId } = use(params);
  const { ctx, loading } = useProjectEntity(id, projectId);
  const {
    transactions,
    categories,
    financeRole,
    loading: financeLoading,
    stats,
    refetch,
  } = useFinance(id, projectId);

  return (
    <EntityPageLayout ctx={ctx} loading={loading || financeLoading} notFoundMessage="프로젝트를 찾을 수 없습니다">
      {(ctx) => (
        <>
          <EntityHeader ctx={ctx} leaderLabel="회비 관리자" />
          <EntityNav ctx={ctx} />
          <FinanceContent
            ctx={ctx}
            financeRole={financeRole}
            transactions={transactions}
            categories={categories}
            stats={stats}
            refetch={refetch}
          />
        </>
      )}
    </EntityPageLayout>
  );
}
