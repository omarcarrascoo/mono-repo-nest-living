import { MembershipStatus, Role } from "@/types/api";
import { Badge } from "@/components/ui/Badge";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  kitchen_operator: "Operador de cocina",
  user: "Residente",
};

export const STATUS_LABELS: Record<MembershipStatus, string> = {
  pending: "Pendiente",
  active: "Activo",
  rejected: "Rechazado",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge tone={role === "admin" ? "teal" : "neutral"}>
      {ROLE_LABELS[role]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: MembershipStatus }) {
  const tone =
    status === "active" ? "ok" : status === "pending" ? "warn" : "danger";
  return <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>;
}
