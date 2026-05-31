import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ResidentsView } from "@/components/dashboard/residents/ResidentsView";

export default function ResidentsPage() {
  return (
    <DashboardShell title="Residentes">
      <Suspense fallback={null}>
        <ResidentsView />
      </Suspense>
    </DashboardShell>
  );
}
