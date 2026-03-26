"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";
import { BetTypeBadge } from "@/components/bets/BetTypeBadge";
import { formatMoney, formatOdds } from "@/lib/utils";
import type { BetRow as BetRowType } from "@/components/bets/types";

type Props = {
  bet: BetRowType;
  onEdit: (bet: BetRowType) => void;
  onDelete: (bet: BetRowType) => void;
};

export function BetRow({ bet, onEdit, onDelete }: Props) {
  const status = bet.status as "WON" | "LOST" | "PENDING" | "VOID";

  let profitCell: ReactNode;
  if (bet.status === "WON" && bet.winnings != null) {
    profitCell = (
      <span className="profit-positive tabular-nums">+{formatMoney(bet.winnings)}</span>
    );
  } else if (bet.status === "LOST") {
    profitCell = (
      <span className="profit-negative tabular-nums">-{formatMoney(bet.stake)}</span>
    );
  } else if (bet.status === "PENDING") {
    profitCell = <span className="profit-neutral">---</span>;
  } else {
    profitCell = <span className="profit-neutral tabular-nums">0 ₽</span>;
  }

  return (
    <TableRow className="border-border hover:bg-accent/40">
      <TableCell className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] align-top whitespace-nowrap tabular-nums text-muted-foreground">
        {format(new Date(bet.matchDate), "dd.MM.yy", { locale: ru })}
      </TableCell>
      <TableCell className="min-w-0 align-top whitespace-normal py-2.5">
        <div
          className="break-words font-semibold leading-snug text-foreground [overflow-wrap:anywhere]"
          title={bet.matchTitle}
        >
          {bet.matchTitle}
        </div>
        {bet.league ? (
          <div className="mt-0.5 line-clamp-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere] md:hidden">
            {bet.league}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="hidden min-w-0 max-w-[11rem] align-top whitespace-normal py-2.5 text-sm text-foreground/75 md:table-cell">
        <div className="line-clamp-3 break-words [overflow-wrap:anywhere]" title={bet.league ?? undefined}>
          {bet.league ?? "—"}
        </div>
      </TableCell>
      <TableCell className="w-[7.25rem] min-w-0 max-w-[7.25rem] align-top whitespace-normal py-2.5">
        <BetTypeBadge type={bet.betType} />
      </TableCell>
      <TableCell className="w-14 min-w-14 max-w-14 align-top whitespace-nowrap py-2.5 font-mono text-sm">
        {formatOdds(bet.odds)}
      </TableCell>
      <TableCell className="w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] align-top whitespace-nowrap py-2.5 text-right font-mono text-sm">
        {formatMoney(bet.stake)}
      </TableCell>
      <TableCell className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] align-top py-2.5">
        <BetStatusBadge status={status} />
      </TableCell>
      <TableCell className="w-[6.75rem] min-w-[6.75rem] max-w-[6.75rem] align-top whitespace-nowrap py-2.5 text-right text-sm">
        {profitCell}
      </TableCell>
      <TableCell className="w-[5.25rem] min-w-[5.25rem] max-w-[5.25rem] align-top py-2.5">
        <div className="flex shrink-0 justify-end gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            aria-label="Редактировать"
            onClick={() => onEdit(bet)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 shrink-0 text-destructive hover:text-destructive"
            aria-label="Удалить"
            onClick={() => onDelete(bet)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
