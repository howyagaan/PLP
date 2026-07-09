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
  isPlaying?: boolean;
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
  "Aston Villa",
  "Bournemouth",
  "Brentford",
  "Brighton & Hove Albion",
  "Chelsea",
  "Coventry City",
  "Crystal Palace",
  "Everton",
  "Fulham",
  "Hull City",
  "Ipswich Town",
  "Leeds United",
  "Liverpool",
  "Manchester City",
  "Manchester United",
  "Newcastle United",
  "Nottingham Forest",
  "Sunderland",
  "Tottenham Hotspur",
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
  isPlaying: false,
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

export const managerSheets: ManagerSheet[] = [
  {
    name: "Nic",
    color: managerColors[0],
    picks: [
      "Manchester City",
      "Manchester United",
      "Arsenal",
      "Tottenham Hotspur",
      "Chelsea",
      "Liverpool",
      "Aston Villa",
      "Newcastle United",
      "Fulham",
      "Bournemouth",
      "Brighton & Hove Albion",
      "Brentford",
      "Crystal Palace",
      "Sunderland",
      "Nottingham Forest",
      "Leeds United",
      "Everton",
      "Coventry City",
      "Ipswich Town",
      "Hull City",
    ],
  },
];

const aliases = new Map([
  ["afc bournemouth", "Bournemouth"],
  ["bournemouth", "Bournemouth"],
  ["brighton and hove albion", "Brighton & Hove Albion"],
  ["brighton hove albion", "Brighton & Hove Albion"],
  ["brighton", "Brighton & Hove Albion"],
  ["coventry", "Coventry City"],
  ["coventry city", "Coventry City"],
  ["hull", "Hull City"],
  ["hull city", "Hull City"],
  ["ipswich", "Ipswich Town"],
  ["ipswich town", "Ipswich Town"],
  ["leeds", "Leeds United"],
  ["leeds united", "Leeds United"],
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
