"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  onAddBet?: () => void;
};

export function Header({ title, onAddBet }: HeaderProps) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <h1 className="page-title">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          type="button"
          className="rounded-md px-4 py-2 text-sm font-medium transition-opacity duration-150 hover:opacity-90"
          onClick={onAddBet}
        >
          + Добавить ставку
        </Button>
      </div>
    </header>
  );
}
