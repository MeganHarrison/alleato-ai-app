// Team Page - Employee Directory with Data Table

import { Suspense } from "react";
import { getEmployees } from "@/app/actions/employees-actions";
import TeamDataTable from "./TeamDataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

async function TeamTableWrapper() {
  const employees = await getEmployees();
  return <TeamDataTable employees={employees} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-3xl font-bold">Team Directory</CardTitle>
        <CardDescription>
          Manage and view all employee information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
          <TeamTableWrapper />
        </Suspense>
      </CardContent>
    </Card>
  );
}