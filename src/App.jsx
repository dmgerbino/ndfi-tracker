import { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ReferenceLine, ComposedChart } from "recharts";

// ─── GLOBAL STYLE INJECTION ──────────────────────────────────────────────────
// Injected once to kill any default body/html styling from Vite or the host.
const GlobalStyle = () => {
  useEffect(() => {
    const id = "ndfi-global-style";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { background: #0d0d0d; color: #e0e0e0; margin: 0; padding: 0;
        border: none; outline: none; min-height: 100%; width: 100%;
        font-family: 'IBM Plex Sans', -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased; }
      a { color: inherit; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
};

// ─── DATA ────────────────────────────────────────────────────────────────────
const BANKS = [
  { id:1, short:"JPMorgan", name:"JPMorgan Chase Bank NA", ticker:"JPM", totalAssets:4002.8, ndfiTotal:237.85, ndfiPctLoans:9.8, ndfiPctTier1:72.1, qoqGrowth:5.2, delinquency:0.08, mortgage:0, businessCredit:0, privateEquity:0, consumer:0, other:237.85, unfunded:142.0, tier:"GSIB", note:"Reported entire NDFI book as 'Other'; declined to break out subcategories, citing organizational risk." },
  { id:2, short:"Wells Fargo", name:"Wells Fargo Bank NA", ticker:"WFC", totalAssets:1930.6, ndfiTotal:212.13, ndfiPctLoans:11.2, ndfiPctTier1:68.4, qoqGrowth:14.2, delinquency:0.11, mortgage:55.2, businessCredit:48.7, privateEquity:38.1, consumer:22.4, other:47.73, unfunded:128.0, tier:"GSIB", note:"" },
  { id:3, short:"BofA", name:"Bank of America NA", ticker:"BAC", totalAssets:3290.0, ndfiTotal:189.50, ndfiPctLoans:8.7, ndfiPctTier1:61.2, qoqGrowth:8.1, delinquency:0.09, mortgage:42.8, businessCredit:51.3, privateEquity:35.6, consumer:18.9, other:40.9, unfunded:115.0, tier:"GSIB", note:"" },
  { id:4, short:"Citibank", name:"Citibank NA", ticker:"C", totalAssets:2410.0, ndfiTotal:148.20, ndfiPctLoans:10.1, ndfiPctTier1:58.9, qoqGrowth:6.8, delinquency:0.12, mortgage:28.5, businessCredit:42.1, privateEquity:31.7, consumer:15.2, other:30.7, unfunded:95.0, tier:"GSIB", note:"" },
  { id:5, short:"Goldman", name:"Goldman Sachs Bank USA", ticker:"GS", totalAssets:1680.0, ndfiTotal:78.40, ndfiPctLoans:12.5, ndfiPctTier1:54.2, qoqGrowth:9.3, delinquency:0.06, mortgage:5.2, businessCredit:18.9, privateEquity:32.8, consumer:2.1, other:19.4, unfunded:52.0, tier:"GSIB", note:"High PE fund concentration; double-digit proportion of loans to PE funds." },
  { id:6, short:"Morgan Stanley", name:"Morgan Stanley Bank NA", ticker:"MS", totalAssets:1220.0, ndfiTotal:62.30, ndfiPctLoans:13.8, ndfiPctTier1:48.7, qoqGrowth:7.5, delinquency:0.05, mortgage:4.8, businessCredit:28.6, privateEquity:15.2, consumer:1.9, other:11.8, unfunded:38.0, tier:"GSIB", note:"Second-highest BCI proportion at 19.73% of gross loans." },
  { id:7, short:"State Street", name:"State Street Bank and Trust Co.", ticker:"STT", totalAssets:310.0, ndfiTotal:45.20, ndfiPctLoans:45.08, ndfiPctTier1:82.1, qoqGrowth:8.9, delinquency:0.04, mortgage:1.2, businessCredit:24.8, privateEquity:7.63, consumer:0.8, other:10.77, unfunded:22.0, tier:"Regional", note:"Highest BCI proportion at 45.08% of gross loans." },
  { id:8, short:"First Citizens", name:"First Citizens Bank & Trust Co.", ticker:"FCNCA", totalAssets:214.0, ndfiTotal:38.50, ndfiPctLoans:19.22, ndfiPctTier1:71.5, qoqGrowth:11.4, delinquency:0.15, mortgage:3.8, businessCredit:5.2, privateEquity:26.98, consumer:0.9, other:1.62, unfunded:18.0, tier:"Regional", note:"Highest PE fund proportion at 19.22% of gross loans." },
  { id:9, short:"PNC", name:"PNC Bank NA", ticker:"PNC", totalAssets:560.0, ndfiTotal:35.80, ndfiPctLoans:6.8, ndfiPctTier1:42.1, qoqGrowth:6.2, delinquency:0.10, mortgage:8.4, businessCredit:12.1, privateEquity:6.8, consumer:3.2, other:5.3, unfunded:21.0, tier:"Regional", note:"" },
  { id:10, short:"BNY Mellon", name:"Bank of New York Mellon", ticker:"BK", totalAssets:410.0, ndfiTotal:32.40, ndfiPctLoans:14.8, ndfiPctTier1:39.2, qoqGrowth:7.1, delinquency:0.03, mortgage:1.5, businessCredit:8.9, privateEquity:12.4, consumer:0.6, other:9.0, unfunded:16.0, tier:"GSIB", note:"Double-digit proportion of loans to PE funds." },
  { id:11, short:"HSBC USA", name:"HSBC Bank USA NA", ticker:"HSBC", totalAssets:198.0, ndfiTotal:28.60, ndfiPctLoans:15.2, ndfiPctTier1:52.8, qoqGrowth:5.8, delinquency:0.07, mortgage:2.1, businessCredit:7.8, privateEquity:11.2, consumer:1.4, other:6.1, unfunded:14.0, tier:"Regional", note:"Double-digit proportion of loans to PE funds." },
  { id:12, short:"US Bancorp", name:"U.S. Bank NA", ticker:"USB", totalAssets:680.0, ndfiTotal:24.90, ndfiPctLoans:4.2, ndfiPctTier1:31.5, qoqGrowth:4.5, delinquency:0.11, mortgage:7.2, businessCredit:8.1, privateEquity:3.8, consumer:2.9, other:2.9, unfunded:12.0, tier:"Regional", note:"" },
  { id:13, short:"Truist", name:"Truist Bank", ticker:"TFC", totalAssets:530.0, ndfiTotal:22.10, ndfiPctLoans:4.8, ndfiPctTier1:33.8, qoqGrowth:5.1, delinquency:0.13, mortgage:6.8, businessCredit:6.2, privateEquity:3.4, consumer:2.8, other:2.9, unfunded:11.0, tier:"Regional", note:"" },
  { id:14, short:"Fifth Third", name:"Fifth Third Bank NA", ticker:"FITB", totalAssets:212.0, ndfiTotal:18.50, ndfiPctLoans:7.9, ndfiPctTier1:38.2, qoqGrowth:-2.1, delinquency:0.18, mortgage:4.2, businessCredit:5.8, privateEquity:3.1, consumer:2.4, other:3.0, unfunded:9.0, tier:"Regional", note:"One of two top-20 banks showing QoQ decline." },
  { id:15, short:"EverBank", name:"EverBank NA", ticker:"EVER", totalAssets:46.0, ndfiTotal:15.04, ndfiPctLoans:41.9, ndfiPctTier1:88.5, qoqGrowth:12.5, delinquency:0.16, mortgage:8.2, businessCredit:3.1, privateEquity:1.8, consumer:0.9, other:1.04, unfunded:7.0, tier:"Community+", note:"Smallest bank in top 20 by assets ($46B). NDFI is 41.9% of total loans — highest concentration." },
  { id:16, short:"Veritex", name:"Veritex Community Credit Bank", ticker:"VBTX", totalAssets:38.0, ndfiTotal:15.32, ndfiPctLoans:38.2, ndfiPctTier1:91.4, qoqGrowth:33.0, delinquency:0.22, mortgage:6.8, businessCredit:4.1, privateEquity:1.2, consumer:1.8, other:1.42, unfunded:6.0, tier:"Community+", note:"Largest QoQ increase among top 20 at 33.0%. Second-highest NDFI-to-Tier-1 ratio." },
  { id:17, short:"Regions", name:"Regions Bank", ticker:"RF", totalAssets:156.0, ndfiTotal:14.80, ndfiPctLoans:6.1, ndfiPctTier1:34.5, qoqGrowth:3.8, delinquency:0.09, mortgage:4.5, businessCredit:4.2, privateEquity:2.1, consumer:1.8, other:2.2, unfunded:7.5, tier:"Regional", note:"" },
  { id:18, short:"TD Bank", name:"TD Bank NA", ticker:"TD", totalAssets:380.0, ndfiTotal:13.20, ndfiPctLoans:3.8, ndfiPctTier1:24.1, qoqGrowth:-1.2, delinquency:0.10, mortgage:3.8, businessCredit:4.1, privateEquity:1.8, consumer:1.5, other:2.0, unfunded:6.5, tier:"Regional", note:"One of two top-20 banks showing QoQ decline." },
  { id:19, short:"Citizens", name:"Citizens Financial Group", ticker:"CFG", totalAssets:225.0, ndfiTotal:12.50, ndfiPctLoans:5.4, ndfiPctTier1:29.8, qoqGrowth:6.9, delinquency:0.12, mortgage:3.2, businessCredit:4.5, privateEquity:1.8, consumer:1.2, other:1.8, unfunded:6.0, tier:"Regional", note:"" },
  { id:20, short:"Webster", name:"Webster Bank NA", ticker:"WBS", totalAssets:85.0, ndfiTotal:6.80, ndfiPctLoans:12.0, ndfiPctTier1:52.3, qoqGrowth:8.5, delinquency:0.09, mortgage:1.8, businessCredit:2.4, privateEquity:0.9, consumer:0.7, other:1.0, unfunded:3.2, tier:"Regional", note:"Mid-sized regional bank. $56.6B loan book as of Q4 2025." },
  { id:21, short:"Stifel", name:"Stifel Bank", ticker:"SF", totalAssets:42.0, ndfiTotal:5.03, ndfiPctLoans:22.1, ndfiPctTier1:45.2, qoqGrowth:5248.0, delinquency:0.02, mortgage:0.5, businessCredit:2.1, privateEquity:1.2, consumer:0.3, other:0.93, unfunded:2.5, tier:"Community+", note:"Expanded from $62.8M to $3.36B in single quarter." },
];

const INDUSTRY = { ndfiPctTier1:52, delinquency:0.14, qoqGrowth:7.3 };

const TIMELINE = [
  {year:"2010",value:56},{year:"2011",value:78},{year:"2012",value:105},{year:"2013",value:140},
  {year:"2014",value:182},{year:"2015",value:230},{year:"2016",value:285},{year:"2017",value:348},
  {year:"2018",value:420},{year:"2019",value:505},{year:"2020",value:580},{year:"2021",value:720},
  {year:"2022",value:870},{year:"2023",value:1020},{year:"2024",value:1156},{year:"Q4'25",value:1570},
];

const EVENTS = [
  {year:"2010",label:"FDIC begins tracking"},{year:"2013",label:"Leveraged lending guidance issued"},
  {year:"2022",label:"Fed raises rates 525bps"},{year:"2024",label:"New Call Report subcategories"},
  {year:"Q4'25",label:"Leveraged lending guidance rescinded"},
];

const CATEGORIES = [
  {key:"mortgage",label:"Mortgage Credit",color:"#5B8C6E"},
  {key:"businessCredit",label:"Business Credit",color:"#7BA3C9"},
  {key:"privateEquity",label:"Private Equity",color:"#D4A054"},
  {key:"consumer",label:"Consumer Credit",color:"#A893D4"},
  {key:"other",label:"Other / Unspecified",color:"#999"},
];

const SOURCES = [
  {name:"FDIC Call Reports (FFIEC 031/041)",schedule:"Schedule RC-C, Part I, Item 9.a & Memo Item 10",desc:"Primary source. Banks file quarterly. Since Q4 2024, banks with >$10B assets must break NDFI loans into 5 subcategories.",url:"https://cdr.ffiec.gov/public/",urlLabel:"FFIEC Central Data Repository"},
  {name:"FDIC Banking Issues in Focus",schedule:"February 2026 Report",desc:"Comprehensive analysis of NDFI lending trends, concentration risks, and bank-NDFI interconnections.",url:"https://www.fdic.gov/analysis/bank-lending-nondepository-financial-institutions.pdf",urlLabel:"FDIC NDFI Report (PDF)"},
  {name:"Federal Reserve Form Y-14",schedule:"Y-14Q Schedule H (Counterparty)",desc:"Confidential. Filed by ~35 largest BHCs. Captures counterparty credit risk including private credit fund exposures. Shows $123B committed as of year-end 2024.",url:"https://www.federalreserve.gov/apps/reportingforms/Report/Index/FR_Y-14Q",urlLabel:"FR Y-14Q Form"},
  {name:"SEC Form PF",schedule:"Question 47 (Borrowings)",desc:"Filed by private fund advisers with >$150M AUM. Fund-side view of bank borrowings. OFR's March 2026 brief noted reported borrowings may understate actual exposure.",url:"https://www.sec.gov/divisions/investment/pfrd/pf-instructions.pdf",urlLabel:"SEC Form PF Instructions"},
  {name:"FDIC Risk Review 2025",schedule:"NDFI Lending & Private Credit",desc:"Annual supervisory review covering NDFI growth trends, private credit characteristics, and systemic risk.",url:"https://www.fdic.gov/analysis/2025-risk-review.pdf",urlLabel:"2025 Risk Review (PDF)"},
  {name:"S&P Global Market Intelligence",schedule:"Quarterly NDFI Reports",desc:"Bank-level NDFI data from Call Reports. Tracks top 20 lenders, subcategories, growth rates, and delinquency.",url:"https://www.spglobal.com/market-intelligence/en/news-insights/articles/2026/2/us-banks-ndfi-lending-pace-reaccelerates-in-q4-2025-98612159",urlLabel:"Q4 2025 NDFI Report"},
  {name:"OFR Brief 26-02",schedule:"March 2026",desc:"Measures counterparty exposures using Y-14, SEC Form PF, and Moody's data. Flags undercount in bank-reported figures.",url:"https://www.financialresearch.gov/briefs/2026/03/12/measuring-counterparty-exposures-private-credit/",urlLabel:"OFR Brief 26-02"},
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n,d=1) => n>=1000?`$${(n/1000).toFixed(d)}T`:`$${n.toFixed(d)}B`;
const fmtPct = (n,d=2) => `${n.toFixed(d)}%`;
const fmtGrowth = (n) => n>100?'N/M':n>0?`+${n.toFixed(1)}%`:`${n.toFixed(1)}%`;

const TABS = [
  {id:"overview",label:"Overview",icon:"◉"},{id:"table",label:"Table",icon:"≡"},
  {id:"ranking",label:"Rank",icon:"▊"},{id:"mix",label:"Mix",icon:"◫"},
  {id:"risk",label:"Risk",icon:"◈"},{id:"guide",label:"Guide",icon:"?"},
  {id:"learn",label:"Learn",icon:"⊞"},
];

// ─── EDUCATIONAL CONTENT ─────────────────────────────────────────────────────
const METRIC_EDUCATION = {
  totalNdfi: {
    label: "Total NDFI Loans",
    value: "$1.57T",
    what: "The total dollar value of loans that U.S. commercial banks have extended to non-depository financial institutions as of the end of 2025. This is the headline number — the aggregate size of the pipeline between traditional banking and the shadow lending system. At $1.57 trillion, it exceeds the GDP of most countries and represents one of the fastest-growing loan categories on bank balance sheets.",
    risk: "The sheer size creates concentration risk at the system level. If a broad repricing of private credit assets occurs — triggered by rising defaults in leveraged lending, commercial real estate stress, or a liquidity crisis in mortgage markets — banks collectively holding $1.57T in NDFI exposure have limited ability to reduce that position quickly. NDFI loans are not liquid instruments. They cannot be sold easily in a stressed market, meaning banks may be forced to hold deteriorating assets while simultaneously facing deposit pressure or capital calls elsewhere.",
  },
  cagr: {
    label: "15-Year CAGR",
    value: "21.9%",
    what: "Compound annual growth rate measures how fast NDFI lending has grown on average each year since 2010. At 21.9%, this category has roughly doubled every 3.5 years — far outpacing GDP growth, inflation, and most traditional loan categories. It signals that banks have been systematically increasing their dependence on — and exposure to — the non-bank lending sector.",
    risk: "Sustained exponential growth in any asset category is historically a warning sign. The S&L crisis, the 2008 mortgage collapse, and the 2023 regional bank failures were all preceded by extended periods of rapid loan growth in a single category. Growth at this rate also means the regulatory framework has almost certainly not kept pace — supervisory tools, stress test scenarios, and capital requirements were calibrated for a smaller, slower-growing NDFI sector. The faster a category grows, the less historical data exists to model its behavior in a severe downturn.",
  },
  tier1All: {
    label: "NDFI / Tier 1 (All Banks)",
    value: "52%",
    what: "Tier 1 capital is a bank's highest-quality capital buffer — the equity and retained earnings that absorb losses before a bank becomes insolvent. This metric expresses total NDFI lending as a percentage of that buffer across all 21 banks. At 52%, the industry has lent the equivalent of more than half its core capital cushion into the non-bank lending system. The higher this ratio, the less buffer exists if NDFI borrowers default at scale.",
    risk: "A 52% ratio means that if NDFI loans experienced a loss rate of even 10–15% — not unprecedented in a credit cycle downturn — the resulting losses would consume 5–8% of industry Tier 1 capital. That would push several banks toward regulatory minimums simultaneously, potentially triggering supervisory intervention, dividend cuts, or emergency capital raises at a moment when markets are already stressed. The feedback loop between bank capital stress and NDFI borrower stress could be self-reinforcing.",
  },
  tier1Large: {
    label: "NDFI / Tier 1 (>$100B Banks)",
    value: "68%",
    what: "The same Tier 1 ratio calculated only for banks with assets exceeding $100 billion. Large banks show significantly higher NDFI concentration — 68% versus 52% industry-wide — reflecting their deeper relationships with large private credit funds, mortgage REITs, and other institutional NDFIs. These are also the banks whose failure would carry the greatest systemic consequences.",
    risk: "Large banks are subject to enhanced prudential standards precisely because their failure carries systemic consequences. A 68% Tier 1 ratio at these institutions means the too-big-to-fail banks are also the most exposed to NDFI stress. In a severe scenario, federal intervention — emergency lending facilities, regulatory forbearance, or direct support — could again become necessary, repeating the moral hazard dynamic last seen in 2008. Taxpayer exposure, while not guaranteed, becomes a relevant tail risk at these concentration levels.",
  },
  delinquency: {
    label: "Delinquency Rate",
    value: "0.14%",
    what: "The share of NDFI loans that are 30 or more days past due. At 0.14%, current delinquency is very low by historical standards — suggesting NDFI borrowers are, for now, meeting their obligations. However, NDFI delinquencies tend to spike suddenly rather than build gradually, because many NDFIs are themselves leveraged lenders whose stress can materialize quickly when their underlying borrowers default.",
    risk: "Low current delinquency can create a false sense of security. NDFI portfolios have never been stress-tested through a full credit cycle at this scale. Many of the underlying loans that NDFIs have made — leveraged buyout debt, bridge loans, consumer subprime — are themselves vulnerable to rate sensitivity and economic slowdown. When NDFI borrowers begin defaulting, bank delinquency rates can move from near-zero to crisis levels within two to three quarters, leaving little time for orderly risk reduction. The 0.14% figure reflects today's environment, not tomorrow's.",
  },
  unfunded: {
    label: "Unfunded Commitments",
    value: "$987B",
    what: "Beyond the $1.57T already lent, banks have committed to lend an additional $987 billion to NDFIs on demand — credit lines, revolving facilities, and loan commitments that haven't been drawn yet. This shadow exposure is nearly as large as the funded book. If NDFI borrowers draw on these commitments simultaneously during a stress event, bank balance sheets could expand rapidly at precisely the wrong moment.",
    risk: "Unfunded commitments are the most underappreciated risk in this dataset. In normal times, credit lines are drawn gradually and repaid routinely. In a stress scenario, the dynamic reverses: NDFIs facing liquidity pressure draw on every available credit facility simultaneously, while banks are simultaneously less able to absorb the balance sheet expansion. This is sometimes called a 'double whammy' — loan losses on the funded book arrive at the same time as forced balance sheet growth from commitment draws. The $987B represents potential rapid balance sheet expansion of up to 63% on top of current funded exposure.",
  },
  top10Share: {
    label: "Top 10 Share",
    value: "71%",
    what: "The ten largest NDFI lenders account for 71% of all exposure. This concentration means the risk is not evenly distributed — a handful of institutions are disproportionately connected to the non-bank lending system. It also means that stress at one or two large banks could have outsized effects on NDFI borrowers' ability to fund their operations.",
    risk: "High concentration among a small number of lenders creates interconnection risk that is difficult to model. If the two or three largest NDFI lenders simultaneously tighten credit — whether due to regulatory pressure, capital constraints, or risk appetite changes — NDFIs that depend on those relationships could face sudden funding gaps. Unlike diversified borrowers who can seek alternative credit sources, many large NDFIs have highly customized facilities with specific banks that are not easily replaced. A pullback by a single top-10 lender could trigger liquidity stress across multiple NDFI counterparties simultaneously.",
  },
  qoqGrowth: {
    label: "Q4 QoQ Growth",
    value: "+7.3%",
    what: "Quarter-over-quarter growth measures how much NDFI lending expanded in just the last three months of 2025. Adding $129.7 billion in a single quarter — equivalent to the entire NDFI book in 2015 — indicates that growth is not slowing. Sustained high QoQ growth is a leading indicator worth monitoring: it suggests appetite on both sides of the trade remains strong even as the aggregate exposure reaches historically unprecedented levels.",
    risk: "Accelerating growth late in a credit cycle is a classic precursor to credit quality deterioration. As the most creditworthy NDFI borrowers reach their borrowing capacity, banks seeking continued growth may extend credit to progressively weaker counterparties — a dynamic known as 'reaching for yield' or standards erosion. The $129.7B added in a single quarter also means that a meaningful portion of the current book has never experienced a full credit cycle. Loans originated in 2024–2025 under benign conditions may perform very differently when rates stay elevated, asset valuations fall, or investor appetite for private credit products reverses.",
  },
};

// ─── BOTTOM SHEET MODAL ───────────────────────────────────────────────────────
const BottomSheet = ({content, onClose}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  if (!content) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:768,margin:"0 auto",background:"#141410",borderRadius:"16px 16px 0 0",border:"1px solid #333",borderBottom:"none",maxHeight:"80vh",overflowY:"auto",padding:"20px 20px 40px"}}>
        <div style={{width:40,height:4,background:"#444",borderRadius:2,margin:"0 auto 20px"}} />
        <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:S.mono,marginBottom:4}}>{content.label}</div>
        <div style={{fontSize:28,fontWeight:700,color:"#e0e0e0",fontFamily:S.mono,marginBottom:16}}>{content.value}</div>
        <div style={{fontSize:14,color:"#bbb",lineHeight:1.75,fontFamily:S.ff,marginBottom:20}}>{content.what}</div>
        <div style={{background:"#1a1108",border:"1px solid #3a2a10",borderLeft:"3px solid #D4A054",borderRadius:6,padding:"14px 16px"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#D4A054",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,fontFamily:S.mono}}>Risk Considerations</div>
          <div style={{fontSize:13,color:"#bbb",lineHeight:1.75,fontFamily:S.ff}}>{content.risk}</div>
        </div>
        <button onClick={onClose} style={{marginTop:20,width:"100%",padding:"14px",background:"#222",border:"1px solid #444",color:"#aaa",fontSize:14,borderRadius:8,cursor:"pointer",fontFamily:S.ff}}>Close</button>
      </div>
    </div>
  );
};

// ─── TITLE MODAL ──────────────────────────────────────────────────────────────
const TITLE_EDUCATION = {
  label: "About This Tracker",
  value: "NDFI Exposure Tracker",
  what: "Non-depository financial institutions (NDFIs) are lenders that don't take deposits — mortgage companies, private credit funds, consumer finance companies, and others. They depend heavily on borrowing from traditional banks to fund their own lending.\n\nThis tracker measures how exposed America's largest commercial banks are to that system — how much they've lent to NDFIs, what types, and whether that exposure represents a meaningful risk to their capital position.\n\nWhen NDFI borrowers run into trouble, the banks behind them feel it. Understanding this web of lending is central to understanding where the next stress in the financial system might emerge.",
  risk: "NDFI lending has grown at a 21.9% compound annual rate over 15 years — far outpacing traditional loan categories. Regulators are paying close attention. In December 2025, the FDIC and OCC rescinded the 2013 Interagency Guidance on Leveraged Lending — removing a key guardrail at precisely the moment when exposure is at an all-time high. This tracker puts that data in one place.",
};


const BANNER_H = 76;
const NAV_H = 56;
const S = { ff:"'IBM Plex Sans',sans-serif", mono:"'IBM Plex Mono',monospace" };

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
const CustomTooltip = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return (
    <div style={{background:"#1a1a1a",border:"1px solid #333",padding:"8px 12px",fontSize:13,color:"#ccc",borderRadius:4}}>
      <div style={{color:"#e0e0e0",fontWeight:600,marginBottom:4}}>{label}</div>
      {payload.map((p,i)=>(<div key={i} style={{color:p.color||"#ccc"}}>{p.name}: {typeof p.value==="number"?(p.value>=1?`$${p.value.toFixed(1)}B`:`$${(p.value*1000).toFixed(0)}M`):p.value}</div>))}
    </div>
  );
};

// ─── BULLET CHART ────────────────────────────────────────────────────────────
const BulletChart = ({value,target,ranges,label,unit=""}) => {
  const max=ranges[2]; const cv=Math.min(value,max);
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:13,color:"#bbb",fontFamily:S.ff}}>{label}</span>
        <span style={{fontSize:14,color:"#e0e0e0",fontWeight:600,fontFamily:S.mono}}>{value>100?'N/M':`${value}${unit}`}</span>
      </div>
      <div style={{position:"relative",height:22,background:"#1a1a1a",borderRadius:3,overflow:"hidden"}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(ranges[0]/max)*100}%`,background:"#1a3a1a"}} />
        <div style={{position:"absolute",left:`${(ranges[0]/max)*100}%`,top:0,height:"100%",width:`${((ranges[1]-ranges[0])/max)*100}%`,background:"#3a3018"}} />
        <div style={{position:"absolute",left:`${(ranges[1]/max)*100}%`,top:0,height:"100%",width:`${((ranges[2]-ranges[1])/max)*100}%`,background:"#3a1818"}} />
        {value<=100&&<div style={{position:"absolute",left:0,top:6,height:10,width:`${(cv/max)*100}%`,background:"#6AADEE",borderRadius:2}} />}
        {target!=null&&<div style={{position:"absolute",left:`${(Math.min(target,max)/max)*100}%`,top:1,width:3,height:20,background:"#fff",borderRadius:1}} />}
      </div>
    </div>
  );
};

// ─── SECTION HEADER (sticky within scroll) ───────────────────────────────────
const SectionHeader = ({children}) => (
  <div style={{position:"sticky",top:0,zIndex:5,background:"#0d0d0d",borderBottom:"1px solid #222",padding:"14px 16px 12px",boxShadow:"0 2px 8px rgba(0,0,0,0.5)"}}>
    {children}
  </div>
);

// ─── TAB: OVERVIEW ───────────────────────────────────────────────────────────
const OverviewView = () => {
  const [sheet, setSheet] = useState(null);
  const stats = [
    {label:"Total NDFI Loans",value:"$1.57T",sub:"Q4 2025",edu:METRIC_EDUCATION.totalNdfi},
    {label:"15-Year CAGR",value:"21.9%",sub:"Since Q1 2010",edu:METRIC_EDUCATION.cagr},
    {label:"NDFI / Tier 1 (All)",value:"52%",sub:"All banks",edu:METRIC_EDUCATION.tier1All},
    {label:"NDFI / Tier 1 (>$100B)",value:"68%",sub:"Large banks",edu:METRIC_EDUCATION.tier1Large},
    {label:"Delinquency Rate",value:"0.14%",sub:"Industry-wide",edu:METRIC_EDUCATION.delinquency},
    {label:"Unfunded Commitments",value:"$987B",sub:"42.9% of total",edu:METRIC_EDUCATION.unfunded},
    {label:"Top 10 Share",value:"71%",sub:"Of total NDFI",edu:METRIC_EDUCATION.top10Share},
    {label:"Q4 QoQ Growth",value:"+7.3%",sub:"+$129.7B in quarter",edu:METRIC_EDUCATION.qoqGrowth},
  ];
  return (
    <>
      {sheet && <BottomSheet content={sheet} onClose={()=>setSheet(null)} />}
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Industry Overview</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 0",fontFamily:S.mono}}>U.S. Bank NDFI Exposure · Q4 2025 · <span style={{color:"#D4A054"}}>Tap any metric to learn more</span></p>
      </SectionHeader>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:"#222",padding:1}}>
        {stats.map((s,i)=>(
          <div key={i} onClick={()=>setSheet(s.edu)} style={{background:"#111",padding:"16px 14px",cursor:"pointer",position:"relative",WebkitTapHighlightColor:"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="#161612"}
            onMouseLeave={e=>e.currentTarget.style.background="#111"}>
            <div style={{fontSize:11,color:"#888",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5,fontFamily:S.ff}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:700,color:"#e0e0e0",fontFamily:S.mono,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,color:"#666",marginTop:5,fontFamily:S.mono}}>{s.sub}</div>
            <div style={{position:"absolute",top:8,right:8,width:16,height:16,borderRadius:"50%",background:"#2a2218",border:"1px solid #D4A054",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#D4A054",fontWeight:700}}>i</div>
          </div>
        ))}
      </div>
      <div style={{padding:16}}>
        <div style={{fontSize:13,color:"#aaa",marginBottom:8,fontFamily:S.ff,fontWeight:600}}>NDFI Growth: $56B → $1.57T (2010–2025)</div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={TIMELINE} margin={{left:0,right:10,top:10,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="year" tick={{fill:"#777",fontSize:11,fontFamily:S.mono}} axisLine={{stroke:"#333"}} tickLine={false} interval={2} />
            <YAxis tick={{fill:"#777",fontSize:11,fontFamily:S.mono}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}T`:`${v}B`} />
            <Tooltip content={({active,payload,label})=>{
              if(!active||!payload?.length)return null;
              const ev=EVENTS.find(e=>e.year===label);
              return(<div style={{background:"#1a1a1a",border:"1px solid #333",padding:"8px 12px",fontSize:13,color:"#ccc",borderRadius:4}}><div style={{fontWeight:600}}>{label}: {fmt(payload[0].value)}</div>{ev&&<div style={{color:"#D4A054",fontSize:12,marginTop:4}}>↳ {ev.label}</div>}</div>);
            }} />
            <Line type="monotone" dataKey="value" stroke="#6AADEE" strokeWidth={2} dot={false} />
            {EVENTS.map(e=><ReferenceLine key={e.year} x={e.year} stroke="#333" strokeDasharray="3 3" />)}
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{marginTop:8,display:"flex",flexWrap:"wrap",gap:10}}>
          {EVENTS.map(e=>(<span key={e.year} style={{fontSize:11,color:"#777",fontFamily:S.mono}}><span style={{color:"#999"}}>{e.year}:</span> {e.label}</span>))}
        </div>
      </div>
      <div style={{padding:"14px 16px",borderTop:"1px solid #222"}}>
        <div style={{fontSize:13,color:"#999",lineHeight:1.7,fontFamily:S.ff}}>
          <strong style={{color:"#D4A054"}}>Context:</strong> In Q4 2025, NDFI loans grew $129.7B while all other loan categories combined grew just $31.4B. The FDIC and OCC rescinded the 2013 Interagency Guidance on Leveraged Lending in December 2025. As of April 2026, the Federal Reserve is actively querying major banks about their private credit exposure.
        </div>
      </div>
      <div style={{padding:"24px 16px 28px",borderTop:"1px solid #222",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:S.mono}}>Sponsored by</div>
        <a href="https://nypay.org" target="_blank" rel="noopener noreferrer" style={{display:"block"}}>
          <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSIwIDAgMjc1IDI3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxjbGlwUGF0aCBpZD0iY2xpcFBhdGgyOTk5IiBjbGlwUGF0aFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CiAgICAgIDxwYXRoIGlkPSJwYXRoMzAwMSIgZD0iTSAwLDI0Ni44NjEgSCA0MzIgViAwIEggMCBaIi8+CiAgICA8L2NsaXBQYXRoPgogIDwvZGVmcz4KICA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxLjI1LCAwLCAwLCAtMS4yNSwgLTE0Mi45NTE3MjIsIDI4MC42NzUyOTQpIiBpZD0iZzI5OTMiPgogICAgPGcgaWQ9ImcyOTk1Ij4KICAgICAgPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoMjk5OSkiIGlkPSJnMjk5NyI+CiAgICAgICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTQ0LjgwMTgsMTAxLjc4ODEpIiBpZD0iZzMwMDMiPgogICAgICAgICAgPHBhdGggaWQ9InBhdGgzMDA1IiBzdHlsZT0iZmlsbDojNTg1OTViO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpub256ZXJvO3N0cm9rZTpub25lIiBkPSJtIDAsMCAtMC40NTgsLTAuMjg4IGMgLTcuNDc5LC0xMi4zMzcgLTEyLjE2OCwtMjMuNTcxIC0xMy4zNzQsLTMyLjE5NiAxLjMzNCwwLjIzOCAyLjY1LDAuNTYgMy45NzksMC45NDMgQyAtMTAuMzMxLC0yNC40MiAtNi45NjMsLTEyLjE1IDAsMCIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxODIuODYwNCwxNDguNzM2MykiIGlkPSJnMzAwNyI+CiAgICAgICAgICA8cGF0aCBpZD0icGF0aDMwMDkiIHN0eWxlPSJmaWxsOiM1ODU5NWI7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOm5vbmUiIGQ9Im0gMCwwIGMgMC4zMDYsLTAuMTc1IDAuNDM5LDAuNDggMC43MzcsMC4yOTIgMTkuNDk3LDE4LjYxMyAzOC44OSwyOS42NyA1MC42OTYsMzAuNzAzIC0wLjIyNywwLjk3NyAtMC4zNTUsMS45OCAtMC40MjgsMi45ODcgQyAzNy40ODEsMzAuMjY4IDE4LjczNywxNy45NjYgMCwwIi8+CiAgICAgICAgPC9nPgogICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDE0OS41OTg2LDExNS40ODkzKSIgaWQ9ImczMDExIj4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAxMyIgc3R5bGU9ImZpbGw6IzFjNzViYztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgLTAuNTQyLDkuODY4IHYgMTMuNzggSCAxMy4wNTkgViAtMTkuNjgxIEggLTAuMjQgbCAtMTUuNDY2LDIzLjU5MSAwLjU0MSwtOS44NjggdiAtMTMuNzIzIGggLTEzLjYwMSB2IDQzLjMyOSBoIDEzLjMgeiIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxOTMuNzEwOSw5NS44MDg2KSIgaWQ9ImczMDE1Ij4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAxNyIgc3R5bGU9ImZpbGw6IzFjNzViYztmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgaCAtMTQuMjAzIHYgMTUuNzY5IGwgLTE2LjEyOCwyNy41NiBoIDE1Ljg4NyBMIC02Ljk4MiwyOC42NDYgMC40OCw0My4zMjkgSCAxNi4xMjcgTCAwLDE2LjAwOCBaIi8+CiAgICAgICAgPC9nPgogICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIyOS45Mzc1LDExOS4zOTk0KSIgaWQ9ImczMDE5Ij4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAyMSIgc3R5bGU9ImZpbGw6I2Y3OTQxZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0iTSAwLDAgQyAxLjY4NiwwIDMuMDYxLDAuMzcxIDQuMTI0LDEuMTEzIDUuMTg2LDEuODU1IDUuNzE4LDMuMTY4IDUuNzE4LDUuMDU2IDUuNzE4LDYuMDU4IDUuNDY3LDYuODYgNC45NjUsNy40NjMgNC40NjMsOC4wNjMgMy44MzIsOC41MjQgMy4wNyw4Ljg0NiAyLjMwOSw5LjE2NyAxLjQ4NSw5LjM3NyAwLjYwMyw5LjQ3OSAtMC4yOCw5LjU3OCAtMS4xMDQsOS42MjggLTEuODY0LDkuNjI4IEggLTUuODk2IFYgMCBaIE0gLTIwLjEsLTIzLjU5MSBWIDE5LjczOCBIIDAuNzgzIGMgNi4yMTgsMCAxMC44NTMsLTEuMzIzIDEzLjkwMywtMy45NzIgMy4wNDcsLTIuNjQ3IDQuNTcyLC02LjE5OCA0LjU3MiwtMTAuNjUxIDAsLTIuMzI3IC0wLjM1MSwtNC40MzIgLTEuMDUzLC02LjMxOSBDIDE3LjUwMiwtMy4wOSAxNi40MDksLTQuNjkzIDE0LjkyNSwtNi4wMTkgMTMuNDQxLC03LjM0MiAxMS41NzQsLTguMzU1IDkuMzI4LC05LjA1NyA3LjA4MSwtOS43NTkgNC4zOTUsLTEwLjExIDEuMjY1LC0xMC4xMSBoIC03LjE2MSB2IC0xMy40ODEgeiIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNjUuMDgyLDEyNi4wODAxKSIgaWQ9ImczMDIzIj4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAyNSIgc3R5bGU9ImZpbGw6I2Y3OTQxZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0iTSAwLDAgLTQuMzkzLC0xNS41MjcgSCA0LjU3NCBaIE0gLTIyLjYyNywtMzAuMjcxIC03LjEsMTMuMDU4IEggNy4zNDMgTCAyMi44NjksLTMwLjI3MSBIIDguNzI3IGwgLTEuNjg1LDUuNzE2IEggLTcuMSBsIC0xLjYyNiwtNS43MTYgeiIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzMTEuMDYwNSw5NS44MDg2KSIgaWQ9ImczMDI3Ij4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAyOSIgc3R5bGU9ImZpbGw6I2Y3OTQxZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgaCAtMTQuMjAzIHYgMTUuNzY5IGwgLTE2LjEyNywyNy41NiBoIDE1Ljg4NyBMIC02Ljk4MSwyOC42NDYgMC40ODIsNDMuMzI5IEggMTYuMTI4IEwgMCwxNi4wMDggWiIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDYuNzk1OSw5Ni44NzAxKSIgaWQ9ImczMDMxIj4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAzMyIgc3R5bGU9ImZpbGw6IzU4NTk1YjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgYyAwLjEwNCwxLjg5NiAwLjA4MywzLjc5NSAwLjA3NCw1LjY4OSAtMjguNjMsLTMwLjY4NCAtNTkuMzE5LC00OC4yNiAtNjkuMDE4LC0zOS4zNSAtMS43NjUsMS42MjIgLTIuNzAyLDQuMDI1IC0yLjkwMyw3LjAzOCAtMS4zMjksLTAuMzgzIC0yLjY0NSwtMC43MDUgLTMuOTc5LC0wLjk0MyAtMC44OTEsLTYuMzcyIDAuMTA4LC0xMS4zMjUgMy4yODYsLTE0LjI0NiAxMC42OTUsLTkuODI5IDQyLjE5Miw2Ljc4OSA3Mi4zOTQsMzcuNDc2IEMgLTAuMTI5LC0yLjg5NCAtMC4wNzksLTEuNDQ4IDAsMCIvPgogICAgICAgIDwvZz4KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNDIuODc0LDE3Ny41MDQ5KSIgaWQ9ImczMDM1Ij4KICAgICAgICAgIDxwYXRoIGlkPSJwYXRoMzAzNyIgc3R5bGU9ImZpbGw6IzU4NTk1YjtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6bm9uemVybztzdHJva2U6bm9uZSIgZD0ibSAwLDAgYyA1Ljc1LC01LjI4NCAyLjgzNywtMTguNzEyIC02LjM1LC0zNS4yNTEgMi4yMDgsLTAuNzY1IDQuNDY3LC0xLjM1NSA2LjY3OSwtMi4wMzcgQyAxMC44MTEsLTE4LjMxMyAxNC4wMDUsLTIuNjk0IDcuMTgxLDMuNTc4IDMuNzE4LDYuNzYxIC0xLjkzNSw3LjE1NiAtOS4wMDksNS4yMTQgLTguOTM2LDQuMjA2IC04LjgwOCwzLjIwMyAtOC41ODEsMi4yMjcgLTQuOTU1LDIuNTQzIC0yLjAxOCwxLjg1MyAwLDAiLz4KICAgICAgICA8L2c+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==" alt="NYPAY" style={{height:48,width:"auto"}} />
        </a>
      </div>
      <div style={{padding:"16px 16px 28px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:"0.12em",fontFamily:S.mono}}>Support this project</div>
        <a href="https://buymeacoffee.com/dmgerbino" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",background:"#FFDD00",color:"#000",borderRadius:8,textDecoration:"none",fontFamily:S.ff,fontWeight:700,fontSize:14,border:"none",cursor:"pointer"}}>
          <span style={{fontSize:20,lineHeight:1}}>☕</span> Buy Me a Coffee
        </a>
      </div>
    </>
  );
};

// ─── TAB: TABLE ──────────────────────────────────────────────────────────────
// 7 columns: Bank + 6 metrics. Min width forces horizontal scroll on mobile.
const TABLE_MIN_W = 560;
const COL_EDUCATION = {
  ndfiTotal:   { label:"NDFI ($B)", title:"Total NDFI Loans", body:"The total funded dollar amount this bank has lent to non-depository financial institutions, in billions. Larger numbers indicate greater absolute exposure to the shadow lending system." },
  ndfiPctLoans:{ label:"%Loan",     title:"NDFI as % of Gross Loans", body:"NDFI lending expressed as a share of the bank's entire loan portfolio. A high percentage means NDFIs dominate the balance sheet — the bank is deeply tied to alternative lenders relative to its other lending activities." },
  ndfiPctTier1:{ label:"%T1",       title:"NDFI as % of Tier 1 Capital", body:"NDFI lending as a share of the bank's core capital cushion. Tier 1 capital is the equity buffer that absorbs losses before insolvency. The higher this percentage, the more of that buffer is at risk if NDFI borrowers default." },
  qoqGrowth:   { label:"QoQ",       title:"Quarter-over-Quarter Growth", body:"How much this bank's NDFI lending grew from Q3 to Q4 2025. Rapid growth may indicate loosened underwriting standards or aggressive market-share pursuit. N/M means the growth rate is too large to be meaningful (e.g. Stifel expanded from near-zero)." },
  delinquency: { label:"Dlnq",      title:"NDFI Delinquency Rate", body:"The percentage of this bank's NDFI loans that are 30+ days past due. Industry-wide this is 0.14% — very low. Because many NDFI borrowers use payment-in-kind (PIK) structures to defer interest payments, reported delinquency may understate real stress." },
  unfunded:    { label:"Unfnd ($B)",title:"Unfunded Commitments", body:"Credit lines, revolving facilities, and loan commitments that haven't been drawn yet, in billions. These represent contingent exposure — if NDFI borrowers draw on these simultaneously during a stress event, bank balance sheets expand rapidly at the worst possible time." },
};

const DataTable = () => {
  const [sortKey,setSortKey] = useState("ndfiTotal");
  const [sortDir,setSortDir] = useState("desc");
  const [expanded,setExpanded] = useState(null);
  const [colTip,setColTip] = useState(null);
  const sorted = useMemo(()=>[...BANKS].sort((a,b)=>sortDir==="desc"?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]),[sortKey,sortDir]);
  const toggle = k => { if(sortKey===k) setSortDir(d=>d==="desc"?"asc":"desc"); else {setSortKey(k);setSortDir("desc");} };

  const H = ({k,children,align="right"}) => {
    const edu = COL_EDUCATION[k];
    return (
      <div style={{textAlign:align,padding:"10px 4px",userSelect:"none",fontSize:11,fontWeight:700,color:sortKey===k?"#D4A054":"#999",whiteSpace:"nowrap",fontFamily:S.mono,display:"flex",alignItems:"center",justifyContent:align==="left"?"flex-start":"flex-end",gap:3}}>
        <span onClick={()=>toggle(k)} style={{cursor:"pointer"}}>{children}{sortKey===k?(sortDir==="desc"?" ↓":" ↑"):""}</span>
        {edu&&<span onClick={e=>{e.stopPropagation();setColTip(edu);}} style={{width:13,height:13,borderRadius:"50%",background:"#2a2218",border:"1px solid #554020",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#D4A054",cursor:"pointer",fontWeight:700,flexShrink:0}}>i</span>}
      </div>
    );
  };

  return (
    <>
      {colTip&&(
        <div onClick={()=>setColTip(null)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end"}}>
          <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:768,margin:"0 auto",background:"#141410",borderRadius:"16px 16px 0 0",border:"1px solid #333",borderBottom:"none",padding:"20px 20px 36px"}}>
            <div style={{width:40,height:4,background:"#444",borderRadius:2,margin:"0 auto 16px"}} />
            <div style={{fontSize:12,color:"#888",textTransform:"uppercase",letterSpacing:"0.1em",fontFamily:S.mono,marginBottom:4}}>Column Definition</div>
            <div style={{fontSize:20,fontWeight:700,color:"#e0e0e0",fontFamily:S.ff,marginBottom:12}}>{colTip.title}</div>
            <div style={{fontSize:14,color:"#bbb",lineHeight:1.75,fontFamily:S.ff,marginBottom:16}}>{colTip.body}</div>
            <button onClick={()=>setColTip(null)} style={{width:"100%",padding:"13px",background:"#222",border:"1px solid #444",color:"#aaa",fontSize:14,borderRadius:8,cursor:"pointer",fontFamily:S.ff}}>Close</button>
          </div>
        </div>
      )}
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Bank-Level NDFI Exposure</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 0",fontFamily:S.mono}}>Q4 2025 · Tap row to expand · <span style={{color:"#D4A054"}}>Swipe table right for more →</span></p>
      </SectionHeader>

      {/* Scrollable table wrapper with fade affordance */}
      <div style={{position:"relative"}}>
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          <div style={{minWidth:TABLE_MIN_W}}>
            {/* Sticky column header row */}
            <div style={{display:"grid",gridTemplateColumns:"minmax(100px,1.4fr) 62px 58px 58px 54px 54px 66px",padding:"0 16px",borderBottom:"2px solid #333",background:"#0d0d0d",position:"sticky",top:0,zIndex:4}}>
              <H k="name" align="left">Bank</H>
              <H k="ndfiTotal">NDFI</H>
              <H k="ndfiPctLoans">%Loan</H>
              <H k="ndfiPctTier1">%T1</H>
              <H k="qoqGrowth">QoQ</H>
              <H k="delinquency">Dlnq</H>
              <H k="unfunded">Unfnd</H>
            </div>
            {sorted.map((b,i)=>(
              <div key={b.id}>
                <div onClick={()=>setExpanded(expanded===b.id?null:b.id)} style={{display:"grid",gridTemplateColumns:"minmax(100px,1.4fr) 62px 58px 58px 54px 54px 66px",cursor:"pointer",background:expanded===b.id?"#1a1a16":i%2===0?"#111":"#0d0d0d",padding:"0 16px",borderBottom:"1px solid #1a1a1a",alignItems:"center",minHeight:48}}>
                  <div style={{padding:"12px 4px 12px 0",color:"#ddd",fontWeight:600,fontFamily:S.ff,fontSize:14,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    <span style={{color:"#666",fontSize:10,marginRight:4}}>{expanded===b.id?"▾":"▸"}</span>{b.short}
                  </div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:"#e0e0e0",fontWeight:700,fontFamily:S.mono,fontSize:13}}>{b.ndfiTotal.toFixed(1)}</div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:b.ndfiPctLoans>15?"#D4A054":"#ccc",fontFamily:S.mono,fontSize:13}}>{fmtPct(b.ndfiPctLoans,1)}</div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:b.ndfiPctTier1>70?"#e05555":b.ndfiPctTier1>50?"#D4A054":"#ccc",fontFamily:S.mono,fontSize:13}}>{fmtPct(b.ndfiPctTier1,1)}</div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:b.qoqGrowth>10&&b.qoqGrowth<=100?"#D4A054":b.qoqGrowth<0?"#5B8C6E":"#ccc",fontFamily:S.mono,fontSize:13}}>{fmtGrowth(b.qoqGrowth)}</div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:b.delinquency>0.15?"#D4A054":"#ccc",fontFamily:S.mono,fontSize:13}}>{fmtPct(b.delinquency)}</div>
                  <div style={{padding:"12px 4px",textAlign:"right",color:"#aaa",fontFamily:S.mono,fontSize:13}}>{b.unfunded?`${b.unfunded.toFixed(1)}`:"—"}</div>
                </div>
                {expanded===b.id&&(
                  <div style={{background:"#151512",padding:"14px 16px",borderBottom:"1px solid #252520",minWidth:TABLE_MIN_W}}>
                    <div style={{fontSize:15,fontWeight:700,color:"#e0e0e0",marginBottom:4,fontFamily:S.ff}}>{b.name}</div>
                    <div style={{fontSize:13,color:"#D4A054",marginBottom:10,fontFamily:S.mono}}>{b.ticker}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12,fontSize:13}}>
                      <div><span style={{color:"#777"}}>Assets:</span> <span style={{color:"#ccc"}}>{fmt(b.totalAssets)}</span></div>
                      <div><span style={{color:"#777"}}>Unfunded:</span> <span style={{color:"#ccc"}}>{fmt(b.unfunded)}</span></div>
                      <div><span style={{color:"#777"}}>Total Committed:</span> <span style={{color:"#ccc"}}>{fmt(b.ndfiTotal+b.unfunded)}</span></div>
                      <div><span style={{color:"#777"}}>Tier:</span> <span style={{color:"#ccc"}}>{b.tier}</span></div>
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:"#bbb",marginBottom:8}}>NDFI Subcategories (RC-C Memo 10)</div>
                    {CATEGORIES.map(c=>{const val=b[c.key];const pct=b.ndfiTotal>0?(val/b.ndfiTotal*100):0;return(
                      <div key={c.key} style={{display:"flex",alignItems:"center",marginBottom:5}}>
                        <div style={{width:10,height:10,borderRadius:2,background:c.color,marginRight:10,flexShrink:0}} />
                        <div style={{flex:1,color:"#aaa",fontSize:13}}>{c.label}</div>
                        <div style={{width:72,textAlign:"right",color:"#ccc",fontFamily:S.mono,fontSize:13}}>${val.toFixed(1)}B</div>
                        <div style={{width:48,textAlign:"right",color:"#888",fontFamily:S.mono,fontSize:13}}>{pct.toFixed(0)}%</div>
                      </div>
                    );})}
                    {b.note&&<div style={{fontSize:13,color:"#D4A054",fontStyle:"italic",borderTop:"1px solid #252520",paddingTop:10,marginTop:8}}>⚠ {b.note}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Right-edge fade gradient scroll affordance */}
        <div style={{position:"absolute",top:0,right:0,bottom:0,width:48,background:"linear-gradient(to right, transparent, #0d0d0d)",pointerEvents:"none",zIndex:3}} />
      </div>
    </>
  );
};

// ─── TAB: RANKING ────────────────────────────────────────────────────────────
const RankingView = () => {
  const [metric,setMetric] = useState("ndfiTotal");
  const labels = {ndfiTotal:"Total NDFI ($B)",ndfiPctTier1:"% of Tier 1",ndfiPctLoans:"% of Loans",qoqGrowth:"QoQ Growth"};
  const data = useMemo(()=>[...BANKS].filter(b=>metric!=="qoqGrowth"||b.qoqGrowth<=100).sort((a,b)=>b[metric]-a[metric]).slice(0,15).map(b=>({name:b.short,funded:metric==="ndfiTotal"?b.ndfiTotal:b[metric],unfunded:metric==="ndfiTotal"?b.unfunded:0})),[metric]);
  const median = useMemo(()=>{const v=BANKS.map(b=>b[metric]).filter(x=>x<=100).sort((a,b)=>a-b);return v[Math.floor(v.length/2)];},[metric]);

  return (
    <>
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Exposure Rankings</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 8px",fontFamily:S.mono}}>Top 15 banks</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(labels).map(([k,v])=>(<button key={k} onClick={()=>setMetric(k)} style={{padding:"8px 14px",fontSize:12,border:"1px solid",borderColor:metric===k?"#D4A054":"#444",background:metric===k?"#2a2218":"transparent",color:metric===k?"#D4A054":"#999",borderRadius:4,cursor:"pointer",fontFamily:S.ff,fontWeight:600}}>{v}</button>))}
        </div>
        {metric==="ndfiTotal"&&(
          <div style={{display:"flex",gap:18,padding:"10px 0 0",fontSize:12,color:"#999"}}>
            <span><span style={{display:"inline-block",width:12,height:12,background:"#6AADEE",borderRadius:2,marginRight:5,verticalAlign:"middle"}} />Funded</span>
            <span><span style={{display:"inline-block",width:12,height:12,background:"#3a5570",borderRadius:2,marginRight:5,verticalAlign:"middle"}} />Unfunded</span>
          </div>
        )}
      </SectionHeader>
      <div style={{padding:"16px 8px 8px"}}>
        <ResponsiveContainer width="100%" height={Math.max(420,data.length*36)}>
          <BarChart data={data} layout="vertical" margin={{left:10,right:20,top:5,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis type="number" tick={{fill:"#888",fontSize:11,fontFamily:S.mono}} axisLine={{stroke:"#333"}} tickLine={false} />
            <YAxis dataKey="name" type="category" width={100} tick={{fill:"#ccc",fontSize:13,fontFamily:S.ff}} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {metric==="ndfiTotal"&&<ReferenceLine x={median} stroke="#555" strokeDasharray="4 4" />}
            <Bar dataKey="funded" stackId="a" fill="#6AADEE" radius={metric==="ndfiTotal"?[0,0,0,0]:[0,3,3,0]} name={metric==="ndfiTotal"?"Funded":labels[metric]} barSize={22} />
            {metric==="ndfiTotal"&&<Bar dataKey="unfunded" stackId="a" fill="#3a5570" radius={[0,3,3,0]} name="Unfunded" barSize={22} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
};

// ─── TAB: MIX ────────────────────────────────────────────────────────────────
const MixView = () => {
  const sorted = useMemo(()=>[...BANKS].sort((a,b)=>b.ndfiTotal-a.ndfiTotal),[]);
  return (
    <>
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Subcategory Concentration</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 8px",fontFamily:S.mono}}>RC-C Memo Item 10 breakdown</p>
        <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
          {CATEGORIES.map(c=>(<span key={c.key} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#bbb"}}><span style={{width:12,height:12,borderRadius:2,background:c.color}} />{c.label}</span>))}
        </div>
      </SectionHeader>
      <div style={{padding:"14px 16px"}}>
        {sorted.map(b=>{const total=b.ndfiTotal||1;const isAllOther=b.other===b.ndfiTotal;return(
          <div key={b.id} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:5}}>
              <span style={{fontSize:14,color:"#ddd",fontFamily:S.ff,fontWeight:600}}>{b.short}</span>
              <span style={{fontSize:13,color:"#888",fontFamily:S.mono}}>{fmt(b.ndfiTotal)}</span>
            </div>
            <div style={{display:"flex",height:24,borderRadius:4,overflow:"hidden",background:"#1a1a1a"}}>
              {CATEGORIES.map(c=>{const pct=(b[c.key]/total)*100;if(pct<0.5)return null;return <div key={c.key} style={{width:`${pct}%`,background:c.color}} />;})}
            </div>
            {isAllOther&&<div style={{fontSize:12,color:"#D4A054",fontStyle:"italic",marginTop:3}}>⚠ No subcategory breakdown reported</div>}
          </div>
        );})}
      </div>
    </>
  );
};

// ─── TAB: RISK ───────────────────────────────────────────────────────────────
const RiskView = ({goToTab}) => {
  const sorted = useMemo(()=>[...BANKS].sort((a,b)=>b.ndfiPctTier1-a.ndfiPctTier1),[]);
  return (
    <>
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Risk Metrics</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 8px",fontFamily:S.mono}}>Sorted by Tier 1 exposure</p>
        <div style={{display:"flex",gap:12,fontSize:12,color:"#999",flexWrap:"wrap",alignItems:"center"}}>
          <span><span style={{display:"inline-block",width:12,height:12,background:"#1a3a1a",borderRadius:2,marginRight:4,verticalAlign:"middle"}} />Low</span>
          <span><span style={{display:"inline-block",width:12,height:12,background:"#3a3018",borderRadius:2,marginRight:4,verticalAlign:"middle"}} />Moderate</span>
          <span><span style={{display:"inline-block",width:12,height:12,background:"#3a1818",borderRadius:2,marginRight:4,verticalAlign:"middle"}} />Elevated</span>
          <span><span style={{display:"inline-block",width:3,height:12,background:"#fff",marginRight:4,verticalAlign:"middle"}} />Industry Avg</span>
          <button onClick={()=>goToTab("guide")} style={{marginLeft:"auto",background:"transparent",border:"1px solid #D4A054",color:"#D4A054",fontSize:12,padding:"6px 12px",borderRadius:4,cursor:"pointer",fontFamily:S.ff,fontWeight:600}}>? How to read</button>
        </div>
      </SectionHeader>
      <div style={{padding:"14px 16px"}}>
        {sorted.map(b=>(
          <div key={b.id} style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid #1a1a1a"}}>
            <div style={{fontSize:15,color:"#ddd",fontWeight:700,marginBottom:10,fontFamily:S.ff}}>{b.short} <span style={{color:"#666",fontWeight:400,fontSize:13}}>{b.ticker}</span></div>
            <BulletChart value={b.ndfiPctTier1} target={INDUSTRY.ndfiPctTier1} ranges={[40,65,100]} label="NDFI / Tier 1 Capital" unit="%" />
            <BulletChart value={b.ndfiPctLoans} target={10} ranges={[8,20,50]} label="NDFI / Gross Loans" unit="%" />
            <BulletChart value={b.qoqGrowth} target={INDUSTRY.qoqGrowth} ranges={[5,12,35]} label="QoQ Growth" unit="%" />
            <BulletChart value={b.delinquency} target={INDUSTRY.delinquency} ranges={[0.10,0.18,0.30]} label="Delinquency Rate" unit="%" />
          </div>
        ))}
      </div>
    </>
  );
};

// ─── TAB: GUIDE (CONTEXTUAL) ─────────────────────────────────────────────────
const GuideView = ({goToTab}) => (
  <>
    <SectionHeader>
      <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Reading the Risk Metrics</h2>
      <p style={{fontSize:12,color:"#888",margin:"4px 0 0",fontFamily:S.mono}}>Specific to the NDFI Exposure Tracker</p>
    </SectionHeader>
    <div style={{padding:16}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:15,fontWeight:700,color:"#D4A054",marginBottom:10,fontFamily:S.ff}}>How the Charts Work</div>
        <div style={{background:"#151512",padding:16,borderRadius:6,border:"1px solid #252520",marginBottom:12}}>
          <BulletChart value={62} target={52} ranges={[40,65,100]} label="Example: NDFI / Tier 1 Capital" unit="%" />
        </div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.7,fontFamily:S.ff}}>
          Each chart shows one risk metric for a single bank. The <span style={{color:"#6AADEE",fontWeight:600}}>blue bar</span> is the bank's actual value. The <span style={{color:"#fff",fontWeight:600}}>white marker</span> is the industry average. The background bands show whether the value falls in a low, moderate, or elevated zone — specific to that metric's risk characteristics.
        </div>
      </div>

      <div style={{fontSize:15,fontWeight:700,color:"#D4A054",marginBottom:12,fontFamily:S.ff}}>The Four Risk Metrics</div>

      <div style={{padding:16,background:"#111",borderRadius:6,marginBottom:12,borderLeft:"3px solid #6AADEE"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:6}}>NDFI / Tier 1 Capital</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>
          How much of a bank's core capital cushion is consumed by NDFI lending. The industry average is 52%. Banks over $100B average 68%. A bank at 90%+ has nearly its entire capital buffer exposed to alternative lenders.
        </div>
        <div style={{fontSize:12,color:"#888",marginTop:8,fontFamily:S.mono}}>Low: below 40% · Moderate: 40–65% · Elevated: above 65%</div>
      </div>

      <div style={{padding:16,background:"#111",borderRadius:6,marginBottom:12,borderLeft:"3px solid #5B8C6E"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:6}}>NDFI / Gross Loans</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>
          What percentage of the bank's total loan book goes to NDFIs. The industry average is about 10%. Some custody banks like State Street exceed 45% because their loan books are small relative to their NDFI activity.
        </div>
        <div style={{fontSize:12,color:"#888",marginTop:8,fontFamily:S.mono}}>Low: below 8% · Moderate: 8–20% · Elevated: above 20%</div>
      </div>

      <div style={{padding:16,background:"#111",borderRadius:6,marginBottom:12,borderLeft:"3px solid #D4A054"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:6}}>QoQ Growth</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>
          How fast this bank grew its NDFI book in Q4 2025 compared to Q3. The industry average was 7.3%. Rapid growth (above 12%) may indicate loosened underwriting standards or aggressive market-share pursuit in the NDFI space.
        </div>
        <div style={{fontSize:12,color:"#888",marginTop:8,fontFamily:S.mono}}>Low: below 5% · Moderate: 5–12% · Elevated: above 12%</div>
      </div>

      <div style={{padding:16,background:"#111",borderRadius:6,marginBottom:12,borderLeft:"3px solid #A893D4"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:6}}>Delinquency Rate</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>
          What percentage of the bank's NDFI loans are past due. The industry average is 0.14% — extremely low. But because NDFI borrowers often use payment-in-kind (PIK) to defer interest, the reported delinquency may mask real stress. Any rate above 0.18% warrants attention.
        </div>
        <div style={{fontSize:12,color:"#888",marginTop:8,fontFamily:S.mono}}>Low: below 0.10% · Moderate: 0.10–0.18% · Elevated: above 0.18%</div>
      </div>

      <div style={{padding:16,background:"#111518",borderRadius:6,marginBottom:20,borderLeft:"3px solid #fff"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:6}}>The White Industry Average Marker</div>
        <div style={{fontSize:13,color:"#aaa",lineHeight:1.6}}>
          The vertical white line on each chart marks the industry-wide average for that metric. If a bank's blue bar extends past it, that bank has above-average exposure, growth, or delinquency relative to the industry. Below the line means the bank is below average on that dimension.
        </div>
      </div>

      <button onClick={()=>goToTab("risk")} style={{width:"100%",padding:"14px",background:"#2a2218",border:"1px solid #D4A054",color:"#D4A054",fontSize:14,fontWeight:700,borderRadius:4,cursor:"pointer",fontFamily:S.ff}}>← Back to Risk Metrics</button>
    </div>
  </>
);

// ─── TAB: LEARN & SOURCES (combined) ─────────────────────────────────────────
const LEARN_SECTIONS = [
  {
    id:"shadow",
    color:"#6AADEE",
    heading:"What is shadow banking?",
    body:"Shadow banking refers to credit intermediation that happens outside the traditional regulated banking system. Non-bank lenders — mortgage companies, private credit funds, consumer finance firms — perform many of the same functions as banks but without deposit insurance, Federal Reserve access, or the same capital requirements. The term 'shadow' refers to the opacity of these activities, not necessarily their legality.",
    links:[
      {label:"FSB Global Shadow Banking Report",url:"https://www.fsb.org/2024/12/global-monitoring-report-on-non-bank-financial-intermediation-2024/"},
      {label:"Federal Reserve: Nonbank Financial Institutions",url:"https://www.federalreserve.gov/releases/z1/"},
      {label:"IMF: Shadow Banking Around the Globe",url:"https://www.imf.org/external/pubs/ft/sdn/2014/sdn1408.pdf"},
    ]
  },
  {
    id:"why",
    color:"#D4A054",
    heading:"Why does bank-to-NDFI lending matter?",
    body:"Banks and shadow lenders are deeply interconnected. NDFIs borrow from banks to fund their own lending — creating a chain of leverage that traditional regulatory metrics don't fully capture. When NDFIs run into trouble, the credit lines they drew from banks become losses on bank balance sheets. This was a key transmission mechanism in the 2008 financial crisis, and regulators are watching the same dynamic build again at larger scale.",
    links:[
      {label:"OFR Brief 26-02: Measuring Counterparty Exposures",url:"https://www.financialresearch.gov/briefs/2026/03/12/measuring-counterparty-exposures-private-credit/"},
      {label:"FDIC Banking Issues in Focus (Feb 2026)",url:"https://www.fdic.gov/analysis/bank-lending-nondepository-financial-institutions.pdf"},
      {label:"BIS Working Paper: Banks and Shadow Banks",url:"https://www.bis.org/publ/work924.htm"},
    ]
  },
  {
    id:"frameworks",
    color:"#5B8C6E",
    heading:"Key regulatory frameworks",
    body:"Three reporting systems capture different views of the bank-NDFI relationship. FDIC Call Reports (FFIEC 031/041) are public filings by banks showing how much they lend to NDFIs. The Federal Reserve's Form Y-14 is confidential and captures granular counterparty detail for stress testing the largest bank holding companies. SEC Form PF is filed by private fund advisers and shows the fund-side view of borrowing from banks — the mirror image of Call Report data.",
    links:[
      {label:"FFIEC Central Data Repository",url:"https://cdr.ffiec.gov/public/"},
      {label:"FR Y-14Q Form Details",url:"https://www.federalreserve.gov/apps/reportingforms/Report/Index/FR_Y-14Q"},
      {label:"SEC Form PF Instructions",url:"https://www.sec.gov/divisions/investment/pfrd/pf-instructions.pdf"},
    ]
  },
  {
    id:"glossary",
    color:"#A893D4",
    heading:"Glossary",
    body:null,
    glossary:[
      {term:"NDFI",def:"Non-Depository Financial Institution. Any lender that does not hold federally insured deposits. Includes mortgage companies, private credit funds, consumer finance companies, and others."},
      {term:"Tier 1 Capital",def:"A bank's highest-quality capital buffer — common equity and retained earnings that can absorb losses before the bank becomes insolvent. Regulators set minimum Tier 1 ratios."},
      {term:"Unfunded Commitments",def:"Credit lines, revolving facilities, and loan commitments banks have agreed to extend but that haven't been drawn yet. They represent contingent exposure."},
      {term:"QoQ Growth",def:"Quarter-over-quarter growth. The percentage change in a metric from one quarter to the next. Used here to measure how fast NDFI lending is expanding."},
      {term:"Delinquency Rate",def:"The percentage of loans that are 30 or more days past due. A low rate today does not guarantee stability tomorrow — NDFI delinquencies can spike suddenly."},
      {term:"PIK (Payment-in-Kind)",def:"A loan structure where interest is paid by issuing more debt rather than cash. Common in private credit. Can mask deteriorating credit quality in delinquency statistics."},
      {term:"GSIB",def:"Global Systemically Important Bank. Designation given to the largest banks whose failure would pose risks to the global financial system. Subject to enhanced capital requirements."},
      {term:"Private Credit",def:"Loans made by non-bank lenders (like private equity funds) directly to companies, often to fund leveraged buyouts. A fast-growing NDFI subcategory."},
      {term:"CAGR",def:"Compound Annual Growth Rate. The rate at which a quantity would have grown if it grew at a steady rate annually. Useful for comparing growth across different time periods."},
    ],
    links:[]
  },
  {
    id:"reading",
    color:"#999",
    heading:"Further reading",
    body:"Books, papers, and journalists covering the intersection of banking, private credit, and systemic risk.",
    links:[
      {label:"'Other People's Money' — John Kay",url:"https://www.johnkay.com/other-peoples-money/"},
      {label:"'The End of Alchemy' — Mervyn King",url:"https://wwnorton.com/books/the-end-of-alchemy/"},
      {label:"FDIC 2025 Risk Review",url:"https://www.fdic.gov/analysis/2025-risk-review.pdf"},
      {label:"S&P Global: NDFI Lending Q4 2025",url:"https://www.spglobal.com/market-intelligence/en/news-insights/articles/2026/2/us-banks-ndfi-lending-pace-reaccelerates-in-q4-2025-98612159"},
    ]
  },
];

const LearnView = () => {
  const [section,setSection] = useState("shadow");
  return (
    <>
      <SectionHeader>
        <h2 style={{fontSize:18,fontWeight:700,color:"#e0e0e0",margin:0,fontFamily:S.ff}}>Learn & Sources</h2>
        <p style={{fontSize:12,color:"#888",margin:"4px 0 0",fontFamily:S.mono}}>Context, glossary, resources, and data provenance</p>
      </SectionHeader>
      <div style={{padding:"14px 16px"}}>

        {/* Learn sections */}
        {LEARN_SECTIONS.map(sec=>(
          <div key={sec.id} style={{marginBottom:16,borderRadius:6,border:`1px solid ${sec.color}33`,overflow:"hidden"}}>
            <div onClick={()=>setSection(section===sec.id?null:sec.id)} style={{padding:"14px 16px",background:"#111",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:sec.color,fontFamily:S.ff}}>{sec.heading}</div>
              <span style={{color:"#666",fontSize:14}}>{section===sec.id?"▾":"▸"}</span>
            </div>
            {section===sec.id&&(
              <div style={{padding:"0 16px 16px",background:"#0e0e0c"}}>
                {sec.body&&<div style={{fontSize:13,color:"#bbb",lineHeight:1.75,fontFamily:S.ff,marginBottom:sec.links?.length?14:0,paddingTop:14}}>{sec.body}</div>}
                {sec.glossary&&(
                  <div style={{paddingTop:14}}>
                    {sec.glossary.map(g=>(
                      <div key={g.term} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #1a1a1a"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#A893D4",marginBottom:3,fontFamily:S.mono}}>{g.term}</div>
                        <div style={{fontSize:13,color:"#aaa",lineHeight:1.65,fontFamily:S.ff}}>{g.def}</div>
                      </div>
                    ))}
                  </div>
                )}
                {sec.links?.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {sec.links.map((l,i)=>(
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#6AADEE",textDecoration:"none",fontFamily:S.mono}}>→ {l.label}</a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* News placeholder */}
        <div style={{marginBottom:16,borderRadius:6,border:"1px solid #333",overflow:"hidden"}}>
          <div style={{padding:"14px 16px",background:"#111",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#666",fontFamily:S.ff}}>Live News Feed</div>
            <span style={{fontSize:10,color:"#555",fontFamily:S.mono,background:"#1a1a1a",padding:"3px 8px",borderRadius:10,border:"1px solid #333"}}>Coming soon</span>
          </div>
          <div style={{padding:"14px 16px",background:"#0a0a0a"}}>
            <div style={{fontSize:13,color:"#555",lineHeight:1.65,fontFamily:S.ff}}>Real-time news on NDFI lending, private credit, and bank regulation will appear here in a future version. Check back after the next tech stack upgrade.</div>
          </div>
        </div>

        {/* Sources section */}
        <div style={{borderTop:"2px solid #333",paddingTop:20,marginTop:8}}>
          <div style={{fontSize:15,fontWeight:700,color:"#e0e0e0",marginBottom:14,fontFamily:S.ff}}>Regulatory Data Sources</div>
          {SOURCES.map((s,i)=>(
            <div key={i} style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid #1a1a1a"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#ddd",marginBottom:3,fontFamily:S.ff}}>{s.name}</div>
              <div style={{fontSize:12,color:"#D4A054",marginBottom:8,fontFamily:S.mono}}>{s.schedule}</div>
              <div style={{fontSize:13,color:"#aaa",lineHeight:1.6,marginBottom:10,fontFamily:S.ff}}>{s.desc}</div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#6AADEE",textDecoration:"none",fontFamily:S.mono}}>→ {s.urlLabel}</a>
            </div>
          ))}
          <div style={{padding:14,background:"#151512",borderRadius:6,borderLeft:"3px solid #D4A054",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:"#D4A054",marginBottom:8,fontFamily:S.ff}}>Data Limitations</div>
            <div style={{fontSize:13,color:"#aaa",lineHeight:1.7,fontFamily:S.ff}}>
              • Banks under $10B in assets are not required to report NDFI subcategories<br/>
              • JPMorgan reported its entire portfolio as "Other," declining subcategory detail<br/>
              • Call Report data is quarterly; real-time exposure may differ<br/>
              • Unfunded commitments can be drawn at any time<br/>
              • OFR's March 2026 brief noted SEC Form PF may understate true exposure<br/>
              • FR Y-14 data is confidential; published figures are aggregated
            </div>
          </div>
          <div style={{padding:14,background:"#111518",borderRadius:6,borderLeft:"3px solid #6AADEE",marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:"#6AADEE",marginBottom:8,fontFamily:S.ff}}>How the Reporting Framework Connects</div>
            <div style={{fontSize:13,color:"#aaa",lineHeight:1.7,fontFamily:S.ff}}>
              <strong style={{color:"#ccc"}}>Call Reports (FFIEC 031/041/051)</strong> → Public. Bank-side. How much banks lend to NDFIs. Filed quarterly.<br/><br/>
              <strong style={{color:"#ccc"}}>FR Y-14</strong> → Confidential. Bank-side. Filed by ~35 largest BHCs. Granular counterparty detail for stress testing.<br/><br/>
              <strong style={{color:"#ccc"}}>SEC Form PF</strong> → Confidential. Fund-side. How much funds borrow from banks. The mirror image of Call Report data.
            </div>
          </div>
          <div style={{padding:16,background:"#151512",borderRadius:6,borderLeft:"3px solid #D4A054"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#D4A054",marginBottom:8,fontFamily:S.ff}}>Data Audit</div>
            <div style={{fontSize:13,color:"#aaa",lineHeight:1.6,marginBottom:12,fontFamily:S.ff}}>
              Every data point has been classified as Direct (sourced with citation), Estimated (derived from direct data), or Approximate (rough estimate needing verification). Download the full audit spreadsheet.
            </div>
            <a href="/NDFI_Tracker_Data_Audit.xlsx" download style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",background:"#2a2218",border:"1px solid #D4A054",color:"#D4A054",borderRadius:6,textDecoration:"none",fontFamily:S.ff,fontWeight:700,fontSize:14,cursor:"pointer"}}>
              <span style={{fontSize:18,lineHeight:1}}>📊</span> Download Data Audit (.xlsx)
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab] = useState("overview");
  const [titleSheet,setTitleSheet] = useState(false);

  const renderTab = () => {
    switch(tab) {
      case "overview": return <OverviewView />;
      case "table": return <DataTable />;
      case "ranking": return <RankingView />;
      case "mix": return <MixView />;
      case "risk": return <RiskView goToTab={setTab} />;
      case "guide": return <GuideView goToTab={setTab} />;
      case "learn": return <LearnView />;
      default: return null;
    }
  };

  return (
    <div style={{width:"100%",maxWidth:768,margin:"0 auto",background:"#0d0d0d",minHeight:"100vh"}}>
      <GlobalStyle />
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {titleSheet&&<BottomSheet content={TITLE_EDUCATION} onClose={()=>setTitleSheet(false)} />}

      {/* FIXED TOP BANNER */}
      <header style={{position:"fixed",top:0,left:0,right:0,zIndex:50,background:"#0a0a0a",borderBottom:"1px solid #222",maxWidth:768,margin:"0 auto"}}>
        <div onClick={()=>setTitleSheet(true)} style={{padding:"10px 16px 8px",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:8}}>
            <h1 style={{fontSize:17,fontWeight:700,margin:0,color:"#e0e0e0",fontFamily:S.ff,letterSpacing:"-0.02em"}}>NDFI Exposure Tracker</h1>
            <span style={{fontSize:10,color:"#666",fontFamily:S.mono}}>v1.5.0</span>
          </div>
          <p style={{margin:"2px 0 0",fontSize:11,color:"#777",fontFamily:S.ff,fontStyle:"italic",letterSpacing:"0.01em"}}>Tracking U.S. commercial bank lending to non-bank financial institutions&nbsp;<span style={{color:"#D4A054",fontStyle:"normal",fontSize:12}}>ⓘ</span></p>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <main style={{paddingTop:BANNER_H,paddingBottom:NAV_H,minHeight:"100vh"}} key={tab}>
        {renderTab()}
      </main>

      {/* FIXED BOTTOM NAV */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:50,background:"#0a0a0a",borderTop:"1px solid #333",maxWidth:768,margin:"0 auto",display:"flex"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);window.scrollTo(0,0);}} style={{flex:1,padding:"10px 0 12px",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===t.id?"#D4A054":"#888",borderTop:tab===t.id?"2px solid #D4A054":"2px solid transparent"}}>
            <span style={{fontSize:18,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:11,fontFamily:S.ff,fontWeight:600,letterSpacing:"0.04em"}}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
