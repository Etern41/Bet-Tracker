"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LIMITS,
  sanitizeDisplayNameField,
  validateDisplayNameInput,
} from "@/lib/validation";

type Props = {
  email: string;
  initialName: string;
  oddsConfigured: boolean;
};

export function SettingsClient({ email, initialName, oddsConfigured }: Props) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    const v = validateDisplayNameInput(trimmed === "" ? null : name);
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed || null }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Не удалось сохранить";
        setError(msg);
        setLoading(false);
        return;
      }
      toast.success("Имя обновлено");
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-8">
      <Card className="border-border bg-card card-shadow">
        <CardHeader>
          <CardTitle className="page-title">Профиль</CardTitle>
          <CardDescription className="text-muted-foreground">
            Email и отображаемое имя
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="mt-1 text-sm text-foreground">{email}</p>
          </div>
          <form onSubmit={saveName} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="name">Сменить имя</Label>
              <Input
                id="name"
                className="h-9 min-w-0 max-w-full sm:max-w-md"
                value={name}
                maxLength={LIMITS.displayName}
                onChange={(e) =>
                  setName(sanitizeDisplayNameField(e.target.value))
                }
                placeholder="Ваше имя"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Сохранить имя
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card card-shadow">
        <CardHeader>
          <CardTitle className="page-title">Ключ The Odds API</CardTitle>
          <CardDescription className="text-muted-foreground">
            Для автоматической подгрузки матчей добавьте ODDS_API_KEY в файл .env
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-foreground">
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Зарегистрируйтесь на{" "}
              <a
                href="https://the-odds-api.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                the-odds-api.com
              </a>
            </li>
            <li>Скопируйте API ключ</li>
            <li>
              Добавьте в .env:{" "}
              <code className="rounded border border-border bg-muted/50 px-1 py-0.5 text-xs">
                ODDS_API_KEY=&quot;ваш_ключ&quot;
              </code>
            </li>
            <li>Перезапустите сервер</li>
          </ol>
          <div
            className={
              oddsConfigured
                ? "rounded-md border border-won/30 bg-won/10 px-3 py-2 text-won"
                : "rounded-md border border-pending/30 bg-pending/10 px-3 py-2 text-pending"
            }
          >
            {oddsConfigured ? "✓ API ключ настроен" : "⚠ API ключ не настроен"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
