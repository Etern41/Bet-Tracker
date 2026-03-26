"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <span className="profit-positive">+{formatMoney(bet.winnings)}</span>
    );
  } else if (bet.status === "LOST") {
    profitCell = <span className="profit-negative">-{formatMoney(bet.stake)}</span>;
  } else if (bet.status === "PENDING") {
    profitCell = <span className="profit-neutral">---</span>;
  } else {
    profitCell = <span className="profit-neutral">0 ₽</span>;
  }

  return (
    <tr className="border-b border-border transition-colors hover:bg-accent/40">
      <td className="px-3 py-3 text-sm text-muted-foreground whitespace-nowrap">
        {format(new Date(bet.matchDate), "dd.MM.yy", { locale: ru })}
      </td>
      <td className="px-3 py-3">
        <div className="font-semibold text-foreground">{bet.matchTitle}</div>
        {bet.league ? (
          <div className="text-xs text-muted-foreground">{bet.league}</div>
        ) : null}
      </td>
      <td className="hidden px-3 py-3 text-sm text-muted-foreground md:table-cell">
        {bet.league ?? "—"}
      </td>
      <td className="px-3 py-3">
        <BetTypeBadge type={bet.betType} />
      </td>
      <td className="px-3 py-3 font-mono text-sm">{formatOdds(bet.odds)}</td>
      <td className="px-3 py-3 font-mono text-sm">{formatMoney(bet.stake)}</td>
      <td className="px-3 py-3">
        <BetStatusBadge status={status} />
      </td>
      <td className="px-3 py-3 text-sm">{profitCell}</td>
      <td className="px-3 py-3">
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Редактировать"
            onClick={() => onEdit(bet)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-destructive hover:text-destructive"
            aria-label="Удалить"
            onClick={() => onDelete(bet)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
