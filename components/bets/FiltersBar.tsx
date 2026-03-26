"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BET_TYPE_LABELS, BET_STATUS_LABELS } from "@/lib/constants";

export type BetFiltersState = {
  search: string;
  sport: string;
  betType: string;
  status: string;
  from: string;
  to: string;
};

type Props = {
  value: BetFiltersState;
  onChange: Dispatch<SetStateAction<BetFiltersState>>;
  sportsInData: string[];
  /** false — без sticky (например, дашборд). По умолчанию true. */
  sticky?: boolean;
};

export function FiltersBar({ value, onChange, sportsInData, sticky = true }: Props) {
  const [localSearch, setLocalSearch] = useState(value.search);

  useEffect(() => {
    setLocalSearch(value.search);
  }, [value.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      onChange((prev) =>
        prev.search === localSearch ? prev : { ...prev, search: localSearch }
      );
    }, 300);
    return () => clearTimeout(t);
  }, [localSearch, onChange]);

  const hasActive =
    value.sport !== "" ||
    value.betType !== "" ||
    value.status !== "" ||
    value.from !== "" ||
    value.to !== "";

  function reset() {
    onChange({
      search: "",
      sport: "",
      betType: "",
      status: "",
      from: "",
      to: "",
    });
    setLocalSearch("");
  }

  const sportOptions = useMemo(
    () => [...sportsInData].sort((a, b) => a.localeCompare(b, "ru")),
    [sportsInData]
  );

  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:-mx-6 md:px-6"
          : "-mx-4 mb-4 border-b border-border bg-background px-4 py-3 md:-mx-6 md:px-6"
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px] flex-1">
          <label className="section-label mb-1 block">Поиск</label>
          <Input
            placeholder="Поиск по матчу…"
            className="h-9"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="section-label mb-1 block">Спорт</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={value.sport}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, sport: e.target.value }))
            }
          >
            <option value="">Все виды спорта</option>
            {sportOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="section-label mb-1 block">Тип</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={value.betType}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, betType: e.target.value }))
            }
          >
            <option value="">Все типы</option>
            {Object.entries(BET_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="section-label mb-1 block">Статус</label>
          <select
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={value.status}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">Все статусы</option>
            {Object.entries(BET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px]">
          <label className="section-label mb-1 block">С даты</label>
          <Input
            type="date"
            className="h-9"
            value={value.from}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, from: e.target.value }))
            }
          />
        </div>
        <div className="min-w-[130px]">
          <label className="section-label mb-1 block">По дату</label>
          <Input
            type="date"
            className="h-9"
            value={value.to}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, to: e.target.value }))
            }
          />
        </div>
        {hasActive ? (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Сбросить
          </Button>
        ) : null}
      </div>
    </div>
  );
}
