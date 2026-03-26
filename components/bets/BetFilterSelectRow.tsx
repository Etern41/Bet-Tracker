"use client";

import { useCallback, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BET_FILTER_ALL,
  betFilterSelectItems,
  labelFromSelectItems,
  type BetFilterSelectItem,
} from "@/lib/constants";
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

  const itemsMap = useMemo(
    () => betFilterSelectItems(BET_FILTER_ALL, allLabel, items),
    [allLabel, items]
  );

  const formatLabel = useCallback(
    (v: unknown) => labelFromSelectItems(itemsMap, v),
    [itemsMap]
  );

  return (
    <div className="min-w-0 w-full sm:w-auto sm:min-w-[160px]">
      <label className="section-label mb-1 block">{fieldLabel}</label>
      <Select
        value={selectValue}
        items={itemsMap}
        onValueChange={(v) =>
          onChange(!v || v === BET_FILTER_ALL ? "" : String(v))
        }
        itemToStringLabel={formatLabel}
      >
        <SelectTrigger
          size="sm"
          className={cn(FORM_FILTER_CONTROL, "px-3 font-normal")}
        >
          <SelectValue>{formatLabel}</SelectValue>
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
