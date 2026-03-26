"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LIMITS,
  sanitizeEmailInput,
  sanitizePasswordInput,
} from "@/lib/validation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Неверный email или пароль");
        setLoading(false);
        return;
      }
      router.push(callbackUrl.startsWith("/") ? callbackUrl : "/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка входа");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full min-w-0 max-w-md border-border card-shadow">
        <CardHeader>
          <CardTitle className="page-title">Вход</CardTitle>
          <CardDescription className="text-muted-foreground">
            Войдите в BetTracker
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={LIMITS.emailMax}
                onChange={(e) => setEmail(sanitizeEmailInput(e.target.value))}
                required
                className="h-10 px-3"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                maxLength={LIMITS.passwordMax}
                onChange={(e) =>
                  setPassword(sanitizePasswordInput(e.target.value))
                }
                required
                className="h-10 px-3"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-3 border-t border-border pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Вход…" : "Войти"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-primary underline-offset-4 hover:underline">
                  Регистрация
                </Link>
              </p>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
