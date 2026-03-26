"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiltersBar, type BetFiltersState } from "@/components/bets/FiltersBar";
import { BetTable } from "@/components/bets/BetTable";
import { DeleteBetDialog } from "@/components/bets/DeleteBetDialog";
import { OddsApiBanner } from "@/components/bets/OddsApiBanner";
import { Button } from "@/components/ui/button";
import { useBetUi } from "@/components/layout/AppShell";
import type { BetRow } from "@/components/bets/types";

function isBetRow(x: unknown): x is BetRow {
  if (typeof x !== "object" || x === null) return false;
  const b = x as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.matchTitle === "string" &&
    typeof b.sport === "string" &&
    typeof b.betType === "string" &&
    typeof b.status === "string"
  );
}

export default function BetsPage() {
  const router = useRouter();
  const { openEdit } = useBetUi();
  const [filters, setFilters] = useState<BetFiltersState>({
    search: "",
    sport: "",
    betType: "",
    status: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [bets, setBets] = useState<BetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sportsInData, setSportsInData] = useState<string[]>([]);
  const [deleteBet, setDeleteBet] = useState<BetRow | null>(null);

  const filterKey = [
    filters.search.trim(),
    filters.sport,
    filters.betType,
    filters.status,
    filters.from,
    filters.to,
  ].join("|");
  const prevFilterKey = useRef<string | null>(null);

  const fetchSportsList = useCallback(async () => {
    try {
      const res = await fetch("/api/bets/sports-list");
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "sports" in data &&
        Array.isArray((data as { sports: unknown }).sports)
      ) {
        setSportsInData((data as { sports: string[] }).sports);
      }
    } catch {
      setSportsInData([]);
    }
  }, []);

  const loadBets = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("limit", "20");
      const s = filters.search.trim();
      if (s) q.set("search", s);
      if (filters.sport) q.set("sport", filters.sport);
      if (filters.betType) q.set("betType", filters.betType);
      if (filters.status) q.set("status", filters.status);
      if (filters.from) q.set("from", new Date(filters.from).toISOString());
      if (filters.to) q.set("to", new Date(`${filters.to}T23:59:59.999`).toISOString());

      const res = await fetch(`/api/bets?${q}`);
      const data: unknown = await res.json();
      if (
        typeof data !== "object" ||
        data === null ||
        !("bets" in data) ||
        !Array.isArray((data as { bets: unknown }).bets)
      ) {
        setBets([]);
        setTotal(0);
        setTotalPages(0);
        return;
      }
      const raw = (data as { bets: unknown[] }).bets;
      const parsed = raw.filter(isBetRow) as BetRow[];
      setBets(parsed);
      const d = data as unknown;
      const totalN =
        typeof d === "object" &&
        d !== null &&
        "total" in d &&
        typeof (d as { total: unknown }).total === "number"
          ? (d as { total: number }).total
          : 0;
      const pages =
        typeof d === "object" &&
        d !== null &&
        "totalPages" in d &&
        typeof (d as { totalPages: unknown }).totalPages === "number"
          ? (d as { totalPages: number }).totalPages
          : 0;
      setTotal(totalN);
      setTotalPages(pages);
    } catch {
      setBets([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, filters.search, filters.sport, filters.betType, filters.status, filters.from, filters.to]);

  useEffect(() => {
    fetchSportsList();
  }, [fetchSportsList]);

  useEffect(() => {
    const bumped = prevFilterKey.current !== null && prevFilterKey.current !== filterKey;
    prevFilterKey.current = filterKey;
    if (bumped && page !== 1) {
      setPage(1);
      return;
    }
    loadBets();
  }, [page, filterKey, loadBets]);

  const start = total === 0 ? 0 : (page - 1) * 20 + 1;
  const end = Math.min(page * 20, total);

  const empty = !loading && bets.length === 0;
  const searchActive = Boolean(filters.search.trim());

  return (
    <div>
      <OddsApiBanner />
      <FiltersBar value={filters} onChange={setFilters} sportsInData={sportsInData} />

      {empty ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
          <svg
            className="mb-1 size-16 text-muted-foreground"
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <rect x="12" y="10" width="40" height="44" rx="4" />
            <path d="M20 22h24M20 30h18M20 38h22" strokeLinecap="round" />
          </svg>
          <p className="text-muted-foreground">
            {searchActive
              ? "Ничего не найдено — попробуйте другой запрос"
              : "Нет ставок по выбранным фильтрам"}
          </p>
          {searchActive ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setFilters((p) => ({ ...p, search: "" }))}>
              Сбросить поиск
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <BetTable bets={bets} loading={loading} onEdit={openEdit} onDelete={setDeleteBet} />
          {!loading && total > 0 && totalPages > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>
                Показано {start}–{end} из {total}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Пред
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  След
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <DeleteBetDialog
        bet={deleteBet}
        open={deleteBet !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteBet(null);
        }}
        onConfirm={() => {
          setDeleteBet(null);
          loadBets();
          router.refresh();
        }}
      />
    </div>
  );
}
