"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BetForm } from "@/components/bets/BetForm";
import type { BetRow } from "@/components/bets/types";
import { notifyBetsMutated } from "@/lib/bets-mutation";

type BetUi = {
  openCreate: () => void;
  openEdit: (bet: BetRow) => void;
};

const BetUiContext = createContext<BetUi | null>(null);

export function useBetUi(): BetUi {
  const v = useContext(BetUiContext);
  if (!v) throw new Error("useBetUi must be used within AppShell");
  return v;
}

function titleForPath(path: string): string {
  if (path.startsWith("/dashboard")) return "Дашборд";
  if (path.startsWith("/bets")) return "Мои ставки";
  if (path.startsWith("/settings")) return "Настройки";
  return "BetTracker";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = useMemo(() => titleForPath(pathname), [pathname]);
  const [betDialogOpen, setBetDialogOpen] = useState(false);
  const [editBet, setEditBet] = useState<BetRow | null>(null);

  const openCreate = useCallback(() => {
    setEditBet(null);
    setBetDialogOpen(true);
  }, []);

  const openEdit = useCallback((bet: BetRow) => {
    setEditBet(bet);
    setBetDialogOpen(true);
  }, []);

  const betUi = useMemo(() => ({ openCreate, openEdit }), [openCreate, openEdit]);

  return (
    <BetUiContext.Provider value={betUi}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={title} onAddBet={openCreate} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
      <BetForm
        open={betDialogOpen}
        onOpenChange={(o) => {
          setBetDialogOpen(o);
          if (!o) setEditBet(null);
        }}
        bet={editBet}
        onSaved={() => {
          notifyBetsMutated();
          setBetDialogOpen(false);
          setEditBet(null);
        }}
      />
    </BetUiContext.Provider>
  );
}
