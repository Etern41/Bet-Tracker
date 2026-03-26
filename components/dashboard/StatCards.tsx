"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/utils";
import type { DashboardStats } from "@/lib/stats";

type Props = {
  stats: DashboardStats | null;
  loading: boolean;
};

export function StatCards({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const profitClass =
    stats.totalProfit > 0
      ? "profit-positive"
      : stats.totalProfit < 0
        ? "profit-negative"
        : "profit-neutral";
  const roiClass =
    stats.roi > 0 ? "profit-positive" : stats.roi < 0 ? "profit-negative" : "profit-neutral";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="section-label mb-1">Баланс</p>
          <p className={`text-2xl font-semibold tabular-nums ${profitClass}`}>
            {formatMoney(Math.round(stats.totalProfit))}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Чистая прибыль</p>
        </CardContent>
      </Card>
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="section-label mb-1">ROI</p>
          <p className={`text-2xl font-semibold tabular-nums ${roiClass}`}>
            {formatPercent(stats.roi)}
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="section-label mb-1">Винрейт</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.wonBets} побед / {stats.lostBets} поражений
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <p className="section-label mb-1">Ставок</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {stats.totalBets}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.pendingBets} в ожидании
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
