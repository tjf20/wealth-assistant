// client/src/components/MyCanvasView.jsx (v3 — wow-factor redesign)
// Restores: 3-card carousel, Add Card modal, New Session, session management
// New: large hero sparkline, cashflow bars, pill badges, animated accents

import { useState, useEffect } from "react";
import {
  ChevronLeft, ChevronRight, Plus, RefreshCw, BarChart2,
  Users, TrendingUp, ChevronDown, Edit2, Trash2, Check,
  X, ArrowRight, Star, AlertCircle, Zap, DollarSign,
  UserPlus, Activity, Bell, Clock,
} from "lucide-react";

const C = {
  bg: "#0a0b0d", surface: "#0f1014", surface2: "#13151e", surface3: "#181a22",
  border: "#1e2029", border2: "#2a2d3a",
  text: "#eceef5", textMid: "#b0b8d0", textMuted: "#8a8fa8", textDim: "#7a7e94",
  blue: "#7db8ff", blueBg: "#0e1e38", blueBorder: "#2a4a8a", blueDark: "#152640",
  teal: "#2dbe8a", tealBg: "#0a2820", tealBorder: "#1a6a50",
  amber: "#e09040", amberBg: "#221800", amberBorder: "#5a3a10",
  purple: "#a882ff", purpleBg: "#180f30", purpleBorder: "#4a3080",
  coral: "#f07850", coralBg: "#221008", coralBorder: "#6a3020",
};

// ── Storage ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = "wealth_assistant_canvas_sessions";
function loadSessions() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveSessions(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

const DEFAULT_SESSIONS = [{
  id: "session-default", name: "Morning Briefing",
  createdAt: new Date().toISOString(),
  cards: ["book-of-business", "client-acquisition", "investment-insights"],
}];

const CARD_CATALOG = [
  { id: "book-of-business",    title: "Book of Business",    icon: Users,        color: "teal",   desc: "AUM, clients, prospects & AI recommendations" },
  { id: "client-acquisition",  title: "Client Acquisition",  icon: UserPlus,     color: "blue",   desc: "Prospect pipeline, conversion metrics, outreach" },
  { id: "investment-insights", title: "Investment Insights",  icon: TrendingUp,   color: "amber",  desc: "Portfolio opportunities, tax loss, rebalancing" },
  { id: "market-summary",      title: "Market Summary",       icon: Activity,     color: "purple", desc: "Indices, sector performance, market intelligence" },
  { id: "practice-kpis",       title: "Practice KPIs",        icon: BarChart2,    color: "blue",   desc: "Revenue, retention, compliance, growth metrics" },
  { id: "wealth-planning",     title: "Wealth Planning",      icon: Star,         color: "purple", desc: "Retirement, estate, education, tax planning" },
];

const COLOR_MAP = { teal: C.teal, blue: C.blue, amber: C.amber, purple: C.purple, coral: C.coral };
const BG_MAP    = { teal: C.tealBg, blue: C.blueBg, amber: C.amberBg, purple: C.purpleBg, coral: C.coralBg };
const BR_MAP    = { teal: C.tealBorder, blue: C.blueBorder, amber: C.amberBorder, purple: C.purpleBorder, coral: C.coralBorder };

// ── Hero Sparkline (large, glowing) ──────────────────────────────────────────
function HeroSparkline({ data, color, width = 220, height = 60 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${pts.join(" L ")}`;
  const area = `M 0,${height} L ${pts.join(" L ")} L ${width},${height} Z`;
  const [lx, ly] = pts[pts.length - 1].split(",");
  const uid = color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`hg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#hg-${uid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="5" fill={color} opacity="0.9" />
      <circle cx={lx} cy={ly} r="9" fill={color} opacity="0.15" />
    </svg>
  );
}

// ── Cash Flow Bar Chart ───────────────────────────────────────────────────────
function CashFlowBars({ data, posColor, negColor, width = 200, height = 60 }) {
  const maxAbs = Math.max(...data.map(d => Math.abs(d.value)));
  const barW = (width - (data.length - 1) * 3) / data.length;
  const midY = height / 2;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h = Math.max(3, (Math.abs(d.value) / maxAbs) * (midY - 4));
        const x = i * (barW + 3);
        const isPos = d.value >= 0;
        const y = isPos ? midY - h : midY;
        return <rect key={i} x={x} y={y} width={barW} height={h} rx="2" fill={isPos ? posColor : negColor} opacity="0.85" />;
      })}
      <line x1="0" y1={midY} x2={width} y2={midY} stroke={C.border2} strokeWidth="0.5" />
    </svg>
  );
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function MiniSparkline({ data, color, width = 80, height = 28 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={`M ${pts.join(" L ")}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && onClick ? C.surface3 : C.surface2, border: `1px solid ${hov && onClick ? C.border2 : C.border}`, borderRadius: 9, padding: "11px 13px", cursor: onClick ? "pointer" : "default", transition: "all 0.15s", flex: 1 }}>
      <div style={{ fontSize: 10, color: C.textDim, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: color || C.text, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Recommendation Row ────────────────────────────────────────────────────────
function RecRow({ icon: Icon, label, sub, color, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: hov ? C.surface3 : "transparent", border: `1px solid ${hov ? C.border2 : "transparent"}`, cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: C.textMid, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
          {label}
          {badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: `${color}22`, color: color, border: `1px solid ${color}44`, flexShrink: 0 }}>{badge}</span>}
        </div>
        {sub && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
      <ArrowRight size={13} color={hov ? color : C.textDim} style={{ flexShrink: 0, transition: "color 0.15s" }} />
    </div>
  );
}

function SL({ label }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, marginTop: 2 }}>{label}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CARD CONTENT RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

function BookOfBusinessCard({ onNavigate }) {
  const spark = [5.1, 5.25, 5.18, 5.32, 5.28, 5.41, 5.38, 5.47, 5.51, 5.53];
  const cashflow = [
    { value: 120 }, { value: -30 }, { value: 95 }, { value: 200 },
    { value: -15 }, { value: 310 }, { value: 180 }, { value: -40 }, { value: 250 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${C.tealBg} 0%, #061a10 100%)`, border: `1px solid ${C.tealBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>Total Book AUM</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.teal, lineHeight: 1, letterSpacing: "-0.02em" }}>$5.53B</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#0a3a20", color: C.teal, border: `1px solid ${C.tealBorder}` }}>▲ 8.3% YTD</span>
            <span style={{ fontSize: 11, color: C.textDim }}>James Miller · 702-1782</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HeroSparkline data={spark} color={C.teal} width={180} height={56} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>12-month AUM trend ($B)</div>
        </div>
      </div>

      {/* Stats grid */}
      <div>
        <SL label="Book Overview" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Clients" value="352" sub="280 active" color={C.blue} />
          <StatTile label="Prospects" value="72" sub="23 high priority" color={C.purple} />
          <StatTile label="Accounts" value="2,622" sub="1,585 managed" color={C.teal} />
          <StatTile label="Avg AUM" value="$15.7M" sub="per client" color={C.amber} />
        </div>
      </div>

      {/* AUM breakdown + cashflow side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <SL label="AUM Breakdown" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Managed", "$3.34B", "60.4%", C.teal, C.tealBg, C.tealBorder],
              ["Cash",    "$2.19B", "39.6%", C.blue, C.blueBg, C.blueBorder],
              ["Idle",    "$1.69B", "CMA",   C.amber, C.amberBg, C.amberBorder]].map(([label, val, sub, color, bg, border]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
                </div>
                <span style={{ fontSize: 11, color, opacity: 0.6 }}>{sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SL label="Net Cash Flow (9mo)" />
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", height: "calc(100% - 24px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            <CashFlowBars data={cashflow} posColor={C.teal} negColor={C.coral} width={160} height={56} />
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textDim }}>
              <span style={{ color: C.teal }}>▮ Inflows</span>
              <span style={{ color: C.coral }}>▮ Outflows</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recs */}
      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={AlertCircle} color={C.coral} badge="Urgent" label="14 at-risk clients flagged" sub="Large withdrawals or long contact gaps detected" onClick={() => onNavigate("sub-ag-02", "ag-02", "My Clients & Prospects")} />
          <RecRow icon={DollarSign} color={C.amber} badge="Opportunity" label="$1.69B idle cash opportunity" sub="798 CMA accounts eligible for managed transition" onClick={() => onNavigate("sub-ag-01", "ag-01", "Portfolio Financials Intelligence")} />
          <RecRow icon={Users} color={C.blue} badge="Action" label="8 upcoming annual reviews" sub="2 clients have incomplete fact sheets" onClick={() => onNavigate("sub-ag-02", "ag-02", "My Clients & Prospects")} />
        </div>
      </div>
    </div>
  );
}

function ClientAcquisitionCard({ onNavigate }) {
  const spark = [89, 95, 92, 101, 98, 108, 112, 118, 122, 136.9];
  const pipeline = [
    { value: 23 }, { value: 23 }, { value: 31 }, { value: 31 },
    { value: 18 }, { value: 18 }, { value: 12 }, { value: 12 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.blueBg} 0%, #050d1e 100%)`, border: `1px solid ${C.blueBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>Net New Money Opportunity</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.blue, lineHeight: 1, letterSpacing: "-0.02em" }}>$136.9M</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#050d1e", color: C.blue, border: `1px solid ${C.blueBorder}` }}>72 prospects</span>
            <span style={{ fontSize: 11, color: C.textDim }}>Estimated potential assets</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HeroSparkline data={spark} color={C.blue} width={180} height={56} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Pipeline value trend ($M)</div>
        </div>
      </div>

      <div>
        <SL label="Prospect Pipeline" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="High Potential" value="23" sub="Ready to convert" color={C.blue} />
          <StatTile label="Nurturing" value="31" sub="In progress" color={C.teal} />
          <StatTile label="Initial Outreach" value="18" sub="New leads" color={C.purple} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <SL label="Conversion Metrics" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Avg Close Time", "47 days", "↓ 6d vs last qtr", C.teal, C.tealBg, C.tealBorder],
              ["Conversion Rate", "31%", "Industry avg: 24%", C.blue, C.blueBg, C.blueBorder],
              ["Referral Rate", "68%", "Of new prospects", C.amber, C.amberBg, C.amberBorder]].map(([label, val, sub, color, bg, border]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
                </div>
                <span style={{ fontSize: 10, color, opacity: 0.6 }}>{sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SL label="Stage Breakdown" />
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", height: "calc(100% - 24px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            {[["High", 23, C.blue], ["Nurture", 31, C.teal], ["Initial", 18, C.purple], ["Research", 12, C.amber]].map(([label, val, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: C.textDim, width: 48 }}>{label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                  <div style={{ width: `${(val / 31) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, color, fontWeight: 600, width: 20, textAlign: "right" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={Star} color={C.blue} badge="Ready" label="23 high-potential prospects ready" sub="Personalized outreach drafts available" onClick={() => onNavigate("sub-502", "ag-05", "Client Acquisition Agent")} />
          <RecRow icon={UserPlus} color={C.teal} badge="Action" label="Referral opportunities identified" sub="12 clients with strong referral signals this month" onClick={() => onNavigate("sub-503", "ag-05", "Client Acquisition Agent")} />
          <RecRow icon={AlertCircle} color={C.amber} badge="Timing" label="Life event triggers found" sub="8 prospects with recent life changes — ideal timing" onClick={() => onNavigate("sub-501", "ag-05", "Client Acquisition Agent")} />
        </div>
      </div>
    </div>
  );
}

function InvestmentInsightsCard({ onNavigate }) {
  const spark = [2.1, 2.25, 2.2, 2.38, 2.33, 2.48, 2.55, 2.6, 2.64, 2.67];
  const harvest = [
    { value: 12 }, { value: 8 }, { value: 15 }, { value: -5 },
    { value: 19 }, { value: 22 }, { value: -8 }, { value: 28 }, { value: 74 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.amberBg} 0%, #120d00 100%)`, border: `1px solid ${C.amberBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.amber, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>Revenue Opportunity</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.amber, lineHeight: 1, letterSpacing: "-0.02em" }}>$2.67M</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#120d00", color: C.amber, border: `1px solid ${C.amberBorder}` }}>AI-identified</span>
            <span style={{ fontSize: 11, color: C.textDim }}>Potential annual revenue impact</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HeroSparkline data={spark} color={C.amber} width={180} height={56} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Opportunity trend ($M)</div>
        </div>
      </div>

      <div>
        <SL label="Portfolio Overview" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Rebalance" value="494" sub="accounts" color={C.amber} />
          <StatTile label="Tax Loss" value="193" sub="candidates" color={C.coral} />
          <StatTile label="High Cash" value="798" sub="CMA accounts" color={C.blue} />
          <StatTile label="Underallocated" value="147" sub="portfolios" color={C.purple} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <SL label="Strategy Focus" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Brokerage Shift", "$892M", "eligible AUM", C.teal, C.tealBg, C.tealBorder],
              ["Tax Loss Pool", "$74M", "harvestable", C.coral, C.coralBg, C.coralBorder],
              ["ESG Eligible", "$1.2B", "screened AUM", C.teal, C.tealBg, C.tealBorder]].map(([label, val, sub, color, bg, border]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8 }}>{label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color }}>{val}</div>
                </div>
                <span style={{ fontSize: 10, color, opacity: 0.6 }}>{sub}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <SL label="Harvest Opportunities ($M)" />
          <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", height: "calc(100% - 24px)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
            <CashFlowBars data={harvest} posColor={C.amber} negColor={C.coral} width={160} height={56} />
            <div style={{ display: "flex", gap: 12, fontSize: 10, color: C.textDim }}>
              <span style={{ color: C.amber }}>▮ Gains</span>
              <span style={{ color: C.coral }}>▮ Losses</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={TrendingUp} color={C.amber} badge="494 accts" label="Rebalance portfolios for growth" sub="Accounts showing drift beyond tolerance bands" onClick={() => onNavigate("sub-301", "ag-03", "Investment Agent")} />
          <RecRow icon={DollarSign} color={C.coral} badge="$74M" label="Tax loss harvesting available" sub="193 accounts with harvestable losses before year-end" onClick={() => onNavigate("prompts-101", "ag-01", "Portfolio Financials Intelligence")} />
          <RecRow icon={Activity} color={C.blue} badge="$1.69B" label="Transition to managed solutions" sub="Cash accounts eligible for advisory shift" onClick={() => onNavigate("sub-302", "ag-03", "Investment Agent")} />
        </div>
      </div>
    </div>
  );
}

function MarketSummaryCard({ onNavigate }) {
  const spark = [4420, 4380, 4450, 4510, 4490, 4530, 4580, 4560, 4610, 4625];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.purpleBg} 0%, #0a0520 100%)`, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>S&P 500</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.purple, lineHeight: 1, letterSpacing: "-0.02em" }}>4,625</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#0a0520", color: C.teal, border: `1px solid ${C.tealBorder}` }}>▲ +1.3% today</span>
            <span style={{ fontSize: 11, color: C.textDim }}>Markets open</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HeroSparkline data={spark} color={C.purple} width={180} height={56} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>10-day S&P 500 trend</div>
        </div>
      </div>
      <div>
        <SL label="Key Indices" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Dow Jones" value="38,420" sub="▲ +0.9%" color={C.teal} />
          <StatTile label="NASDAQ" value="16,284" sub="▲ +1.8%" color={C.teal} />
          <StatTile label="10Y Treasury" value="4.42%" sub="▼ -3bps" color={C.amber} />
          <StatTile label="VIX" value="14.2" sub="Low volatility" color={C.blue} />
        </div>
      </div>
      <div>
        <SL label="Sector Performance (Today)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Technology" value="+2.1%" color={C.teal} />
          <StatTile label="Financials" value="+1.4%" color={C.teal} />
          <StatTile label="Energy" value="-0.8%" color={C.coral} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={TrendingUp} color={C.teal} badge="Overweight" label="Tech sector momentum — review allocations" sub="Client portfolios may be underweight vs benchmark" onClick={() => onNavigate("sub-302", "ag-03", "Investment Agent")} />
          <RecRow icon={AlertCircle} color={C.amber} badge="Rate risk" label="Rate environment shift — fixed income review" sub="10Y yield movement impacts bond-heavy portfolios" onClick={() => onNavigate("sub-803", "ag-08", "Market Data Intelligence")} />
          <RecRow icon={Activity} color={C.purple} badge="34 stocks" label="Earnings season starting — alerts set" sub="34 client holdings reporting this week" onClick={() => onNavigate("sub-804", "ag-08", "Market Data Intelligence")} />
        </div>
      </div>
    </div>
  );
}

function PracticeKPIsCard({ onNavigate }) {
  const growth = [285, 298, 310, 325, 338, 352];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ background: `linear-gradient(135deg, #0a1420 0%, ${C.blueBg} 100%)`, border: `1px solid ${C.blueBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.blue, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>Annual Revenue Run Rate</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.blue, lineHeight: 1, letterSpacing: "-0.02em" }}>$8.84M</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: C.blueBg, color: C.teal, border: `1px solid ${C.tealBorder}` }}>▲ 12.4% YoY</span>
            <span style={{ fontSize: 11, color: C.textDim }}>Fee-based revenue</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <HeroSparkline data={growth} color={C.blue} width={180} height={56} />
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>Client count growth (6mo)</div>
        </div>
      </div>
      <div>
        <SL label="Practice Health" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Retention" value="97.2%" sub="↑ from 96.1%" color={C.teal} />
          <StatTile label="NPS Score" value="72" sub="Excellent" color={C.blue} />
          <StatTile label="New Clients" value="+23" sub="YTD" color={C.teal} />
          <StatTile label="AUM Growth" value="+$480M" sub="YTD net new" color={C.amber} />
        </div>
      </div>
      <div>
        <SL label="Compliance Status" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Reviews Due" value="8" sub="Next 30 days" color={C.amber} />
          <StatTile label="Disclosures" value="100%" sub="All current" color={C.teal} />
          <StatTile label="Suitability" value="2 pending" sub="Needs review" color={C.coral} onClick={() => onNavigate("sub-903", "ag-09", "My Practice")} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={AlertCircle} color={C.amber} badge="8 due" label="Annual reviews due this month" sub="2 clients have incomplete suitability profiles" onClick={() => onNavigate("sub-903", "ag-09", "My Practice")} />
          <RecRow icon={DollarSign} color={C.blue} badge="Q2 ready" label="Revenue dashboard — Q2 summary ready" sub="Fee income up 12.4% — full breakdown available" onClick={() => onNavigate("sub-901", "ag-09", "My Practice")} />
          <RecRow icon={TrendingUp} color={C.teal} badge="On track" label="Practice growth on target" sub="352 clients · $5.53B AUM · 97.2% retention" onClick={() => onNavigate("sub-902", "ag-09", "My Practice")} />
        </div>
      </div>
    </div>
  );
}

function WealthPlanningCard({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.purpleBg} 0%, #080415 100%)`, border: `1px solid ${C.purpleBorder}`, borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: C.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, opacity: 0.8 }}>Planning Opportunities</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: C.purple, lineHeight: 1, letterSpacing: "-0.02em" }}>47</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#080415", color: C.purple, border: `1px solid ${C.purpleBorder}` }}>Clients needing review</span>
            <span style={{ fontSize: 11, color: C.textDim }}>This quarter</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingTop: 4 }}>
          {[["Retirement", 18, C.purple], ["Estate", 12, C.blue], ["Education", 9, C.teal], ["Tax", 8, C.amber]].map(([label, val, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, width: 160 }}>
              <span style={{ fontSize: 10, color: C.textDim, width: 58 }}>{label}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
                <div style={{ width: `${(val / 18) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, color, fontWeight: 600, width: 18, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SL label="Planning Categories" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="Retirement" value="18" sub="Monte Carlo due" color={C.purple} />
          <StatTile label="Estate" value="12" sub="Beneficiary gaps" color={C.blue} />
          <StatTile label="Education" value="9" sub="529 reviews" color={C.teal} />
          <StatTile label="Tax" value="8" sub="Roth conversions" color={C.amber} />
        </div>
      </div>
      <div>
        <SL label="Priority Clients" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <StatTile label="RMD Due" value="23" sub="clients age 73+" color={C.coral} />
          <StatTile label="Life Events" value="11" sub="New triggers" color={C.purple} />
          <StatTile label="Plan Review" value="6" sub="Overdue 90+ days" color={C.amber} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <SL label="AI Recommendations" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RecRow icon={AlertCircle} color={C.coral} badge="23 clients" label="RMDs this year" sub="Required minimum distributions need to be processed" onClick={() => onNavigate("sub-401", "ag-04", "Wealth Planning Agent")} />
          <RecRow icon={TrendingUp} color={C.amber} badge="Window open" label="Roth conversion opportunity" sub="8 clients in lower bracket — optimal timing now" onClick={() => onNavigate("sub-404", "ag-04", "Wealth Planning Agent")} />
          <RecRow icon={Star} color={C.purple} badge="12 clients" label="Estate plan gaps identified" sub="Outdated beneficiaries or missing trust structures" onClick={() => onNavigate("sub-402", "ag-04", "Wealth Planning Agent")} />
        </div>
      </div>
    </div>
  );
}

function CardContent({ cardId, onNavigate }) {
  switch (cardId) {
    case "book-of-business":    return <BookOfBusinessCard onNavigate={onNavigate} />;
    case "client-acquisition":  return <ClientAcquisitionCard onNavigate={onNavigate} />;
    case "investment-insights": return <InvestmentInsightsCard onNavigate={onNavigate} />;
    case "market-summary":      return <MarketSummaryCard onNavigate={onNavigate} />;
    case "practice-kpis":       return <PracticeKPIsCard onNavigate={onNavigate} />;
    case "wealth-planning":     return <WealthPlanningCard onNavigate={onNavigate} />;
    default: return <div style={{ color: C.textDim, padding: 20 }}>Card not found</div>;
  }
}

// ── Add Card Modal ─────────────────────────────────────────────────────────────
function AddCardModal({ currentCards, onAdd, onClose }) {
  const available = CARD_CATALOG.filter(c => !currentCards.includes(c.id));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 14, width: 480, maxHeight: 520, display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Add Card to Canvas</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {available.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: C.textDim, fontSize: 13 }}>All available cards are already on your canvas.</div>
          ) : available.map(card => {
            const Icon = card.icon;
            const color = COLOR_MAP[card.color];
            const bg = BG_MAP[card.color];
            const border = BR_MAP[card.color];
            const [hov, setHov] = useState(false);
            return (
              <div key={card.id}
                onClick={() => { onAdd(card.id); onClose(); }}
                onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 10, border: `1px solid ${hov ? border : C.border}`, background: hov ? bg : C.surface2, cursor: "pointer", transition: "all 0.15s" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: hov ? color : C.text, marginBottom: 3 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: C.textDim }}>{card.desc}</div>
                </div>
                <Plus size={16} color={hov ? color : C.textDim} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Session Name Modal ────────────────────────────────────────────────────────
function NewSessionModal({ onConfirm, onClose }) {
  const [name, setName] = useState("New Session");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 28, width: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>Create New Canvas</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Canvas name</div>
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") onConfirm(name); if (e.key === "Escape") onClose(); }}
          style={{ width: "100%", padding: "9px 12px", background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => onConfirm(name)} style={{ padding: "8px 18px", borderRadius: 6, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Create Canvas</button>
        </div>
      </div>
    </div>
  );
}

// ── Main MyCanvasView ──────────────────────────────────────────────────────────
export default function MyCanvasView({ onNavigate }) {
  const [sessions, setSessions] = useState(() => loadSessions() || DEFAULT_SESSIONS);
  const [activeId, setActiveId] = useState(() => (loadSessions() || DEFAULT_SESSIONS)[0]?.id);
  const [cardIndex, setCardIndex] = useState(0);
  const [sessionDropOpen, setSessionDropOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);

  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const session = sessions.find(s => s.id === activeId) || sessions[0];
  const cards = session?.cards || [];
  const totalCards = cards.length;

  function handleNavigate(subKey, agentId, agentName) {
    if (onNavigate) onNavigate(subKey, agentId, agentName);
  }

  function addCard(cardId) {
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, cards: [...s.cards, cardId] } : s));
  }

  function removeCard(cardId) {
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, cards: s.cards.filter(c => c !== cardId) } : s));
    if (cardIndex >= cards.length - 1) setCardIndex(Math.max(0, cards.length - 2));
  }

  function createSession(name) {
    const s = { id: `session-${Date.now()}`, name, createdAt: new Date().toISOString(), cards: ["book-of-business"] };
    setSessions(prev => [...prev, s]);
    setActiveId(s.id);
    setCardIndex(0);
    setShowNewSession(false);
  }

  function deleteSession(id) {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeId === id) setActiveId(next[0]?.id);
      return next;
    });
  }

  function renameSession(id, name) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    setEditingId(null);
  }

  const currentCard = cards[cardIndex];
  const catalogCard = CARD_CATALOG.find(c => c.id === currentCard);
  const cardColor = catalogCard ? COLOR_MAP[catalogCard.color] : C.blue;
  const cardBg    = catalogCard ? BG_MAP[catalogCard.color]    : C.blueBg;
  const cardBorder= catalogCard ? BR_MAP[catalogCard.color]    : C.blueBorder;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>

      {/* Top bar */}
      <div style={{ padding: "11px 24px", borderBottom: `1px solid ${C.border}`, background: "#0c0d11", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        {/* Session selector */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setSessionDropOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.surface2, color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Zap size={13} color={C.blue} />
            {session?.name || "Select"}
            <ChevronDown size={12} color={C.textDim} />
          </button>
          {sessionDropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 10, zIndex: 30, minWidth: 230, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", overflow: "hidden" }}>
              {sessions.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", background: s.id === activeId ? C.blueBg : "transparent", borderLeft: `2px solid ${s.id === activeId ? C.blue : "transparent"}` }}
                  onMouseEnter={e => { if (s.id !== activeId) e.currentTarget.style.background = C.surface3; }}
                  onMouseLeave={e => { if (s.id !== activeId) e.currentTarget.style.background = "transparent"; }}>
                  {editingId === s.id ? (
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") renameSession(s.id, editName); if (e.key === "Escape") setEditingId(null); }}
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "3px 7px", fontSize: 12, color: C.text, fontFamily: "inherit", outline: "none" }} />
                  ) : (
                    <span onClick={() => { setActiveId(s.id); setCardIndex(0); setSessionDropOpen(false); }} style={{ flex: 1, fontSize: 13, color: s.id === activeId ? C.blue : C.textMid }}>{s.name}</span>
                  )}
                  <button onClick={e => { e.stopPropagation(); setEditingId(s.id); setEditName(s.name); }}
                    style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", padding: 2 }}><Edit2 size={11} /></button>
                  {sessions.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); deleteSession(s.id); }}
                      style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", display: "flex", padding: 2 }}><Trash2 size={11} /></button>
                  )}
                </div>
              ))}
              <div onClick={() => { setSessionDropOpen(false); setShowNewSession(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", cursor: "pointer", borderTop: `1px solid ${C.border}`, color: C.blue, fontSize: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = C.surface3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Plus size={12} /> New Canvas
              </div>
            </div>
          )}
        </div>

        <span style={{ fontSize: 11, color: C.textDim }}>Last updated: Today, 7:02 AM</span>

        {/* Card nav dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <button onClick={() => setCardIndex(i => Math.max(0, i - 1))} disabled={cardIndex === 0}
            style={{ width: 28, height: 28, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border}`, color: cardIndex === 0 ? C.textDim : C.textMid, cursor: cardIndex === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cardIndex === 0 ? 0.4 : 1 }}>
            <ChevronLeft size={14} />
          </button>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {cards.map((_, i) => (
              <div key={i} onClick={() => setCardIndex(i)}
                style={{ width: i === cardIndex ? 20 : 6, height: 6, borderRadius: 3, background: i === cardIndex ? cardColor : C.border2, cursor: "pointer", transition: "all 0.2s" }} />
            ))}
          </div>
          <button onClick={() => setCardIndex(i => Math.min(totalCards - 1, i + 1))} disabled={cardIndex === totalCards - 1}
            style={{ width: 28, height: 28, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border}`, color: cardIndex === totalCards - 1 ? C.textDim : C.textMid, cursor: cardIndex === totalCards - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: cardIndex === totalCards - 1 ? 0.4 : 1 }}>
            <ChevronRight size={14} />
          </button>
          <span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>{cardIndex + 1} / {totalCards}</span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <RefreshCw size={12} /> Refresh All
          </button>
          {currentCard && (
            <button onClick={() => removeCard(currentCard)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              <X size={12} /> Remove
            </button>
          )}
          <button onClick={() => setShowAddCard(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${cardBorder}`, background: cardBg, color: cardColor, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            <Plus size={12} /> Add Card
          </button>
        </div>
      </div>

      {/* Card area — single card, full width */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {currentCard ? (
          <div style={{ background: C.surface, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: "22px 24px", minHeight: "calc(100% - 40px)" }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              {catalogCard && (
                <div style={{ width: 34, height: 34, borderRadius: 9, background: cardBg, border: `1px solid ${cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <catalogCard.icon size={16} color={cardColor} />
                </div>
              )}
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{catalogCard?.title || currentCard}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>Morning Briefing · Today, 7:02 AM</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 4, background: cardBg, color: cardColor, border: `1px solid ${cardBorder}` }}>
                ● Live
              </span>
            </div>
            <CardContent cardId={currentCard} onNavigate={handleNavigate} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14, color: C.textDim }}>
            <div style={{ fontSize: 14, color: C.textMuted }}>No cards on this canvas yet.</div>
            <button onClick={() => setShowAddCard(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 7, border: `1px solid ${C.blueBorder}`, background: C.blueBg, color: C.blue, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <Plus size={14} /> Add your first card
            </button>
          </div>
        )}
      </div>

      {showAddCard && <AddCardModal currentCards={cards} onAdd={addCard} onClose={() => setShowAddCard(false)} />}
      {showNewSession && <NewSessionModal onConfirm={createSession} onClose={() => setShowNewSession(false)} />}
    </div>
  );
}
