import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DeliveryView } from "@/components/dashboard/delivery/DeliveryView";

export default function DeliveryPage() {
  return (
    <DashboardShell title="Delivery">
      <DeliveryView />
    </DashboardShell>
  );
}
