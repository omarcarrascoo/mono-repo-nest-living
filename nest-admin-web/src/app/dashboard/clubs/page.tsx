"use client";

import { ShieldAlert } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ClubsView } from "@/components/dashboard/clubs/ClubsView";
import { EmptyState } from "@/components/ui/primitives";
import { selectIsSuperAdmin, useAuthStore } from "@/stores/auth-store";

export default function ClubsPage() {
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);

  return (
    <DashboardShell title="Clubs">
      {isSuperAdmin ? (
        <ClubsView />
      ) : (
        <div className="mx-auto max-w-md pt-10">
          <EmptyState
            icon={ShieldAlert}
            title="Solo para super administradores"
            description="La gestión de clubs de la plataforma está reservada al super admin. Si necesitas crear o editar un club, contáctalo."
          />
        </div>
      )}
    </DashboardShell>
  );
}
