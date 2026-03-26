import { cn } from "@/lib/utils";
import { BET_STATUS_LABELS, labelBetStatus } from "@/lib/constants";

const config = {
  WON: {
    label: BET_STATUS_LABELS.WON,
    classes: "bg-won/15 text-won border border-won/30",
  },
  LOST: {
    label: BET_STATUS_LABELS.LOST,
    classes: "bg-lost/15 text-lost border border-lost/30",
  },
  PENDING: {
    label: BET_STATUS_LABELS.PENDING,
    classes: "bg-pending/15 text-pending border border-pending/30",
  },
  VOID: {
    label: BET_STATUS_LABELS.VOID,
    classes: "bg-void/15 text-void border border-void/30",
  },
} as const;

export function BetStatusBadge({ status }: { status: string }) {
  const c = config[status as keyof typeof config];
  if (!c) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground"
        )}
      >
        {labelBetStatus(status)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        c.classes
      )}
    >
      {c.label}
    </span>
  );
}
