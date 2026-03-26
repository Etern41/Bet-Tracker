"use client";

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BET_FILTER_ALL, type BetFilterSelectItem } from "@/lib/constants";
import { FORM_FILTER_CONTROL } from "@/lib/form-field-classes";
import { cn } from "@/lib/utils";

type Props = {
  fieldLabel: string;
  value: string;
  onChange: (next: string) => void;
  allLabel: string;
  items: readonly BetFilterSelectItem[];
};

/**
 * Селект фильтра: значение «все» через sentinel, единый `itemToStringLabel` по списку пунктов.
 */
export function BetFilterSelectRow({
  fieldLabel,
  value,
  onChange,
  allLabel,
  items,
}: Props) {
  const selectValue = value === "" ? BET_FILTER_ALL : value;

  const itemToStringLabel = useCallback(
    (v: unknown) => {
      if (v === BET_FILTER_ALL) return allLabel;
      const s = String(v);
      return items.find((i) => i.value === s)?.label ?? s;
    },
    [allLabel, items]
  );

  return (
    <div className="min-w-[160px]">
      <label className="section-label mb-1 block">{fieldLabel}</label>
      <Select
        value={selectValue}
        onValueChange={(v) =>
          onChange(!v || v === BET_FILTER_ALL ? "" : String(v))
        }
        itemToStringLabel={itemToStringLabel}
      >
        <SelectTrigger
          size="sm"
          className={cn(FORM_FILTER_CONTROL, "px-3 font-normal")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={BET_FILTER_ALL}>{allLabel}</SelectItem>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
