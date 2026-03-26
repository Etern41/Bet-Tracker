"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, ListOrdered, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "📊 Дашборд", icon: LayoutDashboard },
  { href: "/bets", label: "📋 Мои ставки", icon: ListOrdered },
  { href: "/settings", label: "⚙️ Настройки", icon: Settings },
];

type Props = {
  /** Только мобильная шторка; на md+ игнорируется */
  mobileOpen?: boolean;
  /** Закрыть шторку после перехода (мобилка) */
  onNavigate?: () => void;
};

export function Sidebar({ mobileOpen = false, onNavigate }: Props) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className={cn(
        "flex h-dvh max-h-[100dvh] w-[min(288px,88vw)] shrink-0 flex-col border-r border-border bg-card",
        "fixed left-0 top-0 z-50 md:relative md:z-0 md:h-auto md:max-h-none md:w-[220px]",
        "transition-transform duration-200 ease-out md:translate-x-0 md:shadow-none",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border px-4">
        <span className="truncate text-lg font-bold text-foreground">🎯 BetTracker</span>
        <Badge variant="secondary" className="shrink-0 text-[10px]">
          β
        </Badge>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "border-l-2 border-primary bg-primary/10 pl-[10px] text-primary"
                  : "border-l-2 border-transparent pl-[10px] text-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-border p-3">
        <p
          className="truncate px-1 text-xs text-muted-foreground"
          title={session?.user?.email ?? undefined}
        >
          {session?.user?.email}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4 shrink-0" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}
