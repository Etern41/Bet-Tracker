"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/utils";
import type { BetRow } from "@/components/bets/types";

type Props = {
  bet: BetRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteBetDialog({ bet, open, onOpenChange, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!bet) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bets/${bet.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Не удалось удалить ставку", { duration: 5000 });
        setLoading(false);
        return;
      }
      onOpenChange(false);
      toast.success("Ставка удалена");
      onConfirm();
    } catch {
      toast.error("Ошибка сети", { duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Удалить ставку?</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {bet ? (
              <>
                {bet.matchTitle} — {formatMoney(bet.stake)}
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="bg-destructive text-white hover:opacity-90"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
