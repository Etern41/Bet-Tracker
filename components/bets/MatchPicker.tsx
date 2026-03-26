"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SPORTS_RU } from "@/lib/constants";
import {
  extractBestOdds,
  parseBookmakersFromCache,
  avgPriceForOutcome,
  type OddsEventWithOdds,
} from "@/components/bets/match-odds";

type OddsSport = {
  key: string;
  title: string;
  active: boolean;
};

export type MatchPickResult = {
  matchTitle: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchDate: string;
  externalMatchId: string;
  sportKey: string;
  sportDisplay: string;
  suggestedOdds: number | null;
};

type CachedMatch = {
  id: string;
  externalId: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  oddsData: unknown;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pick: MatchPickResult) => void;
};

const PREFERRED_KEYS = Object.keys(SPORTS_RU).filter((k) => k !== "upcoming");

export function MatchPicker({ open, onOpenChange, onSelect }: Props) {
  const [sports, setSports] = useState<OddsSport[]>([]);
  const [sportKey, setSportKey] = useState("soccer_epl");
  const [includeOdds, setIncludeOdds] = useState(false);
  const [matches, setMatches] = useState<CachedMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/sports");
        const data: unknown = await res.json();
        const list =
          typeof data === "object" &&
          data !== null &&
          "sports" in data &&
          Array.isArray((data as { sports: unknown }).sports)
            ? ((data as { sports: OddsSport[] }).sports as OddsSport[])
            : [];
        if (!cancelled) {
          setSports(list.filter((s) => s.active));
          if (list.length && !list.find((s) => s.key === sportKey)) {
            setSportKey(list.find((s) => s.active)?.key ?? "soccer_epl");
          }
        }
      } catch {
        if (!cancelled) setSports([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sportKey]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const q = new URLSearchParams({
        sport: sportKey,
        includeOdds: includeOdds ? "true" : "false",
      });
      const res = await fetch(`/api/matches?${q}`);
      const data: unknown = await res.json();
      const list =
        typeof data === "object" &&
        data !== null &&
        "matches" in data &&
        Array.isArray((data as { matches: unknown }).matches)
          ? ((data as { matches: CachedMatch[] }).matches as CachedMatch[])
          : [];
      setMatches(list);
    } catch {
      setError(true);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [sportKey, includeOdds]);

  useEffect(() => {
    if (!open) return;
    loadMatches();
  }, [open, loadMatches]);

  const tabSports = useMemo(() => {
    const pref = PREFERRED_KEYS.map((k) => sports.find((s) => s.key === k)).filter(
      Boolean
    ) as OddsSport[];
    const rest = sports.filter((s) => !PREFERRED_KEYS.includes(s.key));
    const seen = new Set(pref.map((s) => s.key));
    return [...pref, ...rest.filter((s) => !seen.has(s.key))];
  }, [sports]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter(
      (m) =>
        m.homeTeam.toLowerCase().includes(q) || m.awayTeam.toLowerCase().includes(q)
    );
  }, [matches, search]);

  function h2hBadges(m: CachedMatch): { home: string; draw: string; away: string } | null {
    const bm = parseBookmakersFromCache(m.oddsData);
    if (bm.length === 0) return null;
    const ev: OddsEventWithOdds = {
      id: m.externalId,
      sport_key: m.sportKey,
      sport_title: m.sportTitle,
      commence_time: m.commenceTime,
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      bookmakers: bm,
    };
    const h = extractBestOdds(ev, m.homeTeam);
    const a = extractBestOdds(ev, m.awayTeam);
    const d = avgPriceForOutcome(bm, "Draw");
    if (h == null && a == null && d == null) return null;
    return {
      home: h != null ? String(h) : "—",
      draw: d != null ? String(d) : "—",
      away: a != null ? String(a) : "—",
    };
  }

  function selectMatch(m: CachedMatch) {
    const bm = parseBookmakersFromCache(m.oddsData);
    const ev: OddsEventWithOdds = {
      id: m.externalId,
      sport_key: m.sportKey,
      sport_title: m.sportTitle,
      commence_time: m.commenceTime,
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      bookmakers: bm,
    };
    const suggestedOdds = extractBestOdds(ev, m.homeTeam);
    onSelect({
      matchTitle: `${m.homeTeam} vs ${m.awayTeam}`,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      league: m.sportTitle,
      matchDate: new Date(m.commenceTime).toISOString(),
      externalMatchId: m.externalId,
      sportKey: m.sportKey,
      sportDisplay: SPORTS_RU[m.sportKey] ?? m.sportTitle,
      suggestedOdds: suggestedOdds,
    });
    onOpenChange(false);
    setSearch("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] min-w-0 max-w-[calc(100vw-2rem)] overflow-hidden border-border bg-card sm:max-w-lg md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Выбрать матч</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-3">
          <div className="flex max-w-full gap-1 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-gutter:stable]">
            {tabSports.map((s) => (
              <Button
                key={s.key}
                type="button"
                size="sm"
                variant={sportKey === s.key ? "default" : "outline"}
                className="shrink-0"
                onClick={() => setSportKey(s.key)}
              >
                {SPORTS_RU[s.key] ?? s.title}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="inc-odds"
                checked={includeOdds}
                onCheckedChange={(c) => setIncludeOdds(c === true)}
              />
              <label htmlFor="inc-odds" className="text-sm text-foreground cursor-pointer">
                Загрузить коэффициенты
              </label>
            </div>
            {includeOdds ? (
              <p className="text-xs text-warning">
                Использует 1 кредит API (500/мес в бесплатном тарифе)
              </p>
            ) : null}
          </div>

          <Input
            placeholder="Поиск по команде…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-border bg-background/80 dark:bg-input/40"
          />

          <div className="min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12">
                <Skeleton className="h-8 w-8 rounded-full" />
                <p className="text-sm text-muted-foreground">Загрузка матчей…</p>
              </div>
            ) : error ? (
              <p className="py-8 text-center text-sm text-destructive">
                Не удалось загрузить матчи. Попробуйте позже.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Матчи не найдены или вид спорта не в сезоне
              </p>
            ) : (
              <ScrollArea className="h-[min(50vh,420px)] pr-3">
                <ul className="space-y-2">
                  {filtered.map((m) => {
                    const badges = h2hBadges(m);
                    return (
                      <li
                        key={m.id}
                        className="rounded-lg border border-border bg-card p-3 card-shadow"
                      >
                        <div className="font-medium text-foreground">
                          {m.homeTeam} vs {m.awayTeam}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {m.sportTitle} ·{" "}
                          {format(new Date(m.commenceTime), "d MMM yyyy, HH:mm", {
                            locale: ru,
                          })}
                        </div>
                        {badges ? (
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded border border-border px-2 py-0.5 font-mono">
                              Дом {badges.home}
                            </span>
                            <span className="rounded border border-border px-2 py-0.5 font-mono">
                              Ничья {badges.draw}
                            </span>
                            <span className="rounded border border-border px-2 py-0.5 font-mono">
                              Гости {badges.away}
                            </span>
                          </div>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3"
                          onClick={() => selectMatch(m)}
                        >
                          Выбрать
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
