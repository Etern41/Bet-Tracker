import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { oddsApiAvailable } from "@/lib/odds-api";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  return (
    <SettingsClient
      email={user?.email ?? session.user.email ?? ""}
      initialName={user?.name ?? ""}
      oddsConfigured={oddsApiAvailable()}
    />
  );
}
