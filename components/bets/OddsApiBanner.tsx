"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "bettracker_odds_banner_dismiss";

export function OddsApiBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(
      typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1"
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/odds-status");
        const data: unknown = await res.json();
        const ok =
          typeof data === "object" &&
          data !== null &&
          "oddsConfigured" in data &&
          (data as { oddsConfigured: boolean }).oddsConfigured === true;
        if (!cancelled) setConfigured(ok);
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (configured !== false || dismissed) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-foreground"
    >
      <p className="flex-1">
        Ключ API не настроен. Добавьте ODDS_API_KEY в .env для подгрузки матчей.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Закрыть"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
