import { cn } from "@/lib/utils";
import { labelBetType } from "@/lib/constants";

export function BetTypeBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const label = labelBetType(type);
  return (
    <span
      title={label}
      className={cn(
        "inline-block max-w-full min-w-0 truncate rounded-full border border-border bg-muted/40 px-2 py-0.5 text-left text-xs font-medium text-foreground align-middle",
        className
      )}
    >
      {label}
    </span>
  );
}
