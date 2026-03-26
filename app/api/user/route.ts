import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LIMITS, trimMax, validateDisplayNameInput } from "@/lib/validation";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  try {
    if (typeof body !== "object" || body === null || !("name" in body)) {
      return Response.json({ error: "Неверные данные" }, { status: 400 });
    }
    const nameRaw = (body as { name: unknown }).name;
    if (nameRaw !== null && typeof nameRaw !== "string") {
      return Response.json({ error: "Некорректное имя" }, { status: 400 });
    }
    const nameErr = validateDisplayNameInput(
      nameRaw === null ? null : (nameRaw as string)
    );
    if (nameErr) return Response.json({ error: nameErr }, { status: 400 });
    const name =
      nameRaw === null ? null : trimMax(nameRaw as string, LIMITS.displayName);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name || null },
      select: { id: true, email: true, name: true },
    });

    return Response.json({ user });
  } catch {
    return Response.json({ error: "Не удалось сохранить профиль" }, { status: 500 });
  }
}
