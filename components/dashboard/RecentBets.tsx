"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { BetStatusBadge } from "@/components/bets/BetStatusBadge";
import { BetTypeBadge } from "@/components/bets/BetTypeBadge";
import { formatMoney, formatOdds } from "@/lib/utils";
import type { BetRow } from "@/components/bets/types";

type Props = {
  bets: BetRow[];
  loading: boolean;
};

export function RecentBets({ bets, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <p className="section-label mb-3">Последние ставки</p>
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-md bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="section-label">Последние ставки</p>
        <Link
          href="/bets"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Все ставки →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">Матч</th>
              <th className="pb-2 pr-2 font-medium">Тип</th>
              <th className="pb-2 pr-2 font-medium">Коэф</th>
              <th className="pb-2 pr-2 font-medium">Сумма</th>
              <th className="pb-2 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {bets.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted-foreground">
                  Нет ставок
                </td>
              </tr>
            ) : null}
            {bets.slice(0, 5).map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="py-2 pr-2">
                  <div className="max-w-[200px] truncate font-medium text-foreground">
                    {b.matchTitle}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(b.matchDate), "d MMM", { locale: ru })}
                  </div>
                </td>
                <td className="py-2 pr-2">
                  <BetTypeBadge type={b.betType} />
                </td>
                <td className="py-2 pr-2 font-mono">{formatOdds(b.odds)}</td>
                <td className="py-2 pr-2 font-mono">{formatMoney(b.stake)}</td>
                <td className="py-2">
                  <BetStatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
