import { NextResponse } from "next/server";
import {
  canonicalTeamName,
  sampleActualTable,
  type TeamStanding,
} from "@/app/league-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SportmonksStanding = {
  position?: number | string;
  points?: number | string;
  participant?: { name?: string };
  team?: { name?: string };
  name?: string;
  participant_name?: string;
  details?: unknown;
};

const API_BASE = "https://api.sportmonks.com/v3/football";
const POLLING_SECONDS = 8;

function nowIso() {
  return new Date().toISOString();
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function detailLabel(detail: Record<string, unknown>) {
  const type = detail.type;
  const typeRecord =
    type && typeof type === "object" ? (type as Record<string, unknown>) : {};

  return [
    detail.name,
    detail.code,
    detail.developer_name,
    typeRecord.name,
    typeRecord.code,
    typeRecord.developer_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function detailNumber(details: unknown, labels: string[]) {
  if (!Array.isArray(details)) {
    return 0;
  }

  for (const detail of details) {
    if (!detail || typeof detail !== "object") {
      continue;
    }

    const detailRecord = detail as Record<string, unknown>;
    const label = detailLabel(detailRecord);

    if (!labels.some((candidate) => label.includes(candidate))) {
      continue;
    }

    return numberValue(
      detailRecord.value ??
        detailRecord.total ??
        detailRecord.count ??
        (detailRecord.data as Record<string, unknown> | undefined)?.value,
    );
  }

  return 0;
}

function normalizeStanding(
  standing: SportmonksStanding,
  index: number,
): TeamStanding {
  const team =
    standing.participant?.name ??
    standing.team?.name ??
    standing.participant_name ??
    standing.name ??
    `Team ${index + 1}`;

  const played = detailNumber(standing.details, [
    "played",
    "matches played",
    "games played",
  ]);
  const won = detailNumber(standing.details, ["won", "wins"]);
  const drawn = detailNumber(standing.details, ["draw", "drawn"]);
  const lost = detailNumber(standing.details, ["lost", "loss"]);
  const goalsFor = detailNumber(standing.details, [
    "goals for",
    "goal scored",
    "scored",
  ]);
  const goalsAgainst = detailNumber(standing.details, [
    "goals against",
    "goal conceded",
    "conceded",
  ]);
  const goalDifference =
    detailNumber(standing.details, ["goal difference", "goaldifference"]) ||
    goalsFor - goalsAgainst;

  return {
    position: numberValue(standing.position, index + 1),
    team: canonicalTeamName(team),
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points: numberValue(
      standing.points,
      detailNumber(standing.details, ["points"]),
    ),
    isPlaying: false,
  };
}

function sampleResponse(message: string, source = "sample") {
  return NextResponse.json({
    source,
    updatedAt: nowIso(),
    pollingSeconds: POLLING_SECONDS,
    message,
    table: sampleActualTable,
  });
}

export async function GET() {
  const token = process.env.SPORTMONKS_API_TOKEN;
  const leagueId = process.env.SPORTMONKS_PREMIER_LEAGUE_ID ?? "8";

  if (!token) {
    return sampleResponse(
      "Add SPORTMONKS_API_TOKEN to enable the live Premier League table.",
    );
  }

  const url = new URL(`${API_BASE}/standings/live/leagues/${leagueId}`);
  url.searchParams.set("api_token", token);
  url.searchParams.set("include", "participant;details.type");

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return sampleResponse(
        `SportMonks returned ${response.status}; showing sample standings.`,
        "sportmonks-error",
      );
    }

    const payload = (await response.json()) as { data?: SportmonksStanding[] };
    const data = Array.isArray(payload.data) ? payload.data : [];
    const table = data
      .map(normalizeStanding)
      .sort((a, b) => a.position - b.position)
      .slice(0, 20);

    if (table.length < 20) {
      return sampleResponse(
        "SportMonks live standings are not active yet; showing sample standings.",
        "sportmonks-empty",
      );
    }

    return NextResponse.json({
      source: "sportmonks-live",
      updatedAt: nowIso(),
      pollingSeconds: POLLING_SECONDS,
      message: "Live standings loaded from SportMonks.",
      table,
    });
  } catch {
    return sampleResponse(
      "Live standings could not be reached; showing sample standings.",
      "sportmonks-error",
    );
  }
}
