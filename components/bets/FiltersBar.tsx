"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BetFilterSelectRow } from "@/components/bets/BetFilterSelectRow";
import {
  BET_STATUS_FILTER_ITEMS,
  BET_TYPE_FILTER_ITEMS,
} from "@/lib/constants";
import { FORM_FILTER_CONTROL } from "@/lib/form-field-classes";
import { LIMITS, sanitizeSearchQueryField } from "@/lib/validation";

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
      const q = sanitizeSearchQueryField(localSearch);
      onChange((prev) =>
        prev.search === q ? prev : { ...prev, search: q }
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

  const sportFilterItems = useMemo(
    () => sportOptions.map((s) => ({ value: s, label: s })),
    [sportOptions]
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
            className={FORM_FILTER_CONTROL}
            value={localSearch}
            maxLength={LIMITS.searchQuery}
            onChange={(e) =>
              setLocalSearch(sanitizeSearchQueryField(e.target.value))
            }
          />
        </div>
        <BetFilterSelectRow
          fieldLabel="Спорт / лига"
          value={value.sport}
          onChange={(sport) =>
            onChange((prev) => ({ ...prev, sport }))
          }
          allLabel="Все из списка"
          items={sportFilterItems}
        />
        <BetFilterSelectRow
          fieldLabel="Тип ставки"
          value={value.betType}
          onChange={(betType) =>
            onChange((prev) => ({ ...prev, betType }))
          }
          allLabel="Все типы"
          items={BET_TYPE_FILTER_ITEMS}
        />
        <BetFilterSelectRow
          fieldLabel="Статус"
          value={value.status}
          onChange={(status) =>
            onChange((prev) => ({ ...prev, status }))
          }
          allLabel="Все статусы"
          items={BET_STATUS_FILTER_ITEMS}
        />
        <div className="min-w-[130px]">
          <label className="section-label mb-1 block">С даты</label>
          <Input
            type="date"
            className={FORM_FILTER_CONTROL}
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
            className={FORM_FILTER_CONTROL}
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
