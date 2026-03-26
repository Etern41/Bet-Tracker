"use client";

import { Menu, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  title: string;
  onAddBet?: () => void;
  onOpenMenu?: () => void;
};

export function Header({ title, onAddBet, onOpenMenu }: HeaderProps) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border bg-card px-2 sm:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={onOpenMenu}
        aria-label="Открыть меню"
      >
        <Menu className="size-5" />
      </Button>
      <h1 className="page-title min-w-0 flex-1 truncate">{title}</h1>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Button
          type="button"
          className="h-9 gap-1.5 px-2.5 sm:px-4"
          onClick={onAddBet}
        >
          <Plus className="size-4 sm:hidden" aria-hidden />
          <span className="hidden sm:inline">+ Добавить ставку</span>
          <span className="sr-only sm:hidden">Добавить ставку</span>
        </Button>
      </div>
    </header>
  );
}
