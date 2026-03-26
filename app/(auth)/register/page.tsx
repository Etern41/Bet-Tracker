"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LIMITS,
  sanitizeEmailInput,
  sanitizePasswordInput,
  validateEmail,
  validatePassword,
} from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const eEmail = validateEmail(email);
    if (eEmail) {
      setError(eEmail);
      return;
    }
    const ePass = validatePassword(password);
    if (ePass) {
      setError(ePass);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Не удалось зарегистрироваться";
        setError(msg);
        setLoading(false);
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError("Аккаунт создан, но вход не удался. Попробуйте войти вручную.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Ошибка сети");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full min-w-0 max-w-md border-border card-shadow">
        <CardHeader>
          <CardTitle className="page-title">Регистрация</CardTitle>
          <CardDescription className="text-muted-foreground">
            Создайте аккаунт BetTracker
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
                autoComplete="new-password"
                value={password}
                maxLength={LIMITS.passwordMax}
                onChange={(e) =>
                  setPassword(sanitizePasswordInput(e.target.value))
                }
                required
                minLength={LIMITS.passwordMin}
                className="h-10 px-3"
              />
              <p className="text-xs text-muted-foreground">Минимум 8 символов</p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-3 border-t border-border pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Создание…" : "Зарегистрироваться"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                  Войти
                </Link>
              </p>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
