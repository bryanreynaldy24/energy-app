import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, CartesianGrid,
} from "recharts";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  navy:       "#003878",
  navyMid:    "#005baa",
  navyLight:  "#e8f0f8",
  red:        "#c0392b",
  redLight:   "#fcecea",
  amber:      "#8b5e00",
  amberLight: "#fdf5e4",
  green:      "#1a6636",
  greenLight: "#e8f5ee",
  ink:        "#1a1a1a",
  ink2:       "#3c3c3c",
  ink3:       "#666666",
  ink4:       "#999999",
  surface:    "#f7f8fa",
  surface2:   "#f0f2f5",
  rule:       "#dde2e9",
  purple:     "#7c4dcc",
  purpleLight:"#f5f0fb",
};

const CLUSTER_COLORS = {
  A: C.navyMid,
  B: C.red,
  C: C.amber,
  D: "#6b7280",
  F: C.green,
  UNCLASSIFIED: C.ink4,
};

// ── Helpers ────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "";

function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1)+"M";
  if (n >= 1000)    return (n/1000).toFixed(1)+"K";
  return String(Math.round(n));
}

function GapBadge({ gap }) {
  let label, bg, color;
  if (gap > 5)      { label=`SM +${Math.abs(gap).toFixed(1)}pt`; bg=C.redLight;   color=C.red;   }
  else if (gap < -5){ label=`CM +${Math.abs(gap).toFixed(1)}pt`; bg=C.amberLight; color=C.amber; }
  else              { label=gap>0?`SM +${Math.abs(gap).toFixed(1)}pt`:"≈ parity"; bg=C.greenLight; color=C.green; }
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}`,
      borderRadius: 3, padding: "2px 7px", fontSize: 10, fontFamily: "monospace",
      fontWeight: 700, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function StatusPill({ status, escalation }) {
  const cfg = {
    hot:     { bg: C.redLight,   color: C.red,    label: "HOT" },
    watch:   { bg: C.amberLight, color: C.amber,  label: "WATCH" },
    monitor: { bg: C.navyLight,  color: C.navyMid,label: "MONITOR" },
  }[status] || { bg: C.navyLight, color: C.navyMid, label: "MONITOR" };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}`,
      borderRadius: 3, padding: "2px 8px", fontSize: 10, fontFamily: "monospace",
      fontWeight: 700,
    }}>{cfg.label}{escalation > 0 ? " ⚡" : ""}</span>
  );
}

// ── Sections ───────────────────────────────────────────────────────────────
function MetaBar({ meta, onRefresh, loading }) {
  return (
    <div style={{
      background: C.navy, color: "white", padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: "Georgia, serif",
    }}>
      <div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
          INDONESIA ENERGY NARRATIVE MONITOR
        </span>
        <span style={{ fontSize: 11, color: "#7db8e8", marginLeft: 12, fontStyle: "italic" }}>
          Live Dashboard
        </span>
      </div>
      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
        {[
          [fmt(meta.sm_total_posts), "SM POSTS"],
          [fmt(meta.cm_total_articles), "CM ARTICLES"],
          [meta.last_updated, "LAST UPDATED"],
        ].map(([val, label]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 9, color: "#7db8e8", fontFamily: "monospace", marginTop: 2 }}>{label}</div>
          </div>
        ))}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: loading ? "#4a6e9e" : C.navyMid,
            color: "white", border: "1px solid #7db8e8",
            borderRadius: 4, padding: "6px 14px", cursor: loading ? "not-allowed" : "pointer",
            fontSize: 11, fontFamily: "monospace",
          }}
        >{loading ? "Refreshing…" : "↻ Refresh"}</button>
      </div>
    </div>
  );
}

function NarrativeGapTable({ clusters }) {
  return (
    <div style={{ background: "white", borderRadius: 6, border: `1px solid ${C.rule}`, overflow: "hidden" }}>
      <div style={{ background: C.navyLight, padding: "6px 14px", borderBottom: `1px solid ${C.rule}` }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: C.navyMid, fontWeight: 700 }}>
          NARRATIVE GAP ANALYSIS
        </span>
      </div>
      <div style={{ padding: "10px 14px 4px", borderBottom: `1px solid ${C.rule}` }}>
        <span style={{ fontSize: 13, fontFamily: "Georgia", fontWeight: 700, color: C.navy }}>
          Cluster Distribution & SM vs CM Divergence
        </span>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: C.navy }}>
            {["CLUSTER", "WHAT THIS IS ABOUT", "SM%", "CM%", "GAP"].map(h => (
              <th key={h} style={{
                color: "white", fontSize: 9, fontFamily: "monospace",
                padding: "6px 10px", fontWeight: 700,
                textAlign: h === "CLUSTER" || h === "WHAT THIS IS ABOUT" ? "left" : "center",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clusters.map((cl, i) => (
            <tr key={cl.id} style={{ background: i % 2 === 0 ? "white" : C.surface }}>
              <td style={{ padding: "10px 10px", borderBottom: `1px solid ${C.rule}`, minWidth: 150 }}>
                <div style={{ borderLeft: `3px solid ${cl.gap > 3 ? C.red : cl.gap < -3 ? C.navyMid : C.green}`, paddingLeft: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: C.ink }}>{cl.label}</div>
                  <div style={{ fontSize: 10, color: C.ink3, marginTop: 2 }}>{cl.sub}</div>
                </div>
              </td>
              <td style={{ padding: "10px 10px", fontSize: 11, color: C.ink2, maxWidth: 280, borderBottom: `1px solid ${C.rule}` }}>
                {cl.desc}
              </td>
              <td style={{ padding: "10px 10px", textAlign: "center", borderBottom: `1px solid ${C.rule}` }}>
                <span style={{
                  fontFamily: "Georgia", fontSize: 16, fontWeight: 700,
                  color: cl.gap > 0 ? C.red : C.navyMid,
                }}>{cl.sm_pct}%</span>
              </td>
              <td style={{ padding: "10px 10px", textAlign: "center", borderBottom: `1px solid ${C.rule}` }}>
                <span style={{ fontFamily: "Georgia", fontSize: 16, color: C.ink3 }}>{cl.cm_pct}%</span>
              </td>
              <td style={{ padding: "10px 10px", textAlign: "center", borderBottom: `1px solid ${C.rule}` }}>
                <GapBadge gap={cl.gap} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SatireNote({ satire }) {
  return (
    <div style={{
      background: C.purpleLight, border: `1px solid ${C.purple}`,
      borderLeft: `4px solid ${C.purple}`, borderRadius: 6,
      padding: "10px 14px", marginTop: 10,
    }}>
      <span style={{ fontWeight: 700, fontSize: 11, color: C.purple, fontFamily: "monospace" }}>
        ANALYST NOTE — G: Political Satire ({satire.sm_pct}% SM, ~0% CM)
      </span>
      <p style={{ margin: "6px 0 0", fontSize: 11, color: C.ink2, lineHeight: 1.5 }}>
        Not included as a main cluster due to small volume, but timing matters: satire spiked
        Apr 21–23 precisely between Broken Promise fading and Inflation Domino locking in.
        Content: memes, Bahlil mockery ("King Bahlil", "Let Bahlil Cook"),
        officials-not-solving-anything jokes. Acts as a transition narrative — anger that has
        cooled but keeps spreading. Near-zero CM coverage means conventional media is entirely
        missing this dimension.
      </p>
    </div>
  );
}

function DailyTrendChart({ dailySm, dailyCm, dailyClusters }) {
  const [view, setView] = useState("engagement");
  return (
    <div style={{ background: "white", borderRadius: 6, border: `1px solid ${C.rule}`, overflow: "hidden" }}>
      <div style={{ background: C.navyLight, padding: "6px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: C.navyMid, fontWeight: 700 }}>DAILY TREND</span>
        <div style={{ display: "flex", gap: 6 }}>
          {[["engagement", "SM Engagement"], ["articles", "CM Articles"], ["clusters", "By Cluster"]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} style={{
              fontSize: 9, padding: "3px 10px", border: `1px solid ${C.navyMid}`,
              borderRadius: 3, cursor: "pointer", fontFamily: "monospace",
              background: view === v ? C.navyMid : "white",
              color: view === v ? "white" : C.navyMid,
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, height: 220 }}>
        {view === "engagement" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySm} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.rule} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }}
                     tickFormatter={d => d.slice(5)} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={fmt} />
              <Tooltip formatter={(v) => [fmt(v), "Engagement"]} labelFormatter={d => `Date: ${d}`} />
              <Bar dataKey="engagement" fill={C.navyMid} radius={[2,2,0,0]}
                   label={false}
                   cell={dailySm.map((r, i) => {
                     const max = Math.max(...dailySm.map(x => x.engagement));
                     return <rect key={i} fill={r.engagement === max ? C.red : C.navyMid} />;
                   })} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {view === "articles" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyCm} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.rule} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }}
                     tickFormatter={d => d.slice(5)} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v) => [v, "Articles"]} />
              <Bar dataKey="articles" fill={C.amber} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {view === "clusters" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyClusters} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.rule} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }}
                     tickFormatter={d => d.slice(5)} angle={-45} textAnchor="end" />
              <YAxis tick={{ fontSize: 9 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v, name) => [`${v}%`, name]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {["B","C","F","A","D","UNCLASSIFIED"].map(id => (
                <Area key={id} type="monotone" dataKey={id} stackId="1"
                      stroke={CLUSTER_COLORS[id]} fill={CLUSTER_COLORS[id]}
                      fillOpacity={0.75} name={id} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function RegionCards({ regions }) {
  const statusBorder = { hot: C.red, watch: C.amber, monitor: C.navyMid };
  return (
    <div style={{ background: "white", borderRadius: 6, border: `1px solid ${C.rule}`, overflow: "hidden" }}>
      <div style={{ background: C.navyLight, padding: "6px 14px", borderBottom: `1px solid ${C.rule}` }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: C.navyMid, fontWeight: 700 }}>REGIONAL FORMATION</span>
      </div>
      <div style={{ padding: "10px 14px 4px" }}>
        <span style={{ fontSize: 13, fontFamily: "Georgia", fontWeight: 700, color: C.navy }}>
          SM Engagement & Escalation Risk by Province
        </span>
      </div>
      <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {regions.map(r => (
          <div key={r.name} style={{
            border: `1px solid ${statusBorder[r.status] || C.navyMid}`,
            borderLeft: `4px solid ${statusBorder[r.status] || C.navyMid}`,
            borderRadius: 4, padding: "8px 12px",
            background: r.status === "hot" ? "#fef9f9" : r.status === "watch" ? "#fefcf5" : "#f5f8fd",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: C.ink }}>{r.name}</span>
              <StatusPill status={r.status} escalation={r.escalation} />
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: C.ink3, fontFamily: "monospace" }}>
              Eng: {fmt(r.engagement)} · {r.sm_posts} SM posts · {r.cm_articles} CM articles
              {r.escalation > 0 && <span style={{ color: C.red, marginLeft: 6 }}>⚡ {r.escalation} escalation signals</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DownloadButton({ onDownload, loading }) {
  return (
    <button
      onClick={onDownload}
      disabled={loading}
      style={{
        background: loading ? C.ink4 : C.navy,
        color: "white", border: "none", borderRadius: 6,
        padding: "12px 28px", cursor: loading ? "not-allowed" : "pointer",
        fontSize: 13, fontFamily: "Georgia", fontWeight: 700,
        display: "flex", alignItems: "center", gap: 8,
        boxShadow: "0 2px 8px rgba(0,56,120,0.2)",
      }}
    >
      {loading ? "Generating…" : "⬇ Download PPTX Report"}
    </button>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dlLoading, setDlLoading] = useState(false);
  const [error, setError]       = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/dashboard`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);

  const downloadPptx = async () => {
    setDlLoading(true);
    try {
      const res = await fetch(`${API}/api/download-pptx`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "Indonesia_Energy_Narrative_Monitor.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Download failed: " + e.message);
    } finally {
      setDlLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.surface2, fontFamily: "Calibri, sans-serif" }}>
      {/* Header */}
      {data && (
        <MetaBar meta={data.meta} onRefresh={fetchData} loading={loading} />
      )}
      {!data && (
        <div style={{ background: C.navy, color: "white", padding: "12px 24px", fontSize: 15, fontFamily: "Georgia", fontWeight: 700 }}>
          INDONESIA ENERGY NARRATIVE MONITOR
        </div>
      )}

      {/* Body */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>

        {/* Loading / Error states */}
        {loading && !data && (
          <div style={{ textAlign: "center", padding: 60, color: C.ink3, fontSize: 14 }}>
            Loading data from Google Sheets…
          </div>
        )}
        {error && (
          <div style={{
            background: C.redLight, border: `1px solid ${C.red}`,
            borderRadius: 6, padding: "12px 16px", color: C.red,
            fontFamily: "monospace", fontSize: 12, marginBottom: 16,
          }}>
            ⚠ Error: {error}. Check that GOOGLE_SHEET_ID is set and the sheet is publicly accessible.
          </div>
        )}

        {data && (
          <>
            {/* Top row: actions + last fetch */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.ink4, fontFamily: "monospace" }}>
                Period: {data.meta.period_start} – {data.meta.last_updated}
                {lastFetch && ` · Fetched: ${lastFetch.toLocaleTimeString()} · Auto-refreshes every 5 min`}
              </div>
              <DownloadButton onDownload={downloadPptx} loading={dlLoading} />
            </div>

            {/* Narrative Gap + Satire Note */}
            <NarrativeGapTable clusters={data.clusters} />
            <SatireNote satire={data.satire_note} />

            {/* Trend + Regions side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <DailyTrendChart
                dailySm={data.daily_sm}
                dailyCm={data.daily_cm}
                dailyClusters={data.daily_clusters}
              />
              <RegionCards regions={data.regions} />
            </div>
            
            {/* Emerging Narratives */}
            <div style={{
              marginTop: 16,
              background: "white",
              borderRadius: 6,
              border: `1px solid ${C.rule}`,
              overflow: "hidden"
            }}>

              <div style={{
                background: C.redLight,
                padding: "6px 14px",
                borderBottom: `1px solid ${C.rule}`
              }}>
                <span style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  color: C.red,
                  fontWeight:700
                }}>
                  EMERGING NARRATIVES
                </span>
              </div>

              <div style={{ padding: 14 }}>

                {data.emerging_narratives?.length ? (

                  data.emerging_narratives.map((n, i) => (

                    <div
                      key={i}
                      style={{
                        padding: "12px",
                        border: `1px solid ${C.rule}`,
                        borderLeft: `4px solid ${C.red}`,
                        borderRadius: 4,
                        marginBottom: 12,
                        background: "#fff"
                      }}
                    >

                      <div style={{
                        fontSize: 11,
                        color: C.ink2,
                        lineHeight: 1.5,
                        marginBottom: 8
                      }}>
                        {n.text}
                      </div>

                      <div style={{
                        fontSize: 11,
                        color: C.ink,
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap"
                      }}>
                        {n.summary}
                      </div>

                      <div style={{
                        marginTop: 8,
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: C.red
                      }}>
                        Engagement: {fmt(n.engagement)}
                      </div>

                    </div>

                  ))

                ) : (

                  <div style={{
                    fontSize: 11,
                    color: C.ink4
                  }}>
                    No emerging narratives detected.
                  </div>

                )}

              </div>
            </div>
                

            {/* Cluster locked notice */}
            <div style={{
              marginTop: 16, padding: "10px 14px",
              background: C.greenLight, border: `1px solid ${C.green}`,
              borderRadius: 6, fontSize: 11, color: C.green, fontFamily: "monospace",
            }}>
              🔒 CLUSTER DEFINITIONS LOCKED — A: Broken Promise · B: Inflation Domino · C: Subsidy Migration · D: Geopolitical · F: EV/Alternatives.
              These never change regardless of data updates. Only code changes can modify cluster definitions.
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 32, padding: "10px 24px",
        background: C.surface, borderTop: `1px solid ${C.rule}`,
        fontSize: 10, color: C.ink4, fontFamily: "monospace",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>CONFIDENTIAL — Media Intelligence Internal Use</span>
        <span>Keyword clustering · AVE-weighted CM · Engagement-weighted SM</span>
      </div>
    </div>
  );
}
