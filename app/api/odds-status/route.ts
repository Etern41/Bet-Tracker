import { auth } from "@/lib/auth";
import { oddsApiAvailable } from "@/lib/odds-api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Нет доступа" }, { status: 401 });
  }
  return Response.json({ oddsConfigured: oddsApiAvailable() });
}
