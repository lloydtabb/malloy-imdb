import React, { useMemo } from "react";
import { Controls, VegaChart, useQuery, useUrlState } from "@malloyyo/dashboard";

// Column names produced by the genre_pairs query in genre_pairs.malloy.
const PAIR = "Genre Combination";
const TOP_TITLES = "Top Titles Overall";
const BY_YEAR = "By Year as a Percent of Year's Titles (hover for detail)";
const PCT = "Percent of titles in Year";

const fmtVotes = (k) =>
  k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${Math.round(k).toLocaleString()}K`;

const trendSpec = {
  width: "container",
  height: 220,
  mark: { type: "area", line: true, interpolate: "monotone", opacity: 0.25, tooltip: true },
  encoding: {
    x: { field: "year", type: "quantitative", title: null, axis: { format: "d", grid: false } },
    y: { field: "pct", type: "quantitative", title: "Share of the year's titles", axis: { format: "%" } },
    tooltip: [
      { field: "year", title: "Year", format: "d" },
      { field: "pct", title: "Share", format: ".1%" },
      { field: "titles", title: "Top titles" },
    ],
  },
  config: { view: { stroke: null } },
};

const s = {
  page: { maxWidth: 1180, margin: "0 auto", padding: "24px 16px", color: "var(--dash-fg)" },
  title: { margin: "0 0 4px", fontSize: 26, fontWeight: 650 },
  sub: { margin: "0 0 16px", color: "var(--dash-muted)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 16, marginTop: 16 },
  card: {
    background: "var(--dash-panel-bg)",
    border: "1px solid var(--dash-border)",
    borderRadius: "var(--dash-radius)",
    padding: 16,
    minWidth: 0,
  },
  h2: { margin: "0 0 12px", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--dash-muted)" },
  list: { listStyle: "none", margin: 0, padding: 0, maxHeight: 640, overflowY: "auto" },
  item: (active) => ({
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    marginBottom: 4,
    border: "1px solid " + (active ? "var(--dash-accent)" : "transparent"),
    borderRadius: "var(--dash-radius)",
    background: active ? "var(--dash-chip-bg)" : "transparent",
    color: "inherit",
    font: "inherit",
    cursor: "pointer",
  }),
  itemRow: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 14 },
  bar: (share) => ({ height: 4, marginTop: 6, borderRadius: 2, width: `${Math.max(share * 100, 2)}%`, background: "var(--dash-accent)" }),
  bigPair: { margin: "0 0 4px", fontSize: 22, fontWeight: 650 },
  stat: { color: "var(--dash-muted)", margin: "0 0 16px" },
  titles: { margin: 0, paddingLeft: 22, columns: 2, columnGap: 24, fontSize: 14, lineHeight: 1.8 },
  muted: { color: "var(--dash-muted)" },
};

export default function Dashboard({ dashboard, givens }) {
  const { rows, loading, error } = useQuery({ query: "genre_pairs", givens });
  const [picked, setPicked] = useUrlState("pair", "");

  const pairs = rows || [];
  const max = pairs.reduce((m, r) => Math.max(m, r.total_votes || 0), 0) || 1;
  const selected = pairs.find((r) => r[PAIR] === picked) || pairs[0];

  const trend = useMemo(
    () =>
      (selected?.[BY_YEAR] || []).map((y) => ({
        year: y.release_year,
        pct: y[PCT],
        titles: (y.titles || []).slice(0, 3).map((t) => t.title).join(", "),
      })),
    [selected]
  );

  return (
    <div style={s.page}>
      <h1 style={s.title}>{dashboard.title}</h1>
      <p style={s.sub}>Which genres show up together on IMDB's most popular movies, and how that pairing has trended.</p>
      <Controls />

      {error && <p style={{ color: "var(--dash-danger)" }}>{String(error.message || error)}</p>}
      {loading && !rows && <p style={s.muted}>Loading…</p>}
      {rows && pairs.length === 0 && <p style={s.muted}>No genre combinations match these filters.</p>}

      {selected && (
        <div style={s.grid}>
          <section style={s.card}>
            <h2 style={s.h2}>Combinations by total votes</h2>
            <ul style={s.list}>
              {pairs.map((r) => (
                <li key={r[PAIR]}>
                  <button style={s.item(r === selected)} onClick={() => setPicked(r[PAIR])}>
                    <div style={s.itemRow}>
                      <span>{r[PAIR].replace("/", " + ")}</span>
                      <span style={s.muted}>{fmtVotes(r.total_votes)}</span>
                    </div>
                    <div style={s.bar(r.total_votes / max)} />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section style={{ display: "grid", gap: 16, alignContent: "start", minWidth: 0 }}>
            <div style={s.card}>
              <h3 style={s.bigPair}>{selected[PAIR].replace("/", " + ")}</h3>
              <p style={s.stat}>{fmtVotes(selected.total_votes)} total votes</p>
              <h2 style={s.h2}>Share of each year's titles</h2>
              <VegaChart spec={trendSpec} data={trend} />
            </div>
            <div style={s.card}>
              <h2 style={s.h2}>Top titles</h2>
              <ol style={s.titles}>
                {(selected[TOP_TITLES] || []).map((t) => (
                  <li key={t.title + t.release_year}>
                    {t.title} <span style={s.muted}>({t.release_year})</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
