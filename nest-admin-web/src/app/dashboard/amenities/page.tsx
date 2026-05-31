import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AmenitiesView } from "@/components/dashboard/amenities/AmenitiesView";

export default function AmenitiesPage() {
  return (
    <DashboardShell title="Amenidades">
      <AmenitiesView />
    </DashboardShell>
  );
}
