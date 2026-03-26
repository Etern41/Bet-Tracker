"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BET_TYPE_LABELS, BET_STATUS_LABELS, labelBetType, labelBetStatus } from "@/lib/constants";
import { LIMITS } from "@/lib/validation";

/** Значение «все» в Select — не пересекается с названиями лиг из данных. */
const FILTER_ALL = "__filter_all__";

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

const fieldClass =
  "h-9 w-full min-w-0 border-border bg-background text-foreground dark:bg-input/40";

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
            className={fieldClass}
            value={localSearch}
            maxLength={LIMITS.searchQuery}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
        <div className="min-w-[160px]">
          <label className="section-label mb-1 block">Спорт / лига</label>
          <Select
            value={value.sport === "" ? FILTER_ALL : value.sport}
            onValueChange={(v) =>
              onChange((prev) => ({
                ...prev,
                sport: !v || v === FILTER_ALL ? "" : v,
              }))
            }
          >
            <SelectTrigger size="sm" className={`${fieldClass} px-3 font-normal`}>
              <SelectValue>
                {value.sport === "" ? "Все из списка" : value.sport}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Все из списка</SelectItem>
              {sportOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <label className="section-label mb-1 block">Тип ставки</label>
          <Select
            value={value.betType === "" ? FILTER_ALL : value.betType}
            onValueChange={(v) =>
              onChange((prev) => ({
                ...prev,
                betType: !v || v === FILTER_ALL ? "" : v,
              }))
            }
          >
            <SelectTrigger size="sm" className={`${fieldClass} px-3 font-normal`}>
              <SelectValue>
                {value.betType === "" ? "Все типы" : labelBetType(value.betType)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Все типы</SelectItem>
              {Object.entries(BET_TYPE_LABELS).map(([k, lab]) => (
                <SelectItem key={k} value={k}>
                  {lab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <label className="section-label mb-1 block">Статус</label>
          <Select
            value={value.status === "" ? FILTER_ALL : value.status}
            onValueChange={(v) =>
              onChange((prev) => ({
                ...prev,
                status: !v || v === FILTER_ALL ? "" : v,
              }))
            }
          >
            <SelectTrigger size="sm" className={`${fieldClass} px-3 font-normal`}>
              <SelectValue>
                {value.status === "" ? "Все статусы" : labelBetStatus(value.status)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>Все статусы</SelectItem>
              {Object.entries(BET_STATUS_LABELS).map(([k, lab]) => (
                <SelectItem key={k} value={k}>
                  {lab}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[130px]">
          <label className="section-label mb-1 block">С даты</label>
          <Input
            type="date"
            className={fieldClass}
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
            className={fieldClass}
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
