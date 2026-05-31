import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CommunityView } from "@/components/dashboard/community/CommunityView";

export default function CommunityPage() {
  return (
    <DashboardShell title="Comunidad">
      <CommunityView />
    </DashboardShell>
  );
}
