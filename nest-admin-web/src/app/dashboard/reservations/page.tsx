import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ReservationsView } from "@/components/dashboard/reservations/ReservationsView";

export default function ReservationsPage() {
  return (
    <DashboardShell title="Reservas">
      <ReservationsView />
    </DashboardShell>
  );
}
