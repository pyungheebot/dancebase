"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const MyAttendanceStats = dynamic(
  () =>
    import("@/components/stats/my-attendance-stats").then((m) => ({
      default: m.MyAttendanceStats,
    })),
  { loading: () => <Skeleton className="h-64 w-full" /> }
);

const GroupOverviewStats = dynamic(
  () =>
    import("@/components/stats/group-overview-stats").then((m) => ({
      default: m.GroupOverviewStats,
    })),
  { loading: () => <Skeleton className="h-64 w-full" /> }
);

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState("my-stats");

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 py-6">
        <h1 className="text-xl font-bold mb-4">통계</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="my-stats">내 통계</TabsTrigger>
            <TabsTrigger value="group-overview">그룹 운영 현황</TabsTrigger>
          </TabsList>

          <TabsContent value="my-stats">
            <MyAttendanceStats />
          </TabsContent>

          <TabsContent value="group-overview">
            <GroupOverviewStats />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
