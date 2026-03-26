"use client";

import { useCallback, useEffect, useState } from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { ProfitChart } from "@/components/dashboard/ProfitChart";
import { SportDistributionChart } from "@/components/dashboard/SportDistributionChart";
import { StreakChart, type StreakPoint } from "@/components/dashboard/StreakChart";
import { RecentBets } from "@/components/dashboard/RecentBets";
import { Button } from "@/components/ui/button";
import { useBetUi } from "@/components/layout/AppShell";
import type { DashboardStats, DayProfit, SportShare } from "@/lib/stats";
import type { BetRow } from "@/components/bets/types";

type Period = "7d" | "30d" | "90d" | "all";

function statsQuery(period: Period): string {
  const to = new Date();
  if (period === "all") {
    return `range=all&to=${encodeURIComponent(to.toISOString())}`;
  }
  const from = new Date(to);
  if (period === "7d") from.setDate(from.getDate() - 7);
  if (period === "30d") from.setDate(from.getDate() - 30);
  if (period === "90d") from.setDate(from.getDate() - 90);
  return `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
}

function isBetRow(x: unknown): x is BetRow {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  return typeof b.id === "string" && typeof b.matchTitle === "string";
}

export default function DashboardPage() {
  const { openCreate } = useBetUi();
  const [period, setPeriod] = useState<Period>("30d");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profitByDay, setProfitByDay] = useState<DayProfit[]>([]);
  const [sportDistribution, setSportDistribution] = useState<SportShare[]>([]);
  const [streakSeries, setStreakSeries] = useState<StreakPoint[]>([]);
  const [recentBets, setRecentBets] = useState<BetRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, bRes] = await Promise.all([
        fetch(`/api/stats?${statsQuery(period)}`),
        fetch("/api/bets?limit=5&page=1"),
      ]);
      const sJson: unknown = await sRes.json();
      if (typeof sJson === "object" && sJson !== null && "stats" in sJson) {
        const s = sJson as Record<string, unknown>;
        const st = s.stats;
        setStats(typeof st === "object" && st !== null ? (st as DashboardStats) : null);
        setProfitByDay(Array.isArray(s.profitByDay) ? (s.profitByDay as DayProfit[]) : []);
        setSportDistribution(
          Array.isArray(s.sportDistribution) ? (s.sportDistribution as SportShare[]) : []
        );
        setStreakSeries(
          Array.isArray(s.streakSeries) ? (s.streakSeries as StreakPoint[]) : []
        );
      } else {
        setStats(null);
        setProfitByDay([]);
        setSportDistribution([]);
        setStreakSeries([]);
      }

      const bJson: unknown = await bRes.json();
      if (
        typeof bJson === "object" &&
        bJson !== null &&
        "bets" in bJson &&
        Array.isArray((bJson as { bets: unknown }).bets)
      ) {
        setRecentBets(
          ((bJson as { bets: unknown[] }).bets as unknown[]).filter(isBetRow) as BetRow[]
        );
      } else {
        setRecentBets([]);
      }
    } catch {
      setStats(null);
      setProfitByDay([]);
      setSportDistribution([]);
      setStreakSeries([]);
      setRecentBets([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const empty = !loading && (stats?.totalBets ?? 0) === 0;
  const streak = stats?.currentStreak ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(
          [
            ["7d", "7 дней"],
            ["30d", "30 дней"],
            ["90d", "3 месяца"],
            ["all", "Всё время"],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={period === key ? "default" : "outline"}
            onClick={() => setPeriod(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {empty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center">
          <svg
            className="mb-4 size-20 text-muted-foreground"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path d="M16 20 L48 20 L44 48 L20 48 Z M24 20 V14 A8 8 0 0 1 40 14 V20" />
            <line x1="24" y1="30" x2="40" y2="30" />
          </svg>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Начните отслеживать ставки
          </h2>
          <Button type="button" onClick={openCreate}>
            + Добавить первую ставку
          </Button>
        </div>
      ) : (
        <>
          <StatCards stats={stats} loading={loading} />

          {!loading && Math.abs(streak) >= 2 ? (
            <div
              className={
                streak > 0
                  ? "rounded-lg border border-won/30 bg-won/10 px-4 py-3 text-sm text-won"
                  : "rounded-lg border border-lost/30 bg-lost/10 px-4 py-3 text-sm text-lost"
              }
            >
              {streak > 0
                ? `🔥 Серия из ${streak} побед`
                : `❄️ Серия из ${Math.abs(streak)} поражений`}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <ProfitChart data={profitByDay} loading={loading} />
            <SportDistributionChart data={sportDistribution} loading={loading} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StreakChart data={streakSeries} loading={loading} />
            <RecentBets bets={recentBets} loading={loading} />
          </div>
        </>
      )}
    </div>
  );
}
