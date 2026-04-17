import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine, ComposedChart } from "recharts";

// ─── DATA ────────────────────────────────────────────────────────────────────
// Note: Several tabs use Stephen Few's visualization techniques (bullet charts,
// small multiples, horizontal bars, high data-ink ratio). Attribution stays in
// code comments only, not in the user-facing UI.
const BANKS = [
  { id: 1, name: "JPMorgan Chase", ticker: "JPM", totalAssets: 4002.8, ndfiTotal: 237.85, ndfiPctLoans: 9.8, ndfiPctTier1: 72.1, qoqGrowth: 5.2, delinquency: 0.08, mortgage: 0, businessCredit: 0, privateEquity: 0, consumer: 0, other: 237.85, unfunded: 142.0, tier: "GSIB", note: "Reported entire NDFI book as 'Other'; declined to break out subcategories, citing organizational risk." },
  { id: 2, name: "Wells Fargo", ticker: "WFC", totalAssets: 1930.6, ndfiTotal: 212.13, ndfiPctLoans: 11.2, ndfiPctTier1: 68.4, qoqGrowth: 14.2, delinquency: 0.11, mortgage: 55.2, businessCredit: 48.7, privateEquity: 38.1, consumer: 22.4, other: 47.73, unfunded: 128.0, tier: "GSIB", note: "" },
  { id: 3, name: "Bank of America", ticker: "BAC", totalAssets: 3290.0, ndfiTotal: 189.50, ndfiPctLoans: 8.7, ndfiPctTier1: 61.2, qoqGrowth: 8.1, delinquency: 0.09, mortgage: 42.8, businessCredit: 51.3, privateEquity: 35.6, consumer: 18.9, other: 40.9, unfunded: 115.0, tier: "GSIB", note: "" },
  { id: 4, name: "Citibank", ticker: "C", totalAssets: 2410.0, ndfiTotal: 148.20, ndfiPctLoans: 10.1, ndfiPctTier1: 58.9, qoqGrowth: 6.8, delinquency: 0.12, mortgage: 28.5, businessCredit: 42.1, privateEquity: 31.7, consumer: 15.2, other: 30.7, unfunded: 95.0, tier: "GSIB", note: "" },
  { id: 5, name: "Goldman Sachs", ticker: "GS", totalAssets: 1680.0, ndfiTotal: 78.40, ndfiPctLoans: 12.5, ndfiPctTier1: 54.2, qoqGrowth: 9.3, delinquency: 0.06, mortgage: 5.2, businessCredit: 18.9, privateEquity: 32.8, consumer: 2.1, other: 19.4, unfunded: 52.0, tier: "GSIB", note: "High PE fund concentration; double-digit proportion of loans to PE funds." },
  { id: 6, name: "Morgan Stanley", ticker: "MS", totalAssets: 1220.0, ndfiTotal: 62.30, ndfiPctLoans: 13.8, ndfiPctTier1: 48.7, qoqGrowth: 7.5, delinquency: 0.05, mortgage: 4.8, businessCredit: 28.6, privateEquity: 15.2, consumer: 1.9, other: 11.8, unfunded: 38.0, tier: "GSIB", note: "Second-highest BCI proportion at 19.73% of gross loans." },
  { id: 7, name: "State Street", ticker: "STT", totalAssets: 310.0, ndfiTotal: 45.20, ndfiPctLoans: 45.08, ndfiPctTier1: 82.1, qoqGrowth: 8.9, delinquency: 0.04, mortgage: 1.2, businessCredit: 24.8, privateEquity: 7.63, consumer: 0.8, other: 10.77, unfunded: 22.0, tier: "Regional", note: "Highest BCI proportion at 45.08% of gross loans. Second-highest PE proportion at 17.58%." },
  { id: 8, name: "First Citizens", ticker: "FCNCA", totalAssets: 214.0, ndfiTotal: 38.50, ndfiPctLoans: 19.22, ndfiPctTier1: 71.5, qoqGrowth: 11.4, delinquency: 0.15, mortgage: 3.8, businessCredit: 5.2, privateEquity: 26.98, consumer: 0.9, other: 1.62, unfunded: 18.0, tier: "Regional", note: "Highest PE fund proportion at 19.22% of gross loans." },
  { id: 9, name: "PNC Financial", ticker: "PNC", totalAssets: 560.0, ndfiTotal: 35.80, ndfiPctLoans: 6.8, ndfiPctTier1: 42.1, qoqGrowth: 6.2, delinquency: 0.10, mortgage: 8.4, businessCredit: 12.1, privateEquity: 6.8, consumer: 3.2, other: 5.3, unfunded: 21.0, tier: "Regional", note: "" },
  { id: 10, name: "BNY Mellon", ticker: "BK", totalAssets: 410.0, ndfiTotal: 32.40, ndfiPctLoans: 14.8, ndfiPctTier1: 39.2, qoqGrowth: 7.1, delinquency: 0.03, mortgage: 1.5, businessCredit: 8.9, privateEquity: 12.4, consumer: 0.6, other: 9.0, unfunded: 16.0, tier: "GSIB", note: "Double-digit proportion of loans to PE funds." },
  { id: 11, name: "HSBC Bank USA", ticker: "HSBC", totalAssets: 198.0, ndfiTotal: 28.60, ndfiPctLoans: 15.2, ndfiPctTier1: 52.8, qoqGrowth: 5.8, delinquency: 0.07, mortgage: 2.1, businessCredit: 7.8, privateEquity: 11.2, consumer: 1.4, other: 6.1, unfunded: 14.0, tier: "Regional", note: "Double-digit proportion of loans to PE funds." },
  { id: 12, name: "U.S. Bancorp", ticker: "USB", totalAssets: 680.0, ndfiTotal: 24.90, ndfiPctLoans: 4.2, ndfiPctTier1: 31.5, qoqGrowth: 4.5, delinquency: 0.11, mortgage: 7.2, businessCredit: 8.1, privateEquity: 3.8, consumer: 2.9, other: 2.9, unfunded: 12.0, tier: "Regional", note: "" },
  { id: 13, name: "Truist Bank", ticker: "TFC", totalAssets: 530.0, ndfiTotal: 22.10, ndfiPctLoans: 4.8, ndfiPctTier1: 33.8, qoqGrowth: 5.1, delinquency: 0.13, mortgage: 6.8, businessCredit: 6.2, privateEquity: 3.4, consumer: 2.8, other: 2.9, unfunded: 11.0, tier: "Regional", note: "" },
  { id: 14, name: "Fifth Third", ticker: "FITB", totalAssets: 212.0, ndfiTotal: 18.50, ndfiPctLoans: 7.9, ndfiPctTier1: 38.2, qoqGrowth: -2.1, delinquency: 0.18, mortgage: 4.2, businessCredit: 5.8, privateEquity: 3.1, consumer: 2.4, other: 3.0, unfunded: 9.0, tier: "Regional", note: "One of two top-20 banks showing QoQ decline." },
  { id: 15, name: "EverBank", ticker: "EVER", totalAssets: 46.0, ndfiTotal: 15.04, ndfiPctLoans: 41.9, ndfiPctTier1: 88.5, qoqGrowth: 12.5, delinquency: 0.16, mortgage: 8.2, businessCredit: 3.1, privateEquity: 1.8, consumer: 0.9, other: 1.04, unfunded: 7.0, tier: "Community+", note: "Smallest bank in top 20 by assets ($46B). NDFI is 41.9% of total loans — highest concentration." },
  { id: 16, name: "Veritex Community", ticker: "VBTX", totalAssets: 38.0, ndfiTotal: 15.32, ndfiPctLoans: 38.2, ndfiPctTier1: 91.4, qoqGrowth: 33.0, delinquency: 0.22, mortgage: 6.8, businessCredit: 4.1, privateEquity: 1.2, consumer: 1.8, other: 1.42, unfunded: 6.0, tier: "Community+", note: "Largest QoQ increase among top 20 at 33.0%. Second-highest NDFI-to-Tier-1 ratio." },
  { id: 17, name: "Regions Bank", ticker: "RF", totalAssets: 156.0, ndfiTotal: 14.80, ndfiPctLoans: 6.1, ndfiPctTier1: 34.5, qoqGrowth: 3.8, delinquency: 0.09, mortgage: 4.5, businessCredit: 4.2, privateEquity: 2.1, consumer: 1.8, other: 2.2, unfunded: 7.5, tier: "Regional", note: "Executives described portfolio as 'stagnant' with no 'big potential clouds forming.'" },
  { id: 18, name: "TD Bank NA", ticker: "TD", totalAssets: 380.0, ndfiTotal: 13.20, ndfiPctLoans: 3.8, ndfiPctTier1: 24.1, qoqGrowth: -1.2, delinquency: 0.10, mortgage: 3.8, businessCredit: 4.1, privateEquity: 1.8, consumer: 1.5, other: 2.0, unfunded: 6.5, tier: "Regional", note: "One of two top-20 banks showing QoQ decline." },
  { id: 19, name: "Citizens Financial", ticker: "CFG", totalAssets: 225.0, ndfiTotal: 12.50, ndfiPctLoans: 5.4, ndfiPctTier1: 29.8, qoqGrowth: 6.9, delinquency: 0.12, mortgage: 3.2, businessCredit: 4.5, privateEquity: 1.8, consumer: 1.2, other: 1.8, unfunded: 6.0, tier: "Regional", note: "" },
  { id: 20, name: "Webster Bank", ticker: "WBS", totalAssets: 85.0, ndfiTotal: 6.80, ndfiPctLoans: 12.0, ndfiPctTier1: 52.3, qoqGrowth: 8.5, delinquency: 0.09, mortgage: 1.8, businessCredit: 2.4, privateEquity: 0.9, consumer: 0.7, other: 1.0, unfunded: 3.2, tier: "Regional", note: "Mid-sized regional bank. $56.6B loan book as of Q4 2025 with notable fund finance and lender finance activity." },
  { id: 21, name: "Stifel Bank", ticker: "SF", totalAssets: 42.0, ndfiTotal: 5.03, ndfiPctLoans: 22.1, ndfiPctTier1: 45.2, qoqGrowth: 5248.0, delinquency: 0.02, mortgage: 0.5, businessCredit: 2.1, privateEquity: 1.2, consumer: 0.3, other: 0.93, unfunded: 2.5, tier: "Community+", note: "Expanded from $62.8M to $3.36B in single quarter (Stifel Bank entity). Combined with Stifel Bank & Trust at $1.67B." },
];

const INDUSTRY = { ndfiPctTier1: 52, delinquency: 0.14, qoqGrowth: 7.3 };

const TIMELINE = [
  { year: "2010", value: 56 },{ year: "2011", value: 78 },{ year: "2012", value: 105 },
  { year: "2013", value: 140 },{ year: "2014", value: 182 },{ year: "2015", value: 230 },
  { year: "2016", value: 285 },{ year: "2017", value: 348 },{ year: "2018", value: 420 },
  { year: "2019", value: 505 },{ year: "2020", value: 580 },{ year: "2021", value: 720 },
  { year: "2022", value: 870 },{ year: "2023", value: 1020 },{ year: "2024", value: 1156 },
  { year: "Q4'25", value: 1570 },
];

const EVENTS = [
  { year: "2010", label: "FDIC begins tracking" },
  { year: "2013", label: "Leveraged lending guidance issued" },
  { year: "2022", label: "Fed raises rates 525bps" },
  { year: "2024", label: "New Call Report subcategories required" },
  { year: "Q4'25", label: "Leveraged lending guidance rescinded" },
];

const CATEGORIES = [
  { key: "mortgage", label: "Mortgage Credit", color: "#5B8C6E" },
  { key: "businessCredit", label: "Business Credit", color: "#7BA3C9" },
  { key: "privateEquity", label: "Private Equity", color: "#C9956B" },
  { key: "consumer", label: "Consumer Credit", color: "#9B8EC4" },
  { key: "other", label: "Other / Unspecified", color: "#8C8C8C" },
];

const SOURCES = [
  { name: "FDIC Call Reports (FFIEC 031/041)", schedule: "Schedule RC-C, Part I, Item 9.a & Memo Item 10", desc: "Primary source. Banks file quarterly. Since Q4 2024, banks with >$10B assets must break NDFI loans into 5 subcategories. Schedule RC-L captures unfunded commitments.", url: "https://cdr.ffiec.gov/public/", urlLabel: "FFIEC Central Data Repository" },
  { name: "FDIC Banking Issues in Focus", schedule: "February 2026 Report", desc: "Comprehensive analysis of NDFI lending trends, concentration risks, and the growth of bank-NDFI interconnections.", url: "https://www.fdic.gov/analysis/bank-lending-nondepository-financial-institutions.pdf", urlLabel: "FDIC NDFI Report (PDF)" },
  { name: "Federal Reserve Form Y-14", schedule: "Y-14Q Schedule H (Counterparty)", desc: "Confidential. Filed by the largest banks (~35 BHCs). Captures counterparty credit risk including exposures to private credit funds and BDCs. Y-14 data shows $123B committed to private credit obligors as of year-end 2024.", url: "https://www.federalreserve.gov/apps/reportingforms/Report/Index/FR_Y-14Q", urlLabel: "FR Y-14Q Form" },
  { name: "SEC Form PF", schedule: "Question 47 (Borrowings)", desc: "Filed by private fund advisers with >$150M AUM. Provides the fund-side view of bank borrowings. OFR's March 2026 brief noted that reported borrowings may understate actual bank exposure.", url: "https://www.sec.gov/divisions/investment/pfrd/pf-instructions.pdf", urlLabel: "SEC Form PF Instructions" },
  { name: "FDIC Risk Review 2025", schedule: "Section: NDFI Lending & Private Credit", desc: "Annual supervisory review. Covers NDFI growth trends, private credit characteristics, and systemic risk considerations.", url: "https://www.fdic.gov/analysis/2025-risk-review.pdf", urlLabel: "2025 Risk Review (PDF)" },
  { name: "S&P Global Market Intelligence", schedule: "Quarterly NDFI Lending Reports", desc: "Detailed bank-level NDFI data derived from Call Reports. Tracks top 20 lenders, subcategory breakdowns, growth rates, and delinquency.", url: "https://www.spglobal.com/market-intelligence/en/news-insights/articles/2026/2/us-banks-ndfi-lending-pace-reaccelerates-in-q4-2025-98612159", urlLabel: "Q4 2025 NDFI Report" },
  { name: "OFR Brief 26-02", schedule: "March 2026", desc: "Measures counterparty exposures to private credit using Y-14, SEC Form PF, and Moody's data. Flags that bank-reported figures may undercount true exposure.", url: "https://www.financialresearch.gov/briefs/2026/03/12/measuring-counterparty-exposures-private-credit/", urlLabel: "OFR Brief 26-02" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n, d = 1) => n >= 1000 ? `$${(n / 1000).toFixed(d)}T` : `$${n.toFixed(d)}B`;
const fmtPct = (n, d = 2) => `${n.toFixed(d)}%`;
const fmtGrowth = (n) => n > 100 ? `+${Math.round(n)}%` : n > 0 ? `+${n.toFixed(1)}%` : `${n.toFixed(1)}%`;

const TABS = [
  { id: "overview", label: "Overview", icon: "◉" },
  { id: "table", label: "Table", icon: "≡" },
  { id: "ranking", label: "Rank", icon: "▊" },
  { id: "mix", label: "Mix", icon: "◫" },
  { id: "risk", label: "Risk", icon: "◈" },
  { id: "guide", label: "Guide", icon: "?" },
  { id: "sources", label: "Sources", icon: "⊞" },
];

// ─── LAYOUT PRIMITIVES ───────────────────────────────────────────────────────
// Each tab is a flex column that fills the available height. The PinnedHeader
// is flex-shrink: 0 so it stays fixed, while ScrollArea takes the remaining
// space with overflow: auto. This approach works reliably across browsers,
// unlike position: sticky which fails when an ancestor scrolls.

const TabShell = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
    {children}
  </div>
);

const PinnedHeader = ({ title, subtitle, children }) => (
  <div style={{ flexShrink: 0, background: "#0d0d0d", borderBottom: "1px solid #222", padding: "14px 16px 10px" }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>{title}</h2>
    {subtitle && <p style={{ fontSize: 11, color: "#777", margin: "3px 0 0", fontFamily: "'IBM Plex Mono', monospace" }}>{subtitle}</p>}
    {children}
  </div>
);

const ScrollArea = ({ children, padded = false }) => (
  <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: padded ? 16 : 0 }}>
    {children}
  </div>
);

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #333", padding: "8px 12px", fontSize: 12, color: "#ccc", borderRadius: 4 }}>
      <div style={{ color: "#e0e0e0", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#ccc" }}>
          {p.name}: {typeof p.value === "number" ? (p.value >= 1 ? `$${p.value.toFixed(1)}B` : `$${(p.value * 1000).toFixed(0)}M`) : p.value}
        </div>
      ))}
    </div>
  );
};

// ─── TAB: DATA TABLE ─────────────────────────────────────────────────────────
// The table is built with CSS Grid rather than an HTML <table>. This lets the
// column header row live inside PinnedHeader (so it stays fixed) while the
// data rows live inside ScrollArea (so they scroll). Both use the same
// GRID_COLS template so the columns stay perfectly aligned.
const GRID_COLS = "minmax(128px, 1.4fr) 64px 56px 56px 52px 52px";

const DataTable = () => {
  const [sortKey, setSortKey] = useState("ndfiTotal");
  const [sortDir, setSortDir] = useState("desc");
  const [expanded, setExpanded] = useState(null);

  const sorted = useMemo(() => {
    return [...BANKS].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") return sortDir === "desc" ? bv.localeCompare(av) : av.localeCompare(bv);
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const HeaderCell = ({ k, children, align = "right" }) => (
    <div
      onClick={() => toggleSort(k)}
      style={{
        textAlign: align,
        padding: "8px 4px",
        cursor: "pointer",
        userSelect: "none",
        fontSize: 10,
        fontWeight: 600,
        color: sortKey === k ? "#C9956B" : "#888",
        whiteSpace: "nowrap",
        letterSpacing: "0.03em",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {children}{sortKey === k ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
    </div>
  );

  return (
    <TabShell>
      <PinnedHeader title="Bank-Level NDFI Exposure" subtitle="Q4 2025 · Tap row to expand · Tap column to sort">
        {/* Column headers live inside the pinned header so they never scroll away. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            borderBottom: "2px solid #333",
            marginTop: 10,
            marginLeft: -16,
            marginRight: -16,
            marginBottom: -10,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <HeaderCell k="name" align="left">Bank</HeaderCell>
          <HeaderCell k="ndfiTotal">NDFI ($B)</HeaderCell>
          <HeaderCell k="ndfiPctLoans">% Loans</HeaderCell>
          <HeaderCell k="ndfiPctTier1">% Tier1</HeaderCell>
          <HeaderCell k="qoqGrowth">QoQ Δ</HeaderCell>
          <HeaderCell k="delinquency">Delinq</HeaderCell>
        </div>
      </PinnedHeader>
      <ScrollArea>
        {sorted.map((b, i) => (
          <div key={b.id}>
            <div
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                cursor: "pointer",
                background: expanded === b.id ? "#1a1a16" : i % 2 === 0 ? "#111" : "#0d0d0d",
                paddingLeft: 16,
                paddingRight: 16,
                borderBottom: "1px solid #1a1a1a",
                alignItems: "center",
              }}
            >
              <div style={{ padding: "10px 4px 10px 0", color: "#ddd", fontWeight: 500, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <span style={{ color: "#666", fontSize: 10, marginRight: 4 }}>{expanded === b.id ? "▾" : "▸"}</span>
                {b.name}
                <span style={{ fontSize: 9, color: "#555", marginLeft: 6 }}>{b.ticker}</span>
              </div>
              <div style={{ padding: "10px 4px", textAlign: "right", color: "#e0e0e0", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{b.ndfiTotal.toFixed(1)}</div>
              <div style={{ padding: "10px 4px", textAlign: "right", color: b.ndfiPctLoans > 15 ? "#C9956B" : "#bbb", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtPct(b.ndfiPctLoans, 1)}</div>
              <div style={{ padding: "10px 4px", textAlign: "right", color: b.ndfiPctTier1 > 70 ? "#c45" : b.ndfiPctTier1 > 50 ? "#C9956B" : "#bbb", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtPct(b.ndfiPctTier1, 1)}</div>
              <div style={{ padding: "10px 4px", textAlign: "right", color: b.qoqGrowth > 10 && b.qoqGrowth <= 100 ? "#C9956B" : b.qoqGrowth < 0 ? "#5B8C6E" : "#bbb", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>
                {b.qoqGrowth > 100 ? "N/M" : fmtGrowth(b.qoqGrowth)}
              </div>
              <div style={{ padding: "10px 4px 10px 0", textAlign: "right", color: b.delinquency > 0.15 ? "#C9956B" : "#bbb", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtPct(b.delinquency)}</div>
            </div>
            {expanded === b.id && (
              <div style={{ background: "#151512", padding: "12px 16px", borderBottom: "1px solid #252520" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10, fontSize: 11 }}>
                  <div><span style={{ color: "#666" }}>Total Assets:</span> <span style={{ color: "#ccc" }}>{fmt(b.totalAssets)}</span></div>
                  <div><span style={{ color: "#666" }}>Unfunded:</span> <span style={{ color: "#ccc" }}>{fmt(b.unfunded)}</span></div>
                  <div><span style={{ color: "#666" }}>Committed:</span> <span style={{ color: "#ccc" }}>{fmt(b.ndfiTotal + b.unfunded)}</span></div>
                  <div><span style={{ color: "#666" }}>Tier:</span> <span style={{ color: "#ccc" }}>{b.tier}</span></div>
                </div>
                <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, color: "#aaa", marginBottom: 6 }}>NDFI Subcategory Breakdown (Schedule RC-C Memo 10)</div>
                  {CATEGORIES.map(c => {
                    const val = b[c.key];
                    const pct = b.ndfiTotal > 0 ? (val / b.ndfiTotal * 100) : 0;
                    return (
                      <div key={c.key} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, marginRight: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, color: "#999" }}>{c.label}</div>
                        <div style={{ width: 70, textAlign: "right", color: "#ccc", fontFamily: "'IBM Plex Mono', monospace" }}>${val.toFixed(1)}B</div>
                        <div style={{ width: 50, textAlign: "right", color: "#777", fontFamily: "'IBM Plex Mono', monospace" }}>{pct.toFixed(0)}%</div>
                      </div>
                    );
                  })}
                </div>
                {b.note && <div style={{ fontSize: 11, color: "#C9956B", fontStyle: "italic", borderTop: "1px solid #252520", paddingTop: 8 }}>⚠ {b.note}</div>}
              </div>
            )}
          </div>
        ))}
      </ScrollArea>
    </TabShell>
  );
};

// ─── TAB: RANKING ────────────────────────────────────────────────────────────
const RankingView = () => {
  const [metric, setMetric] = useState("ndfiTotal");
  const labels = { ndfiTotal: "Total NDFI ($B)", ndfiPctTier1: "NDFI % of Tier 1", ndfiPctLoans: "NDFI % of Loans", qoqGrowth: "QoQ Growth %" };

  const data = useMemo(() => {
    return [...BANKS]
      .filter(b => metric !== "qoqGrowth" || b.qoqGrowth <= 100)
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 15)
      .map(b => ({
        name: b.name.length > 16 ? b.name.slice(0, 14) + "…" : b.name,
        funded: metric === "ndfiTotal" ? b.ndfiTotal : b[metric],
        unfunded: metric === "ndfiTotal" ? b.unfunded : 0,
      }));
  }, [metric]);

  const median = useMemo(() => {
    const vals = BANKS.map(b => b[metric]).filter(v => v <= 100).sort((a, b) => a - b);
    return vals[Math.floor(vals.length / 2)];
  }, [metric]);

  return (
    <TabShell>
      <PinnedHeader title="Exposure Rankings" subtitle="Top 15 banks · Tap metric to switch view">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {Object.entries(labels).map(([k, v]) => (
            <button key={k} onClick={() => setMetric(k)} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid", borderColor: metric === k ? "#C9956B" : "#333", background: metric === k ? "#2a2218" : "transparent", color: metric === k ? "#C9956B" : "#888", borderRadius: 4, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>{v}</button>
          ))}
        </div>
        {metric === "ndfiTotal" && (
          <div style={{ display: "flex", gap: 16, padding: "8px 0 0", fontSize: 10, color: "#777", flexWrap: "wrap" }}>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#7BA3C9", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Funded</span>
            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#3a5570", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Unfunded</span>
            <span><span style={{ display: "inline-block", width: 12, height: 2, background: "#555", marginRight: 4, verticalAlign: "middle" }} />Median</span>
          </div>
        )}
      </PinnedHeader>
      <ScrollArea>
        <div style={{ padding: "16px 8px 8px" }}>
          <ResponsiveContainer width="100%" height={Math.max(400, data.length * 34)}>
            <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#777", fontSize: 10, fontFamily: "'IBM Plex Mono'" }} axisLine={{ stroke: "#333" }} tickLine={false} />
              <YAxis dataKey="name" type="category" width={110} tick={{ fill: "#bbb", fontSize: 11, fontFamily: "'IBM Plex Sans'" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {metric === "ndfiTotal" && <ReferenceLine x={median} stroke="#555" strokeDasharray="4 4" />}
              <Bar dataKey="funded" stackId="a" fill="#7BA3C9" radius={metric === "ndfiTotal" ? [0, 0, 0, 0] : [0, 3, 3, 0]} name={metric === "ndfiTotal" ? "Funded" : labels[metric]} barSize={20} />
              {metric === "ndfiTotal" && <Bar dataKey="unfunded" stackId="a" fill="#3a5570" radius={[0, 3, 3, 0]} name="Unfunded" barSize={20} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ScrollArea>
    </TabShell>
  );
};

// ─── TAB: MIX ────────────────────────────────────────────────────────────────
const MixView = () => {
  const sorted = useMemo(() => [...BANKS].sort((a, b) => b.ndfiTotal - a.ndfiTotal), []);

  return (
    <TabShell>
      <PinnedHeader title="Subcategory Concentration" subtitle="Proportional mix per bank · RC-C Memo Item 10">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
          {CATEGORIES.map(c => (
            <span key={c.key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#999" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />{c.label}
            </span>
          ))}
        </div>
      </PinnedHeader>
      <ScrollArea>
        <div style={{ padding: "12px 16px" }}>
          {sorted.map(b => {
            const total = b.ndfiTotal || 1;
            const isAllOther = b.other === b.ndfiTotal;
            return (
              <div key={b.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#ccc", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500 }}>{b.name}</span>
                  <span style={{ fontSize: 11, color: "#777", fontFamily: "'IBM Plex Mono', monospace" }}>{fmt(b.ndfiTotal)}</span>
                </div>
                <div style={{ display: "flex", height: 18, borderRadius: 3, overflow: "hidden", background: "#1a1a1a" }}>
                  {CATEGORIES.map(c => {
                    const pct = (b[c.key] / total) * 100;
                    if (pct < 0.5) return null;
                    return <div key={c.key} style={{ width: `${pct}%`, background: c.color, minWidth: pct > 3 ? 2 : 0 }} title={`${c.label}: ${fmtPct(pct, 0)}`} />;
                  })}
                </div>
                {isAllOther && <div style={{ fontSize: 10, color: "#C9956B", fontStyle: "italic", marginTop: 2 }}>⚠ No subcategory breakdown reported</div>}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </TabShell>
  );
};

// ─── BULLET CHART COMPONENT ──────────────────────────────────────────────────
const BulletChart = ({ value, target, ranges, label, unit = "" }) => {
  const max = ranges[ranges.length - 1];
  const clampedValue = Math.min(value, max);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'IBM Plex Sans', sans-serif" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{typeof value === 'number' && value > 100 ? 'N/M' : `${value}${unit}`}</span>
      </div>
      <div style={{ position: "relative", height: 20, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(ranges[0] / max) * 100}%`, background: "#1e2a1e" }} />
        <div style={{ position: "absolute", left: `${(ranges[0] / max) * 100}%`, top: 0, height: "100%", width: `${((ranges[1] - ranges[0]) / max) * 100}%`, background: "#2a2518" }} />
        <div style={{ position: "absolute", left: `${(ranges[1] / max) * 100}%`, top: 0, height: "100%", width: `${((ranges[2] - ranges[1]) / max) * 100}%`, background: "#2a1818" }} />
        {value <= 100 && <div style={{ position: "absolute", left: 0, top: 5, height: 10, width: `${(clampedValue / max) * 100}%`, background: "#7BA3C9", borderRadius: 2 }} />}
        {target != null && <div style={{ position: "absolute", left: `${(Math.min(target, max) / max) * 100}%`, top: 2, width: 2, height: 16, background: "#e0e0e0" }} />}
      </div>
    </div>
  );
};

// ─── TAB: RISK ───────────────────────────────────────────────────────────────
const RiskView = ({ goToTab }) => {
  const sorted = useMemo(() => [...BANKS].sort((a, b) => b.ndfiPctTier1 - a.ndfiPctTier1), []);

  return (
    <TabShell>
      <PinnedHeader title="Risk Metrics" subtitle="Four risk dimensions per bank · Sorted by Tier 1 exposure">
        <div style={{ display: "flex", gap: 10, fontSize: 10, color: "#777", flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#1e2a1e", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />Low</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#2a2518", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />Moderate</span>
          <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#2a1818", borderRadius: 2, marginRight: 3, verticalAlign: "middle" }} />Elevated</span>
          <span><span style={{ display: "inline-block", width: 2, height: 10, background: "#e0e0e0", marginRight: 3, verticalAlign: "middle" }} />Industry Avg</span>
          <button onClick={() => goToTab("guide")} style={{ marginLeft: "auto", background: "transparent", border: "1px solid #C9956B", color: "#C9956B", fontSize: 10, padding: "3px 8px", borderRadius: 3, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            ? How to read
          </button>
        </div>
      </PinnedHeader>
      <ScrollArea>
        <div style={{ padding: "12px 16px" }}>
          {sorted.map(b => (
            <div key={b.id} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ fontSize: 13, color: "#ddd", fontWeight: 600, marginBottom: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {b.name} <span style={{ color: "#555", fontWeight: 400, fontSize: 11 }}>{b.ticker}</span>
              </div>
              <BulletChart value={b.ndfiPctTier1} target={INDUSTRY.ndfiPctTier1} ranges={[40, 65, 100]} label="NDFI / Tier 1 Capital" unit="%" />
              <BulletChart value={b.ndfiPctLoans} target={10} ranges={[8, 20, 50]} label="NDFI / Gross Loans" unit="%" />
              <BulletChart value={b.qoqGrowth} target={INDUSTRY.qoqGrowth} ranges={[5, 12, 35]} label="QoQ Growth" unit="%" />
              <BulletChart value={b.delinquency} target={INDUSTRY.delinquency} ranges={[0.10, 0.18, 0.30]} label="Delinquency Rate" unit="%" />
            </div>
          ))}
        </div>
      </ScrollArea>
    </TabShell>
  );
};

// ─── TAB: GUIDE ──────────────────────────────────────────────────────────────
const GuideView = ({ goToTab }) => (
  <TabShell>
    <PinnedHeader title="How to Read a Bullet Chart" subtitle="Quick reference guide" />
    <ScrollArea>
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#C9956B", marginBottom: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>Anatomy of a Bullet Chart</div>
          <div style={{ background: "#151512", padding: 16, borderRadius: 6, border: "1px solid #252520" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "#aaa", fontFamily: "'IBM Plex Sans', sans-serif" }}>Example Metric</span>
              <span style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>62%</span>
            </div>
            <div style={{ position: "relative", height: 24, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "40%", background: "#1e2a1e" }} />
              <div style={{ position: "absolute", left: "40%", top: 0, height: "100%", width: "25%", background: "#2a2518" }} />
              <div style={{ position: "absolute", left: "65%", top: 0, height: "100%", width: "35%", background: "#2a1818" }} />
              <div style={{ position: "absolute", left: 0, top: 7, height: 10, width: "62%", background: "#7BA3C9", borderRadius: 2 }} />
              <div style={{ position: "absolute", left: "52%", top: 2, width: 2, height: 20, background: "#e0e0e0" }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 10, lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            A bullet chart packs five pieces of information into one compact horizontal bar. It is a high-density replacement for dashboard gauges and dials.
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#C9956B", marginBottom: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>The Five Elements</div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12, padding: 12, background: "#111", borderRadius: 4 }}>
            <div style={{ width: 24, height: 24, background: "#7BA3C9", borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, color: "#ddd", fontWeight: 600, marginBottom: 2 }}>1. The Actual Value (blue bar)</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>The horizontal blue bar shows the current measured value for this bank. Its length tells you "how much."</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12, padding: 12, background: "#111", borderRadius: 4 }}>
            <div style={{ width: 24, height: 24, background: "#e0e0e0", borderRadius: 1, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12, color: "#ddd", fontWeight: 600, marginBottom: 2 }}>2. The Target Marker (white vertical line)</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>The thin white vertical line marks a reference point — typically the industry average. You can see at a glance whether this bank is above or below the benchmark.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12, padding: 12, background: "#111", borderRadius: 4 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0, marginTop: 2 }}>
              <div style={{ width: 24, height: 8, background: "#1e2a1e", borderRadius: 1 }} />
              <div style={{ width: 24, height: 8, background: "#2a2518", borderRadius: 1 }} />
              <div style={{ width: 24, height: 8, background: "#2a1818", borderRadius: 1 }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#ddd", fontWeight: 600, marginBottom: 2 }}>3. Qualitative Ranges (shaded background)</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>The background is divided into three shaded bands: low (green), moderate (amber), and elevated (red). These give instant context for whether the actual value is in a comfortable or concerning zone.</div>
            </div>
          </div>

          <div style={{ padding: 12, background: "#111", borderRadius: 4 }}>
            <div style={{ fontSize: 12, color: "#ddd", fontWeight: 600, marginBottom: 2 }}>4. The Label &nbsp;·&nbsp; 5. The Exact Number</div>
            <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>Above the bar, the metric name appears on the left and the precise numeric value on the right. You get both the visual pattern and the exact figure.</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#C9956B", marginBottom: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>How to Read It in 3 Steps</div>

          <div style={{ padding: 14, background: "#151512", borderRadius: 6, marginBottom: 10, borderLeft: "3px solid #5B8C6E" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd", marginBottom: 4 }}>Step 1: Where does the blue bar end?</div>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>Look at which shaded band the end of the blue bar falls into. Green = low/safe. Amber = moderate/watch. Red = elevated/concerning.</div>
          </div>

          <div style={{ padding: 14, background: "#151512", borderRadius: 6, marginBottom: 10, borderLeft: "3px solid #C9956B" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd", marginBottom: 4 }}>Step 2: Is the blue bar past the white line?</div>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>If the blue bar extends past the white vertical marker, this bank's value is above the industry average. If it stops short, it is below average.</div>
          </div>

          <div style={{ padding: 14, background: "#151512", borderRadius: 6, borderLeft: "3px solid #7BA3C9" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ddd", marginBottom: 4 }}>Step 3: Compare across banks</div>
            <div style={{ fontSize: 11, color: "#999", lineHeight: 1.5 }}>Because every bullet chart uses the same scale and shading, you can stack them vertically and scan down the page. Outliers jump out instantly.</div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#C9956B", marginBottom: 10, fontFamily: "'IBM Plex Sans', sans-serif" }}>Why Bullet Charts Beat Gauges</div>
          <div style={{ padding: 14, background: "#111518", borderRadius: 6, borderLeft: "3px solid #7BA3C9" }}>
            <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              A dashboard gauge takes up a large area but conveys only one number. A bullet chart uses a fraction of the space yet shows the actual value, the target, three qualitative ranges, and makes comparison across multiple metrics effortless. For a mobile screen with limited real estate, this density matters.
            </div>
          </div>
        </div>

        <button onClick={() => goToTab("risk")} style={{ width: "100%", padding: "12px", background: "#2a2218", border: "1px solid #C9956B", color: "#C9956B", fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          ← Back to Risk Metrics
        </button>
      </div>
    </ScrollArea>
  </TabShell>
);

// ─── TAB: OVERVIEW ───────────────────────────────────────────────────────────
const OverviewView = () => {
  const stats = [
    { label: "Total NDFI Loans", value: "$1.57T", sub: "Q4 2025" },
    { label: "15-Year CAGR", value: "21.9%", sub: "Since Q1 2010" },
    { label: "NDFI / Tier 1 (Industry)", value: "52%", sub: "All banks" },
    { label: "NDFI / Tier 1 (>$100B)", value: "68%", sub: "Large banks" },
    { label: "Delinquency Rate", value: "0.14%", sub: "Industry-wide" },
    { label: "Unfunded Commitments", value: "$987B", sub: "42.9% of total" },
    { label: "Top 10 Concentration", value: "71%", sub: "Of total NDFI" },
    { label: "Q4 QoQ Growth", value: "+7.3%", sub: "+$129.7B in quarter" },
  ];

  return (
    <TabShell>
      <PinnedHeader title="Industry Overview" subtitle="U.S. Bank NDFI Exposure · Q4 2025 snapshot" />
      <ScrollArea>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, padding: "1px", background: "#222" }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: "#111", padding: "14px 12px" }}>
              <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4, fontFamily: "'IBM Plex Sans', sans-serif" }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>{s.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 8, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600 }}>NDFI Growth: $56B → $1.57T (2010–2025)</div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={TIMELINE} margin={{ left: 0, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="year" tick={{ fill: "#666", fontSize: 10, fontFamily: "'IBM Plex Mono'" }} axisLine={{ stroke: "#333" }} tickLine={false} interval={2} />
              <YAxis tick={{ fill: "#666", fontSize: 10, fontFamily: "'IBM Plex Mono'" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}T` : `${v}B`} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const event = EVENTS.find(e => e.year === label);
                return (
                  <div style={{ background: "#1a1a1a", border: "1px solid #333", padding: "8px 12px", fontSize: 12, color: "#ccc", borderRadius: 4 }}>
                    <div style={{ fontWeight: 600 }}>{label}: {fmt(payload[0].value)}</div>
                    {event && <div style={{ color: "#C9956B", fontSize: 11, marginTop: 4 }}>↳ {event.label}</div>}
                  </div>
                );
              }} />
              <Line type="monotone" dataKey="value" stroke="#7BA3C9" strokeWidth={2} dot={false} />
              {EVENTS.map(e => (
                <ReferenceLine key={e.year} x={e.year} stroke="#333" strokeDasharray="3 3" />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {EVENTS.map(e => (
              <span key={e.year} style={{ fontSize: 10, color: "#666", fontFamily: "'IBM Plex Mono', monospace" }}>
                <span style={{ color: "#888" }}>{e.year}:</span> {e.label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #222" }}>
          <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <strong style={{ color: "#C9956B" }}>Context:</strong> In Q4 2025, NDFI loans grew $129.7B while all other loan categories combined grew just $31.4B. The FDIC and OCC rescinded the 2013 Interagency Guidance on Leveraged Lending in December 2025. As of April 2026, the Federal Reserve is actively querying major banks about their private credit exposure following rising redemptions and troubled loans.
          </div>
        </div>
      </ScrollArea>
    </TabShell>
  );
};

// ─── TAB: SOURCES ────────────────────────────────────────────────────────────
const SourcesView = () => (
  <TabShell>
    <PinnedHeader title="Regulatory Data Sources" subtitle="Primary documents and reporting forms" />
    <ScrollArea>
      <div style={{ padding: "12px 16px" }}>
        {SOURCES.map((s, i) => (
          <div key={i} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #1a1a1a" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ddd", marginBottom: 2, fontFamily: "'IBM Plex Sans', sans-serif" }}>{s.name}</div>
            <div style={{ fontSize: 11, color: "#C9956B", marginBottom: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{s.schedule}</div>
            <div style={{ fontSize: 12, color: "#999", lineHeight: 1.5, marginBottom: 8, fontFamily: "'IBM Plex Sans', sans-serif" }}>{s.desc}</div>
            <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#7BA3C9", textDecoration: "none", fontFamily: "'IBM Plex Mono', monospace" }}>
              → {s.urlLabel}
            </a>
          </div>
        ))}
        <div style={{ marginTop: 16, padding: "12px", background: "#151512", borderRadius: 6, borderLeft: "3px solid #C9956B" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#C9956B", marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>Data Limitations</div>
          <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            • Banks &lt;$10B in assets are not required to break out NDFI subcategories<br />
            • JPMorgan reported its entire NDFI portfolio as "Other," declining to provide subcategory detail<br />
            • Call Report data is quarterly; real-time exposure may differ<br />
            • Unfunded commitments can be drawn at any time, adding contingent exposure<br />
            • The OFR's March 2026 brief noted that SEC Form PF borrowing data may understate true bank exposure<br />
            • FR Y-14 data is confidential; published figures are aggregated across all reporting banks
          </div>
        </div>
        <div style={{ marginTop: 16, padding: "12px", background: "#111518", borderRadius: 6, borderLeft: "3px solid #7BA3C9" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#7BA3C9", marginBottom: 6, fontFamily: "'IBM Plex Sans', sans-serif" }}>How the Reporting Framework Connects</div>
          <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <strong style={{ color: "#bbb" }}>Call Reports (FFIEC 031/041/051)</strong> → Public. Bank-side. Shows how much banks lend to NDFIs. Filed by all FDIC-insured banks quarterly.<br /><br />
            <strong style={{ color: "#bbb" }}>FR Y-14</strong> → Confidential. Bank-side. Filed by ~35 largest BHCs. Provides granular counterparty-level detail the Fed uses for stress testing, including specific private credit fund exposures.<br /><br />
            <strong style={{ color: "#bbb" }}>SEC Form PF</strong> → Confidential. Fund-side. Filed by private fund advisers. Shows how much funds borrow from banks — the mirror image of the Call Report data. Useful for cross-referencing and identifying gaps.
          </div>
        </div>
      </div>
    </ScrollArea>
  </TabShell>
);

// ─── MAIN APP ────────────────────────────────────────────────────────────────
// Layout strategy: The root is a fixed-height (100vh) flex column containing
// three zones — a top banner, a flexible tab-content area, and a bottom nav.
// Only the tab-content area scrolls; within each tab, the PinnedHeader stays
// visible while ScrollArea scrolls. This avoids the position:sticky pitfall.
export default function App() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTab = () => {
    switch (activeTab) {
      case "table": return <DataTable />;
      case "ranking": return <RankingView />;
      case "mix": return <MixView />;
      case "risk": return <RiskView goToTab={setActiveTab} />;
      case "guide": return <GuideView goToTab={setActiveTab} />;
      case "overview": return <OverviewView />;
      case "sources": return <SourcesView />;
      default: return null;
    }
  };

  return (
    <div style={{ height: "100vh", background: "#0d0d0d", color: "#e0e0e0", fontFamily: "'IBM Plex Sans', -apple-system, sans-serif", display: "flex", flexDirection: "column", maxWidth: 768, margin: "0 auto", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Top Banner — fixed, non-scrolling */}
      <header style={{ flexShrink: 0, padding: "14px 16px 10px", borderBottom: "1px solid #222", background: "#0a0a0a" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#e0e0e0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.02em" }}>
            NDFI Exposure Tracker
          </h1>
          <span style={{ fontSize: 10, color: "#555", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>v1.3</span>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 2, fontFamily: "'IBM Plex Mono', monospace" }}>
          U.S. Bank Lending to Non-Depository Financial Institutions · Q4 2025
        </div>
      </header>

      {/* Tab content — fills remaining space. The tab's own shell pins its header. */}
      <main style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {renderTab()}
      </main>

      {/* Bottom Tab Bar — fixed, non-scrolling */}
      <nav style={{ flexShrink: 0, display: "flex", background: "#0a0a0a", borderTop: "1px solid #222" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              padding: "8px 0 10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              color: activeTab === t.id ? "#C9956B" : "#555",
              borderTop: activeTab === t.id ? "2px solid #C9956B" : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 500, letterSpacing: "0.04em" }}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
