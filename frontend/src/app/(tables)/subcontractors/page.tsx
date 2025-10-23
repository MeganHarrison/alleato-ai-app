// Subcontractors Page - Subcontractor Directory with Data Table

import { Suspense } from "react";
import { getSubcontractors } from "@/app/actions/subcontractors-actions";
import SubcontractorsDataTable from "./SubcontractorsDataTable";
import { Skeleton } from "@/components/ui/skeleton";

async function SubcontractorsTableWrapper() {
  const subcontractors = await getSubcontractors();
  return <SubcontractorsDataTable subcontractors={subcontractors} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-[180px]" />
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

export default function SubcontractorsPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <SubcontractorsTableWrapper />
    </Suspense>
  );
}