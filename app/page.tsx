"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  getSortedManagerResults,
  sampleActualTable,
  type ManagerName,
  type ManagerResult,
  type TeamStanding,
} from "@/app/league-data";

type LiveTableResponse = {
  source: string;
  updatedAt: string;
  pollingSeconds: number;
  message: string;
  table: TeamStanding[];
};

const initialMeta = {
  source: "sample",
  updatedAt: "",
  pollingSeconds: 8,
  message: "Loading standings.",
};

const pl = {
  purple: "#37003c",
  green: "#00ff85",
  pink: "#ff2882",
  cyan: "#05f0ff",
  yellow: "#ebff00",
};

const pastResults = [
  { position: 1, player: "Havi", score: 56, perfects: 4, color: "#ffad94" },
  { position: 2, player: "Blue", score: 63, perfects: 3, color: "#8fc2f2" },
  { position: 3, player: "Nic", score: 64, perfects: 2, color: "#ffe89b" },
  { position: 4, player: "Tom", score: 83, perfects: 1, color: "#d9a2e8" },
  { position: 5, player: "Austin", score: 92, perfects: 0, color: "#b6f79f" },
];

function scoreClass(score: number) {
  if (score === -5) return "text-[#008f4c]";
  return "text-[#37003c]";
}

const currentlyPlayingTeams = new Set<string>();

function isCurrentlyPlaying(row: TeamStanding) {
  return Boolean(row.isPlaying || currentlyPlayingTeams.has(row.team));
}

function ManagerRow({
  manager,
  rank,
  isSelected,
  leaderScore,
  onSelect,
}: {
  manager: ManagerResult;
  rank: number;
  isSelected: boolean;
  leaderScore: number;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="grid w-full grid-cols-[44px_minmax(0,1fr)_64px_58px] items-center gap-2 px-3 py-3 text-left font-black text-[#37003c] transition hover:-translate-y-0.5 md:grid-cols-[56px_minmax(0,1fr)_86px_86px_86px]"
      style={
        {
          background: isSelected ? pl.green : "#ffffff",
          boxShadow: isSelected ? `6px 6px 0 ${pl.pink}` : "none",
          borderBottom: `2px solid ${pl.purple}22`,
        } as CSSProperties
      }
      aria-pressed={isSelected}
    >
      <span className="text-xl tabular-nums md:text-2xl">{rank}</span>
      <span className="min-w-0 break-words text-base leading-none md:text-xl">
        {manager.name}
      </span>
      <span className="text-right text-xl tabular-nums md:text-2xl">
        {manager.score}
      </span>
      <span className="text-right text-sm uppercase tabular-nums md:text-base">
        {manager.perfects}
      </span>
      <span className="hidden text-right text-sm uppercase tabular-nums md:block">
        {rank === 1 ? "Lead" : `+${manager.score - leaderScore}`}
      </span>
    </button>
  );
}

export default function Home() {
  const [liveTable, setLiveTable] = useState<TeamStanding[]>(sampleActualTable);
  const [liveMeta, setLiveMeta] = useState(initialMeta);
  const results = useMemo(() => getSortedManagerResults(liveTable), [liveTable]);
  const [selectedName, setSelectedName] = useState<ManagerName>(results[0].name);
  const selected =
    results.find((manager) => manager.name === selectedName) ?? results[0];
  const leader = results[0];
  const selectedRank =
    results.findIndex((manager) => manager.name === selected.name) + 1;

  useEffect(() => {
    let active = true;

    async function loadLiveTable() {
      try {
        const response = await fetch("/api/live-table", { cache: "no-store" });
        const payload = (await response.json()) as LiveTableResponse;

        if (!active) return;

        if (Array.isArray(payload.table) && payload.table.length === 20) {
          setLiveTable(payload.table);
        }

        setLiveMeta({
          source: payload.source,
          updatedAt: payload.updatedAt,
          pollingSeconds: payload.pollingSeconds,
          message: payload.message,
        });
      } catch {
        if (active) {
          setLiveMeta({
            ...initialMeta,
            updatedAt: new Date().toISOString(),
            message: "Standings unavailable.",
          });
        }
      }
    }

    loadLiveTable();
    const interval = window.setInterval(
      loadLiveTable,
      liveMeta.pollingSeconds * 1000,
    );

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [liveMeta.pollingSeconds]);

  return (
    <main className="min-h-screen bg-[#37003c] text-white">
      <section className="bg-[radial-gradient(circle_at_14%_12%,#ff2882_0_11%,transparent_28%),radial-gradient(circle_at_86%_0%,#05f0ff_0_13%,transparent_31%),linear-gradient(135deg,#37003c_0%,#37003c_58%,#00ff85_58%,#00ff85_70%,#ebff00_70%,#ebff00_100%)]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[1fr_290px] md:py-8 lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/premier-league-logo-symbol.png"
              alt="Premier League"
              className="h-20 w-20 bg-white object-contain p-2 shadow-[7px_7px_0_#00ff85] sm:h-24 sm:w-24"
            />
            <h1 className="max-w-4xl text-4xl font-black leading-[0.9] tracking-normal sm:text-6xl lg:text-7xl">
              Premier League Predictions 26/27
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2 self-end text-[#37003c] md:grid-cols-1">
            <div className="bg-[#00ff85] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                Leader
              </p>
              <p className="mt-1 truncate text-xl font-black">{leader.name}</p>
            </div>
            <div className="bg-[#ff2882] px-3 py-3 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                Score
              </p>
              <p className="mt-1 text-xl font-black tabular-nums">
                {leader.score}
              </p>
            </div>
            <div className="bg-[#05f0ff] px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                Perfects
              </p>
              <p className="mt-1 text-xl font-black tabular-nums">
                {leader.perfects}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#00ff85] px-4 py-5 text-[#37003c] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl bg-white shadow-[9px_9px_0_#ff2882]">
          <div className="grid grid-cols-[44px_minmax(0,1fr)_64px_58px] bg-[#37003c] px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-white md:grid-cols-[56px_minmax(0,1fr)_86px_86px_86px]">
            <span>Pos</span>
            <span>Manager</span>
            <span className="text-right">Score</span>
            <span className="text-right">Perf</span>
            <span className="hidden text-right md:block">Gap</span>
          </div>
          <div>
            {results.map((manager, index) => (
              <ManagerRow
                key={manager.name}
                manager={manager}
                rank={index + 1}
                isSelected={manager.name === selected.name}
                leaderScore={leader.score}
                onSelect={() => setSelectedName(manager.name)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#ff2882] px-4 py-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden bg-white text-[#37003c] shadow-[9px_9px_0_#05f0ff]">
          <div className="flex flex-wrap items-end justify-between gap-3 bg-[#37003c] px-4 py-4 text-white">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#00ff85]">
                {selectedRank}/{results.length}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-4xl font-black leading-none sm:text-5xl">
                  {selected.name}
                </h2>
                {!selected.paid ? (
                  <a
                    href="https://venmo.com/u/Nicholas-Hamilton45"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Tap to buy in on Venmo for 27 dollars"
                    className="inline-flex min-h-8 items-center gap-1.5 border-2 border-white bg-[#008cff] py-1 pl-1 pr-1.5 text-[11px] font-black uppercase leading-none text-white no-underline shadow-[4px_4px_0_#00ff85] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_#00ff85] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#ebff00]"
                  >
                    <img
                      src="/venmo-logo.png"
                      alt="Venmo"
                      className="h-[22px] w-[22px] object-cover"
                    />
                    <span className="whitespace-nowrap">Tap to buy-in!</span>
                    <span className="inline-flex min-h-[22px] items-center bg-white px-1.5 text-[15px] italic tracking-tight text-[#008cff]">
                      $27
                    </span>
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2 text-[#37003c]">
              <span className="bg-[#00ff85] px-3 py-2 text-center font-black">
                <span className="block text-[9px] uppercase tracking-[0.12em]">
                  Score
                </span>
                <span className="mt-1 block text-xl leading-none tabular-nums">
                  {selected.score}
                </span>
              </span>
              <span className="bg-[#05f0ff] px-3 py-2 text-center font-black">
                <span className="block text-[9px] uppercase tracking-[0.12em]">
                  Perfects
                </span>
                <span className="mt-1 block text-xl leading-none tabular-nums">
                  {selected.perfects}
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[44px_minmax(0,1fr)_42px_42px] items-center gap-2 bg-[#ebff00] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] md:hidden">
            <span>Predicted</span>
            <span>Team</span>
            <span className="text-right">Actual</span>
            <span className="text-right">Score</span>
          </div>
          <div className="grid gap-2 p-3 md:hidden">
            {selected.rows.map((row, index) => (
              <div
                key={row.team}
                className="grid grid-cols-[44px_minmax(0,1fr)_42px_42px] items-center gap-2 p-3 font-black"
                style={{ background: index % 2 === 0 ? `${selected.color}73` : `${selected.color}3d` }}
              >
                <span className="text-lg tabular-nums">{row.predicted}</span>
                <span className="min-w-0 break-words text-sm leading-tight">
                  {row.team}
                </span>
                <span className="text-right tabular-nums">{row.actual}</span>
                <span className={`text-right tabular-nums ${scoreClass(row.score)}`}>
                  {row.score}
                </span>
              </div>
            ))}
          </div>

          <table className="hidden w-full border-collapse text-sm md:table">
            <thead>
              <tr className="bg-[#ebff00] text-[#37003c]">
                <th className="px-3 py-3 text-right font-black">Predicted</th>
                <th className="px-3 py-3 text-left font-black">Team</th>
                <th className="px-3 py-3 text-right font-black">Actual Position</th>
                <th className="px-3 py-3 text-right font-black">Score</th>
              </tr>
            </thead>
            <tbody>
              {selected.rows.map((row, index) => (
                <tr
                  key={row.team}
                  style={{ background: index % 2 === 0 ? `${selected.color}73` : `${selected.color}3d` }}
                >
                  <td className="px-3 py-3 text-right text-lg font-black tabular-nums">
                    {row.predicted}
                  </td>
                  <td className="px-3 py-3 font-black">{row.team}</td>
                  <td className="px-3 py-3 text-right text-lg font-black tabular-nums">
                    {row.actual}
                  </td>
                  <td className={`px-3 py-3 text-right text-lg font-black tabular-nums ${scoreClass(row.score)}`}>
                    {row.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[#05f0ff] px-4 py-6 text-[#37003c] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden bg-white shadow-[9px_9px_0_#ebff00]">
          <div className="bg-[#37003c] px-4 py-4 text-white">
            <h2 className="text-4xl font-black leading-none">LIVE STANDINGS</h2>
          </div>

          <div className="grid grid-cols-[34px_minmax(0,1fr)_30px_30px_30px_38px_34px] items-center gap-2 bg-[#ff2882] px-3 py-2 text-[9px] font-black uppercase tracking-[0.08em] text-white md:hidden">
            <span>Pos</span>
            <span>Team</span>
            <span className="text-right">W</span>
            <span className="text-right">D</span>
            <span className="text-right">L</span>
            <span className="text-right">Pts</span>
            <span className="text-right">GD</span>
          </div>
          <div className="grid gap-2 p-3 md:hidden">
            {liveTable.map((row) => (
              <div key={row.team}>
                {row.position === 18 ? (
                  <div
                    className="my-2 border-t-[5px] border-[#e90052]"
                    aria-label="Relegation line"
                  />
                ) : null}
                <div
                  className={`p-3 ${
                    isCurrentlyPlaying(row)
                      ? "bg-[#ebff00] shadow-[inset_6px_0_0_#ff2882]"
                      : "bg-[#05f0ff]/20"
                  }`}
                >
                  <div className="grid grid-cols-[34px_minmax(0,1fr)_30px_30px_30px_38px_34px] items-center gap-2 text-xs font-black">
                    <span className="text-lg tabular-nums">{row.position}</span>
                    <span className="min-w-0 break-words text-base leading-none">
                      {row.team}
                    </span>
                    <span className="text-right tabular-nums">{row.won}</span>
                    <span className="text-right tabular-nums">{row.drawn}</span>
                    <span className="text-right tabular-nums">{row.lost}</span>
                    <span className="text-right text-lg tabular-nums">{row.points}</span>
                    <span className="text-right tabular-nums">{row.goalDifference}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <table className="hidden w-full border-collapse text-sm md:table">
            <thead>
              <tr className="bg-[#ff2882] text-white">
                {["Position", "Team", "W", "D", "L", "Points", "GD"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className={`px-3 py-3 font-black ${
                        heading === "Team" ? "text-left" : "text-right"
                      }`}
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {liveTable.map((row) => (
                <Fragment key={row.team}>
                  {row.position === 18 ? (
                    <tr aria-label="Relegation line">
                      <td
                        className="border-t-[5px] border-[#e90052] p-0"
                        colSpan={7}
                      />
                    </tr>
                  ) : null}
                  <tr
                    className={
                      isCurrentlyPlaying(row)
                        ? "bg-[#ebff00]"
                        : "odd:bg-white even:bg-[#05f0ff]/20"
                    }
                  >
                    <td className="px-3 py-3 text-right text-lg font-black tabular-nums">
                      {row.position}
                    </td>
                    <td className="px-3 py-3 text-xl font-black leading-tight">
                      {row.team}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.won}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.drawn}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.lost}</td>
                    <td className="px-3 py-3 text-right text-lg font-black tabular-nums">
                      {row.points}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.goalDifference}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[#00ff85] bg-[linear-gradient(90deg,rgb(55_0_60_/_0.12)_1px,transparent_1px)] bg-[length:32px_32px] px-4 py-6 text-[#37003c] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-3 bg-[#37003c] px-4 py-3 text-3xl font-black leading-none text-white sm:text-4xl">
            25/26 Results
          </h2>
          <div className="overflow-hidden bg-white shadow-[9px_9px_0_#ff2882]">
            <table className="w-full table-fixed border-collapse text-[#37003c]">
              <thead>
                <tr>
                  {["Position", "Player", "Score", "Perfects"].map((heading) => (
                    <th
                      key={heading}
                      className={`bg-[#37003c] px-2.5 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white sm:px-3 ${
                        heading === "Player" ? "text-left" : "text-right"
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastResults.map((row, index) => (
                  <tr key={row.player} className={index % 2 === 0 ? "bg-white" : "bg-[#05f0ff]/15"}>
                    <td className="w-[22%] border-b-2 border-[#37003c]/10 px-2.5 py-3 text-right text-lg font-black leading-none tabular-nums sm:px-3">
                      {row.position}
                    </td>
                    <td className="w-[32%] border-b-2 border-[#37003c]/10 px-2.5 py-3 text-left text-lg font-black leading-none sm:px-3">
                      {row.player}
                    </td>
                    <td className="w-[23%] border-b-2 border-[#37003c]/10 px-2.5 py-3 text-right text-lg font-black leading-none tabular-nums sm:px-3">
                      {row.score}
                    </td>
                    <td className="w-[23%] border-b-2 border-[#37003c]/10 px-2.5 py-3 text-right text-lg font-black leading-none tabular-nums sm:px-3">
                      {row.perfects}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-[#37003c] px-4 py-6 text-[#37003c] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden bg-white shadow-[9px_9px_0_#00ff85]">
          <div className="bg-[#37003c] px-4 py-4 text-white">
            <h2 className="text-4xl font-black leading-none">RULES</h2>
          </div>
          <div className="grid gap-3 p-3 text-sm font-black uppercase md:grid-cols-3">
            <div className="bg-[#00ff85] p-4">LOWEST SCORE WINS</div>
            <div className="bg-[#05f0ff] p-4">
              SCORE = Difference between predicted position and actual position
            </div>
            <div className="bg-[#ebff00] p-4">PERFECT PREDICTION = -5pts</div>
          </div>
        </div>
      </section>
    </main>
  );
}
