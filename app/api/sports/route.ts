import { auth } from "@/lib/auth";
import { fetchSports } from "@/lib/odds-api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }
  try {
    const sports = await fetchSports();
    return Response.json({ sports });
  } catch {
    return Response.json({ sports: [] });
  }
}
