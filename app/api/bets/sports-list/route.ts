import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }

  try {
    const rows = await prisma.bet.groupBy({
      by: ["sport"],
      where: { userId: session.user.id },
    });
    const sports = rows.map((r) => r.sport).sort((a, b) => a.localeCompare(b, "ru"));
    return Response.json({ sports });
  } catch {
    return Response.json({ error: "Ошибка" }, { status: 500 });
  }
}
