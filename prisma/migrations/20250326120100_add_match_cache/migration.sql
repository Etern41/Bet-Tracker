-- CreateTable
CREATE TABLE "MatchCache" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "sportKey" TEXT NOT NULL,
    "sportTitle" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "commenceTime" TIMESTAMP(3) NOT NULL,
    "oddsData" JSONB,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchCache_externalId_key" ON "MatchCache"("externalId");
