// client/src/components/MyCanvasView.jsx
import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Plus, RefreshCw, BarChart2,
  Users, TrendingUp, ChevronDown, Edit2, Trash2, Check,
  X, ArrowRight, Star, AlertCircle, Zap, DollarSign,
  UserPlus, Activity,
} from "lucide-react";

// ── Color palette (matches WealthAssistant.jsx) ───────────────────────────────
const C = {
  bg:          "#0a0b0d",
  surface:     "#0f1014",
  surface2:    "#13151e",
  surface3:    "#181a22",
  border:      "#1e2029",
  border2:     "#2a2d3a",
  text:        "#eceef5",
  textMid:     "#b0b8d0",
  textMuted:   "#8a8fa8",
  textDim:     "#7a7e94",
  blue:        "#7db8ff",
  blueBg:      "#0e1e38",
  blueBorder:  "#2a4a8a",
  blueDark:    "#152640",
  teal:        "#2dbe8a",
  tealBg:      "#0a2820",
  tealBorder:  "#1a6a50",
  amber:       "#e09040",
  amberBg:     "#221800",
  amberBorder: "#5a3a10",
  purple:      "#a882ff",
  purpleBg:    "#180f30",
  purpleBorder:"#4a3080",
  coral:       "#f07850",
  coralBg:     "#221008",
  coralBorder: "#6a3020",
};

// ── localStorage helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = "wealth_assistant_canvas_sessions";

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

// ── Default "Morning Briefing" session ────────────────────────────────────────
const DEFAULT_SESSIONS = [
  {
    id: "session-default",
    name: "Morning Briefing",
    createdAt: new Date().toISOString(),
    cards: ["book-of-business", "client-acquisition", "investment-insights"],
  },
];

// ── Available card definitions ────────────────────────────────────────────────
const CARD_CATALOG = [
  {
    id: "book-of-business",
    title: "Book of Business",
    agentId: "ag-02",
    agentName: "My Clients & Prospects",
    icon: "Users",
    color: "teal",
    lastRun: "Today, 7:02 AM",
  },
  {
    id: "client-acquisition",
    title: "Client Acquisition",
    agentId: "ag-05",
    agentName: "Client Acquisition Agent",
    icon: "UserPlus",
    color: "blue",
    lastRun: "Today, 7:04 AM",
  },
  {
    id: "investment-insights",
    title: "Investment Insights",
    agentId: "ag-03",
    agentName: "Investment Agent",
    icon: "TrendingUp",
    color: "amber",
    lastRun: "Today, 7:06 AM",
  },
  {
    id: "market-summary",
    title: "Market Summary",
    agentId: "ag-08",
    agentName: "Market Data Intelligence",
    icon: "Activity",
    color: "purple",
    lastRun: "Today, 7:08 AM",
  },
  {
    id: "practice-kpis",
    title: "Practice KPIs",
    agentId: "ag-09",
    agentName: "My Practice",
    icon: "BarChart2",
    color: "blue",
    lastRun: "Today, 6:58 AM",
  },
  {
    id: "wealth-planning",
    title: "Wealth Planning",
    agentId: "ag-04",
    agentName: "Wealth Planning Agent",
    icon: "Star",
    color: "purple",
    lastRun: "Yesterday, 6:45 PM",
  },
];

// ── Mini SVG Sparkline ────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 120, height = 36 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${width},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].split(",")[0]} cy={pts[pts.length-1].split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function MiniBar({ data, colors, width = 120, height = 40 }) {
  const max = Math.max(...data.map(d => d.value));
  const barW = (width - (data.length - 1) * 4) / data.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / max) * (height - 4));
        const x = i * (barW + 4);
        const y = height - h;
        return <rect key={i} x={x} y={y} width={barW} height={h} rx="2" fill={colors[i % colors.length]} opacity="0.85" />;
      })}
    </svg>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && onClick ? C.surface3 : C.surface2,
        border: `1px solid ${hov && onClick ? C.border2 : C.border}`,
        borderRadius: 8, padding: "10px 12px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.15s", flex: 1,
      }}
    >
      <div style={{ fontSize: 11, color: C.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || C.text, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Recommendation Row ────────────────────────────────────────────────────────
function RecommendationRow({ icon: Icon, label, sub, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 7,
        background: hov ? C.surface3 : "transparent",
        border: `1px solid ${hov ? C.border2 : "transparent"}`,
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color={color} />
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 1 }}>{sub}</div>}
      </div>
      <ArrowRight size={13} color={hov ? color : C.textDim} style={{ flexShrink: 0, transition: "color 0.15s" }} />
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, marginTop: 4 }}>
      {label}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── CARD RENDERERS ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function BookOfBusinessCard({ onNavigate }) {
  const sparkData = [5.1, 5.3, 5.2, 5.4, 5.35, 5.42, 5.48, 5.45, 5.5, 5.53];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Total Book AUM</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.teal, lineHeight: 1 }}>$5.53B</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: C.teal, fontWeight: 600 }}>▲ 8.3% YTD</span>
            <span>· James Miller · 702-1782</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Sparkline data={sparkData} color={C.teal} width={130} height={44} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>12-month AUM trend ($B)</div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <SectionLabel label="Book Overview" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Clients" value="352" sub="280 active" color={C.blue} />
          <StatTile label="Prospects" value="72" sub="23 high priority" color={C.purple} />
          <StatTile label="Accounts" value="2,622" sub="1,585 managed" color={C.teal} />
          <StatTile label="Avg AUM" value="$15.7M" sub="per client" color={C.amber} />
        </div>
      </div>

      {/* AUM breakdown */}
      <div>
        <SectionLabel label="AUM Breakdown" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Managed" value="$3.34B" sub="60.4% of book" color={C.teal} />
          <StatTile label="Custody" value="$2.19B" sub="39.6% of book" color={C.blue} />
          <StatTile label="Idle Cash" value="$1.69B" sub="CMA accounts" color={C.amber}
            onClick={() => onNavigate("sub-ag-02", "ag-02", "My Clients & Prospects")} />
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={AlertCircle} color={C.coral}
            label="14 at-risk clients flagged"
            sub="Large withdrawals or long contact gaps detected"
            onClick={() => onNavigate("sub-ag-02", "ag-02", "My Clients & Prospects")} />
          <RecommendationRow icon={DollarSign} color={C.amber}
            label="$1.69B idle cash opportunity"
            sub="798 CMA accounts eligible for managed transition"
            onClick={() => onNavigate("sub-ag-01", "ag-01", "Portfolio Financials Intelligence")} />
          <RecommendationRow icon={Users} color={C.blue}
            label="8 upcoming annual reviews"
            sub="2 clients have incomplete fact sheets"
            onClick={() => onNavigate("sub-ag-02", "ag-02", "My Clients & Prospects")} />
        </div>
      </div>
    </div>
  );
}

function ClientAcquisitionCard({ onNavigate }) {
  const barData = [
    { value: 23, label: "High" },
    { value: 31, label: "Nurture" },
    { value: 18, label: "Initial" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Net New Money Opportunity</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.blue, lineHeight: 1 }}>$136.9M</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            <span style={{ color: C.blue, fontWeight: 600 }}>72 prospects</span> · Estimated potential assets
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <MiniBar data={barData} colors={[C.blue, C.teal, C.purple]} width={100} height={48} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Prospect pipeline stages</div>
        </div>
      </div>

      {/* Funnel stats */}
      <div>
        <SectionLabel label="Prospect Pipeline" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="High Potential" value="23" sub="Ready to convert" color={C.blue} />
          <StatTile label="Nurturing" value="31" sub="In progress" color={C.teal} />
          <StatTile label="Initial Outreach" value="18" sub="New leads" color={C.purple} />
        </div>
      </div>

      {/* Conversion metrics */}
      <div>
        <SectionLabel label="Conversion Metrics" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Avg Time to Close" value="47 days" sub="↓ 6 days vs last qtr" color={C.teal} />
          <StatTile label="Conversion Rate" value="31%" sub="Industry avg: 24%" color={C.blue} />
          <StatTile label="Referral Rate" value="68%" sub="Of new prospects" color={C.amber} />
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={Star} color={C.blue}
            label="23 high-potential prospects ready"
            sub="Personalized outreach drafts available"
            onClick={() => onNavigate("sub-502", "ag-05", "Client Acquisition Agent")} />
          <RecommendationRow icon={UserPlus} color={C.teal}
            label="Referral opportunities identified"
            sub="12 clients with strong referral signals this month"
            onClick={() => onNavigate("sub-503", "ag-05", "Client Acquisition Agent")} />
          <RecommendationRow icon={AlertCircle} color={C.amber}
            label="Life event triggers found"
            sub="8 prospects with recent life changes — ideal timing"
            onClick={() => onNavigate("sub-501", "ag-05", "Client Acquisition Agent")} />
        </div>
      </div>
    </div>
  );
}

function InvestmentInsightsCard({ onNavigate }) {
  const sparkData = [2.1, 2.3, 2.25, 2.4, 2.35, 2.5, 2.48, 2.6, 2.67, 2.67];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Revenue Opportunity</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.amber, lineHeight: 1 }}>$2.67M</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            <span style={{ color: C.amber, fontWeight: 600 }}>AI-identified</span> · Potential annual revenue impact
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Sparkline data={sparkData} color={C.amber} width={130} height={44} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Revenue opportunity trend ($M)</div>
        </div>
      </div>

      {/* Portfolio stats */}
      <div>
        <SectionLabel label="Portfolio Overview" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Rebalance Needed" value="494" sub="accounts" color={C.amber} />
          <StatTile label="Tax Loss" value="193" sub="candidates" color={C.coral} />
          <StatTile label="High Cash" value="798" sub="CMA accounts" color={C.blue} />
          <StatTile label="Underallocated" value="147" sub="portfolios" color={C.purple} />
        </div>
      </div>

      {/* Strategy areas */}
      <div>
        <SectionLabel label="Strategy Focus Areas" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Brokerage Shift" value="$892M" sub="eligible AUM" color={C.teal}
            onClick={() => onNavigate("sub-301", "ag-03", "Investment Agent")} />
          <StatTile label="Tax Loss Pool" value="$74M" sub="harvestable" color={C.coral}
            onClick={() => onNavigate("sub-101", "ag-01", "Portfolio Financials Intelligence")} />
          <StatTile label="ESG Eligible" value="$1.2B" sub="screened AUM" color={C.teal}
            onClick={() => onNavigate("sub-304", "ag-03", "Investment Agent")} />
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={TrendingUp} color={C.amber}
            label="Rebalance portfolios for growth"
            sub="494 accounts showing drift beyond tolerance bands"
            onClick={() => onNavigate("sub-301", "ag-03", "Investment Agent")} />
          <RecommendationRow icon={DollarSign} color={C.coral}
            label="Tax loss harvesting — $74M available"
            sub="193 accounts with harvestable losses before year-end"
            onClick={() => onNavigate("prompts-101", "ag-01", "Portfolio Financials Intelligence")} />
          <RecommendationRow icon={Activity} color={C.blue}
            label="Transition to managed solutions"
            sub="$1.69B in custody accounts eligible for advisory shift"
            onClick={() => onNavigate("sub-302", "ag-03", "Investment Agent")} />
        </div>
      </div>
    </div>
  );
}

function MarketSummaryCard({ onNavigate }) {
  const sparkData = [4420, 4380, 4450, 4510, 4490, 4530, 4580, 4560, 4610, 4625];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>S&P 500</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.teal, lineHeight: 1 }}>4,625</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            <span style={{ color: C.teal, fontWeight: 600 }}>▲ +1.3% today</span> · Markets open
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Sparkline data={sparkData} color={C.teal} width={130} height={44} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>10-day S&P 500 trend</div>
        </div>
      </div>
      <div>
        <SectionLabel label="Key Indices" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Dow Jones" value="38,420" sub="▲ +0.9%" color={C.teal} />
          <StatTile label="NASDAQ" value="16,284" sub="▲ +1.8%" color={C.teal} />
          <StatTile label="10Y Treasury" value="4.42%" sub="▼ -3bps" color={C.amber} />
          <StatTile label="VIX" value="14.2" sub="Low volatility" color={C.blue} />
        </div>
      </div>
      <div>
        <SectionLabel label="Sector Performance (Today)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Technology" value="+2.1%" color={C.teal} />
          <StatTile label="Financials" value="+1.4%" color={C.teal} />
          <StatTile label="Energy" value="-0.8%" color={C.coral} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={TrendingUp} color={C.teal}
            label="Tech sector momentum — review allocations"
            sub="Client portfolios may be underweight vs benchmark"
            onClick={() => onNavigate("sub-302", "ag-03", "Investment Agent")} />
          <RecommendationRow icon={AlertCircle} color={C.amber}
            label="Rate environment shift — fixed income review"
            sub="10Y yield movement impacts bond-heavy portfolios"
            onClick={() => onNavigate("sub-803", "ag-08", "Market Data Intelligence")} />
          <RecommendationRow icon={Activity} color={C.blue}
            label="Earnings season starting — alerts set"
            sub="34 client holdings reporting this week"
            onClick={() => onNavigate("sub-804", "ag-08", "Market Data Intelligence")} />
        </div>
      </div>
    </div>
  );
}

function PracticeKPIsCard({ onNavigate }) {
  const barData = [
    { value: 285, label: "Jan" }, { value: 298, label: "Feb" },
    { value: 310, label: "Mar" }, { value: 325, label: "Apr" },
    { value: 338, label: "May" }, { value: 352, label: "Jun" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Annual Revenue Run Rate</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.blue, lineHeight: 1 }}>$8.84M</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            <span style={{ color: C.teal, fontWeight: 600 }}>▲ 12.4% YoY</span> · Fee-based revenue
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <MiniBar data={barData} colors={[C.blue, C.blue, C.blue, C.teal, C.teal, C.teal]} width={100} height={48} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Client count growth (6mo)</div>
        </div>
      </div>
      <div>
        <SectionLabel label="Practice Health" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Retention Rate" value="97.2%" sub="↑ from 96.1%" color={C.teal} />
          <StatTile label="NPS Score" value="72" sub="Excellent" color={C.blue} />
          <StatTile label="Client Growth" value="+23" sub="YTD new clients" color={C.teal} />
          <StatTile label="AUM Growth" value="+$480M" sub="YTD net new" color={C.amber} />
        </div>
      </div>
      <div>
        <SectionLabel label="Compliance Status" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Reviews Due" value="8" sub="Next 30 days" color={C.amber} />
          <StatTile label="Disclosures" value="100%" sub="All current" color={C.teal} />
          <StatTile label="Suitability" value="2 pending" sub="Needs review" color={C.coral}
            onClick={() => onNavigate("sub-903", "ag-09", "My Practice")} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={AlertCircle} color={C.amber}
            label="8 annual reviews due this month"
            sub="2 clients have incomplete suitability profiles"
            onClick={() => onNavigate("sub-903", "ag-09", "My Practice")} />
          <RecommendationRow icon={DollarSign} color={C.blue}
            label="Revenue dashboard — Q2 summary ready"
            sub="Fee income up 12.4% — full breakdown available"
            onClick={() => onNavigate("sub-901", "ag-09", "My Practice")} />
          <RecommendationRow icon={TrendingUp} color={C.teal}
            label="Practice growth on track for targets"
            sub="352 clients · $5.53B AUM · 97.2% retention"
            onClick={() => onNavigate("sub-902", "ag-09", "My Practice")} />
        </div>
      </div>
    </div>
  );
}

function WealthPlanningCard({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Planning Opportunities</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: C.purple, lineHeight: 1 }}>47</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>
            <span style={{ color: C.purple, fontWeight: 600 }}>Clients needing</span> · Planning review this quarter
          </div>
        </div>
        <div style={{ width: 100, display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
          {[["Retirement", 18, C.purple], ["Estate", 12, C.blue], ["Education", 9, C.teal], ["Tax", 8, C.amber]].map(([label, val, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: C.border, overflow: "hidden" }}>
                <div style={{ width: `${(val / 18) * 100}%`, height: "100%", background: color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 10, color: C.textDim, width: 20, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel label="Planning Categories" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Retirement" value="18" sub="Monte Carlo due" color={C.purple} />
          <StatTile label="Estate" value="12" sub="Beneficiary gaps" color={C.blue} />
          <StatTile label="Education" value="9" sub="529 reviews" color={C.teal} />
          <StatTile label="Tax" value="8" sub="Roth conversions" color={C.amber} />
        </div>
      </div>
      <div>
        <SectionLabel label="Priority Clients" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="RMD Due" value="23" sub="clients age 73+" color={C.coral} />
          <StatTile label="Life Events" value="11" sub="New triggers" color={C.purple} />
          <StatTile label="Plan Review" value="6" sub="Overdue 90+ days" color={C.amber} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SectionLabel label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RecommendationRow icon={AlertCircle} color={C.coral}
            label="23 clients with RMDs this year"
            sub="Required minimum distributions need to be processed"
            onClick={() => onNavigate("sub-401", "ag-04", "Wealth Planning Agent")} />
          <RecommendationRow icon={TrendingUp} color={C.amber}
            label="Roth conversion window open"
            sub="8 clients in lower bracket — optimal timing now"
            onClick={() => onNavigate("sub-404", "ag-04", "Wealth Planning Agent")} />
          <RecommendationRow icon={Star} color={C.purple}
            label="Estate plan gaps — 12 clients"
            sub="Outdated beneficiaries or missing trust structures"
            onClick={() => onNavigate("sub-402", "ag-04", "Wealth Planning Agent")} />
        </div>
      </div>
    </div>
  );
}

// ── Card renderer map ─────────────────────────────────────────────────────────
function CardContent({ cardId, onNavigate }) {
  switch (cardId) {
    case "book-of-business":    return <BookOfBusinessCard   onNavigate={onNavigate} />;
    case "client-acquisition":  return <ClientAcquisitionCard onNavigate={onNavigate} />;
    case "investment-insights": return <InvestmentInsightsCard onNavigate={onNavigate} />;
    case "market-summary":      return <MarketSummaryCard    onNavigate={onNavigate} />;
    case "practice-kpis":       return <PracticeKPIsCard     onNavigate={onNavigate} />;
    case "wealth-planning":     return <WealthPlanningCard   onNavigate={onNavigate} />;
    default: return <div style={{ color: C.textDim, padding: 20 }}>Card not found: {cardId}</div>;
  }
}

// ── Add Card Modal ────────────────────────────────────────────────────────────
function AddCardModal({ currentCards, onAdd, onClose }) {
  const available = CARD_CATALOG.filter(c => !currentCards.includes(c.id));
  const colorMap = { teal: C.teal, blue: C.blue, amber: C.amber, purple: C.purple, coral: C.coral };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50 }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, width: 480, zIndex: 51, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Add Card to Canvas</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{available.length} agent{available.length !== 1 ? "s" : ""} available</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
          {available.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: C.textDim, fontSize: 13 }}>
              All available cards are already on this canvas.
            </div>
          ) : available.map(card => {
            const color = colorMap[card.color] || C.blue;
            return (
              <div key={card.id} onClick={() => onAdd(card.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer", background: C.surface2, transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = C.surface3; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface2; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}22`, border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Zap size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{card.title}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{card.agentName}</div>
                </div>
                <Plus size={14} color={color} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Session Dropdown ──────────────────────────────────────────────────────────
function SessionDropdown({ sessions, activeId, onSelect, onCreate, onRename, onDelete, onClose }) {
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
      <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, zIndex: 41, width: 280, boxShadow: "0 12px 32px rgba(0,0,0,0.5)", overflow: "hidden" }}>
        <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Saved Canvases
        </div>
        {sessions.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: s.id === activeId ? C.blueDark : "transparent", transition: "background 0.12s" }}
            onMouseEnter={e => { if (s.id !== activeId) e.currentTarget.style.background = C.surface3; }}
            onMouseLeave={e => { if (s.id !== activeId) e.currentTarget.style.background = "transparent"; }}
          >
            {renaming === s.id ? (
              <>
                <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { onRename(s.id, renameVal); setRenaming(null); } if (e.key === "Escape") setRenaming(null); }}
                  style={{ flex: 1, background: C.surface, border: `1px solid ${C.blueBorder}`, borderRadius: 5, padding: "3px 8px", fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none" }} />
                <button onClick={() => { onRename(s.id, renameVal); setRenaming(null); }} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer" }}><Check size={13} /></button>
                <button onClick={() => setRenaming(null)} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer" }}><X size={13} /></button>
              </>
            ) : (
              <>
                <div onClick={() => { onSelect(s.id); onClose(); }} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, color: s.id === activeId ? C.blue : C.textMid, fontWeight: s.id === activeId ? 600 : 400 }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: C.textDim, marginTop: 1 }}>{s.cards.length} card{s.cards.length !== 1 ? "s" : ""}</div>
                </div>
                <button onClick={() => { setRenaming(s.id); setRenameVal(s.name); }} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", opacity: 0.6, padding: 2 }} title="Rename"><Edit2 size={11} /></button>
                {sessions.length > 1 && (
                  <button onClick={() => onDelete(s.id)} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", opacity: 0.6, padding: 2 }} title="Delete"><Trash2 size={11} /></button>
                )}
              </>
            )}
          </div>
        ))}
        <div style={{ borderTop: `1px solid ${C.border}`, margin: "4px 0" }} />
        <div onClick={onCreate} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", cursor: "pointer", color: C.blue, fontSize: 13, fontWeight: 500 }}
          onMouseEnter={e => e.currentTarget.style.background = C.surface3}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <Plus size={13} /> Create New Canvas
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN MyCanvasView ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function MyCanvasView({ onNavigateToAgent }) {
  // ── Session state ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState(() => loadSessions() || DEFAULT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = loadSessions();
    return saved?.[0]?.id || "session-default";
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addCardOpen, setAddCardOpen]   = useState(false);
  const [cardIndex, setCardIndex]       = useState(0);
  const [refreshing, setRefreshing]     = useState(false);
  const dropdownRef                     = useRef(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const cards = activeSession?.cards || [];

  // Persist whenever sessions change
  useEffect(() => { saveSessions(sessions); }, [sessions]);

  // Reset card index when session changes
  useEffect(() => { setCardIndex(0); }, [activeSessionId]);

  // Clamp card index
  const safeIndex = Math.min(cardIndex, Math.max(0, cards.length - 1));

  // ── Session management ──────────────────────────────────────────────────────
  function createSession() {
    const id   = `session-${Date.now()}`;
    const name = `New Canvas ${sessions.length + 1}`;
    const newS = { id, name, createdAt: new Date().toISOString(), cards: [] };
    setSessions(prev => [...prev, newS]);
    setActiveSessionId(id);
    setDropdownOpen(false);
  }

  function renameSession(id, name) {
    if (!name.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name: name.trim() } : s));
  }

  function deleteSession(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSessionId === id) setActiveSessionId(next[0]?.id);
      return next;
    });
  }

  // ── Card management ─────────────────────────────────────────────────────────
  function addCard(cardId) {
    if (cards.length >= 6) return;
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, cards: [...s.cards, cardId] } : s
    ));
    setCardIndex(cards.length); // jump to new card
    setAddCardOpen(false);
  }

  function removeCard(cardId) {
    setSessions(prev => prev.map(s =>
      s.id === activeSessionId ? { ...s, cards: s.cards.filter(c => c !== cardId) } : s
    ));
    setCardIndex(Math.max(0, safeIndex - 1));
  }

  // ── Refresh ─────────────────────────────────────────────────────────────────
  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1400);
  }

  // ── Navigate to agent workflow ──────────────────────────────────────────────
  function handleNavigate(subKey, agentId, agentName) {
    if (onNavigateToAgent) onNavigateToAgent(subKey, agentId, agentName);
  }

  const currentCard = CARD_CATALOG.find(c => c.id === cards[safeIndex]);
  const colorMap = { teal: C.teal, blue: C.blue, amber: C.amber, purple: C.purple, coral: C.coral };
  const accentColor = colorMap[currentCard?.color] || C.blue;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg, overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ padding: "14px 24px 12px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

          {/* Session selector */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.surface2, color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              <Zap size={14} color={C.blue} />
              {activeSession?.name || "My Canvas"}
              <ChevronDown size={13} color={C.textMuted} style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            {dropdownOpen && (
              <SessionDropdown
                sessions={sessions}
                activeId={activeSessionId}
                onSelect={setActiveSessionId}
                onCreate={createSession}
                onRename={renameSession}
                onDelete={deleteSession}
                onClose={() => setDropdownOpen(false)}
              />
            )}
          </div>

          {/* Last refresh */}
          <div style={{ fontSize: 11, color: C.textDim }}>
            {refreshing ? "Refreshing…" : `Last updated: Today, ${currentCard?.lastRun?.split(", ")[1] || "7:06 AM"}`}
          </div>

          {/* Actions */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleRefresh}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
            >
              <RefreshCw size={12} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
              Refresh All
            </button>
            {cards.length < 6 && (
              <button onClick={() => setAddCardOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = C.blueDark}
                onMouseLeave={e => e.currentTarget.style.background = C.blueBg}
              >
                <Plus size={12} /> Add Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Canvas body ── */}
      {cards.length === 0 ? (
        // Empty state
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: C.textDim }}>
          <Zap size={40} style={{ opacity: 0.2 }} />
          <div style={{ fontSize: 16, color: C.textMuted, fontWeight: 500 }}>This canvas is empty</div>
          <div style={{ fontSize: 13, color: C.textDim }}>Add agent cards to build your morning briefing</div>
          <button onClick={() => setAddCardOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 8, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
          >
            <Plus size={14} /> Add Your First Card
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Card header bar */}
          <div style={{ padding: "10px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: C.surface }}>
            {/* Card title + agent */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: `${accentColor}22`, border: `1px solid ${accentColor}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={14} color={accentColor} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{currentCard?.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>{currentCard?.agentName} · {currentCard?.lastRun}</div>
              </div>
            </div>

            {/* Remove card */}
            <button
              onClick={() => removeCard(cards[safeIndex])}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.coralBorder; e.currentTarget.style.color = C.coral; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textDim; }}
            >
              <X size={11} /> Remove
            </button>

            {/* Carousel nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setCardIndex(i => Math.max(0, i - 1))} disabled={safeIndex === 0}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface2, color: safeIndex === 0 ? C.textDim : C.textMid, cursor: safeIndex === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safeIndex === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>

              {/* Dot indicators */}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {cards.map((_, i) => (
                  <div key={i} onClick={() => setCardIndex(i)}
                    style={{ width: i === safeIndex ? 18 : 6, height: 6, borderRadius: 3, background: i === safeIndex ? accentColor : C.border2, cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>

              <button onClick={() => setCardIndex(i => Math.min(cards.length - 1, i + 1))} disabled={safeIndex === cards.length - 1}
                style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface2, color: safeIndex === cards.length - 1 ? C.textDim : C.textMid, cursor: safeIndex === cards.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safeIndex === cards.length - 1 ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
            </div>

            <div style={{ fontSize: 11, color: C.textDim, minWidth: 40, textAlign: "right" }}>
              {safeIndex + 1} / {cards.length}
            </div>
          </div>

          {/* Card content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {refreshing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[80, 120, 60, 100].map((w, i) => (
                  <div key={i} style={{ height: w, borderRadius: 8, background: C.surface2, animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <CardContent cardId={cards[safeIndex]} onNavigate={handleNavigate} />
            )}
          </div>
        </div>
      )}

      {/* ── Add Card Modal ── */}
      {addCardOpen && (
        <AddCardModal
          currentCards={cards}
          onAdd={addCard}
          onClose={() => setAddCardOpen(false)}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
