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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-[52px] items-center gap-2 border-b border-border px-4">
        <span className="text-lg font-bold text-foreground">🎯 BetTracker</span>
        <Badge variant="secondary" className="text-[10px]">
          β
        </Badge>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "border-l-2 border-primary bg-primary/10 pl-[10px] text-primary"
                  : "border-l-2 border-transparent pl-[10px] text-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3 space-y-2">
        <p className="truncate text-xs text-muted-foreground px-1" title={session?.user?.email}>
          {session?.user?.email}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </div>
    </aside>
  );
}
