import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { LIMITS, validateEmail, validatePassword } from "@/lib/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  try {
    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body)
    ) {
      return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
    }
    const emailRaw = (body as { email: unknown }).email;
    const passwordRaw = (body as { password: unknown }).password;
    const email =
      typeof emailRaw === "string"
        ? emailRaw.trim().toLowerCase().slice(0, LIMITS.emailMax)
        : "";
    const password = typeof passwordRaw === "string" ? passwordRaw : "";

    const eEmail = validateEmail(email);
    if (eEmail) return NextResponse.json({ error: eEmail }, { status: 400 });
    const ePass = validatePassword(password);
    if (ePass) return NextResponse.json({ error: ePass }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Пользователь с таким email уже есть" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Не удалось зарегистрироваться" }, { status: 500 });
  }
}
