import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number): string {
  return (
    amount.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " ₽"
  );
}

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatProfit(profit: number): string {
  const sign = profit > 0 ? "+" : "";
  return `${sign}${formatMoney(profit)}`;
}
