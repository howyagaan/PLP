export type TeamStanding = {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type ManagerName = string;

export type ManagerSheet = {
  name: ManagerName;
  color: string;
  picks: string[];
};

export type ManagerResult = ManagerSheet & {
  score: number;
  perfects: number;
  rows: Array<{
    predicted: number;
    team: string;
    actual: number;
    score: number;
  }>;
};

export const sampleActualTable: TeamStanding[] = [
  "Arsenal",
  "Manchester City",
  "Manchester United",
  "Aston Villa",
  "Liverpool",
  "AFC Bournemouth",
  "Sunderland",
  "Brighton & Hove Albion",
  "Brentford",
  "Chelsea",
  "Fulham",
  "Newcastle United",
  "Everton",
  "Leeds United",
  "Crystal Palace",
  "Nottingham Forest",
  "Tottenham Hotspur",
  "West Ham United",
  "Burnley",
  "Wolverhampton Wanderers",
].map((team, index) => ({
  position: index + 1,
  team,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
}));

const managerColors = [
  "#00ff85",
  "#05f0ff",
  "#ff2882",
  "#ebff00",
  "#b6f79f",
  "#bdd2f0",
  "#d9a2e8",
  "#ffad94",
];

const upcomingSeasonTemplate = sampleActualTable.map((standing) => standing.team);

function rotatePicks(offset: number) {
  return upcomingSeasonTemplate.map(
    (_, index) => upcomingSeasonTemplate[(index + offset) % upcomingSeasonTemplate.length],
  );
}

export const managerSheets: ManagerSheet[] = Array.from({ length: 40 }, (_, index) => ({
  name: `Manager #${index + 1}`,
  color: managerColors[index % managerColors.length],
  picks: rotatePicks((index * 3) % upcomingSeasonTemplate.length),
}));

const aliases = new Map([
  ["afc bournemouth", "AFC Bournemouth"],
  ["bournemouth", "AFC Bournemouth"],
  ["brighton and hove albion", "Brighton & Hove Albion"],
  ["brighton hove albion", "Brighton & Hove Albion"],
  ["brighton", "Brighton & Hove Albion"],
  ["manchester united", "Manchester United"],
  ["man utd", "Manchester United"],
  ["man united", "Manchester United"],
  ["manchester city", "Manchester City"],
  ["man city", "Manchester City"],
  ["nottingham forest", "Nottingham Forest"],
  ["nottm forest", "Nottingham Forest"],
  ["newcastle united", "Newcastle United"],
  ["newcastle", "Newcastle United"],
  ["tottenham hotspur", "Tottenham Hotspur"],
  ["tottenham", "Tottenham Hotspur"],
  ["spurs", "Tottenham Hotspur"],
  ["west ham united", "West Ham United"],
  ["west ham", "West Ham United"],
  ["wolverhampton wanderers", "Wolverhampton Wanderers"],
  ["wolves", "Wolverhampton Wanderers"],
]);

function teamKey(team: string) {
  return team
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalTeamName(team: string) {
  return aliases.get(teamKey(team)) ?? team;
}

function actualPositionFor(table: TeamStanding[], team: string) {
  const target = teamKey(canonicalTeamName(team));
  const row = table.find((standing) => teamKey(standing.team) === target);
  return row?.position;
}

export function scorePick(predicted: number, actual: number) {
  return predicted === actual ? -5 : Math.abs(predicted - actual);
}

export function getManagerResult(
  manager: ManagerSheet,
  table: TeamStanding[],
): ManagerResult {
  const rows = manager.picks.map((team, index) => {
    const predicted = index + 1;
    const actual = actualPositionFor(table, team) ?? predicted;

    return {
      predicted,
      team,
      actual,
      score: scorePick(predicted, actual),
    };
  });

  return {
    ...manager,
    rows,
    score: rows.reduce((total, row) => total + row.score, 0),
    perfects: rows.filter((row) => row.score === -5).length,
  };
}

export function getSortedManagerResults(table: TeamStanding[]) {
  return managerSheets
    .map((manager) => getManagerResult(manager, table))
    .sort((a, b) => a.score - b.score || b.perfects - a.perfects);
}
