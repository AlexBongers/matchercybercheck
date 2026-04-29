import { Badge } from "@/components/ui/badge";

type Status = "scheduled" | "completed" | "cancelled" | "pending";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; variant: "success" | "secondary" | "destructive" | "warning" }> = {
  scheduled: { label: "Scheduled", variant: "success" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, variant } = config[status] ?? config.pending;
  return <Badge variant={variant}>{label}</Badge>;
}
