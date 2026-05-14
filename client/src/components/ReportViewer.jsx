// client/src/components/ReportViewer.jsx
// Snazzy report viewer with SVG sparklines, bar charts, color-coded tables,
// email drafts, and rich financial report templates per agent type.

import { useState } from "react";
import { X, Download, FileText, TrendingUp, TrendingDown, Star, ArrowRight, CheckCircle, AlertTriangle, Clock, DollarSign, Users, BarChart2, Zap, Mail } from "lucide-react";
import { useTheme } from "../theme.js";

// ── SVG helpers ───────────────────────────────────────────────────────────────
function Sparkline({ data, color="#2dbe8a", width=100, height=32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const r = max - min || 1;
  const pts = data.map((v,i) => [(i/(data.length-1))*width, height-((v-min)/r)*(height-6)-3]);
  const line = pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible",flexShrink:0}}>
      <path d={`${line} L${width},${height} L0,${height} Z`} fill={color} fillOpacity=".12"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="3" fill={color} stroke="white" strokeWidth="1.5"/>
    </svg>
  );
}

function MiniBar({ data, width=180, height=48 }) {
  const max = Math.max(...data.map(d=>Math.abs(d.v||d)));
  const bw = (width/data.length)-3;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d,i) => {
        const v = d.v!==undefined?d.v:d, h=Math.abs(v)/max*(height-16), x=i*(width/data.length)+1.5;
        return <g key={i}><rect x={x} y={v>=0?height/2-h:height/2} width={bw} height={h} rx="2" fill={v>=0?"#2dbe8a":"#e06030"} fillOpacity=".85"/>{d.label&&<text x={x+bw/2} y={height} textAnchor="middle" fontSize="8" fill="#8a8fa8">{d.label}</text>}</g>;
      })}
      <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#2a2d3a" strokeWidth=".5" strokeDasharray="2,2"/>
    </svg>
  );
}

function DonutRing({ pct, color="#2dbe8a", size=64 }) {
  const r = (size-8)/2, circ = 2*Math.PI*r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e2029" strokeWidth="7"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeDasharray={`${pct/100*circ} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, spark, color="#3a7de9", bg="#152640", border="#2a4a8a" }) {
  return (
    <div style={{ flex:1, minWidth:130, background:bg, border:`1px solid ${border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:color, opacity:.08 }}/>
      <div style={{ fontSize:10, color:color, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:"#eceef5", fontFamily:"monospace", marginBottom:2 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"#8a8fa8" }}>{sub}</div>}
      {trend && (
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:5 }}>
          {trend>0?<TrendingUp size={11} color="#2dbe8a"/>:<TrendingDown size={11} color="#e06030"/>}
          <span style={{ fontSize:11, color:trend>0?"#2dbe8a":"#e06030", fontWeight:600 }}>{trend>0?"+":""}{trend}%</span>
        </div>
      )}
      {spark && <div style={{ position:"absolute", bottom:8, right:8, opacity:.5 }}><Sparkline data={spark} color={color} width={60} height={22}/></div>}
    </div>
  );
}

// ── Report content generators ─────────────────────────────────────────────────
export function generateReportContent(agentId, agentName, clientName, scope) {
  const ts = new Date().toLocaleString("en-US",{month:"long",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const isBook = !clientName || scope==="book";
  const subject = isBook ? "Book of Business" : clientName;
  const firstName = clientName ? clientName.split(",")[1]?.trim()||clientName.split(",")[0] : "Client";

  const templates = {

    "sub-101": {
      type:"tax-loss", title:"Tax Loss Harvesting — Opportunities Report",
      agentName:"Tax Loss Harvesting", agentId:"sub-101", subject, scope,
      summary:`Identified $87,400 in harvestable tax losses across ${isBook?"352 client accounts":clientName+"`s portfolio"}. 14 positions qualify for immediate action.`,
      generatedAt:ts,
      stats:[
        { label:"Est. Tax Savings",  value:"$87,400", sub:"At 23.8% rate",       trend:12,  spark:[40,55,48,62,71,80,87], color:"#2dbe8a", bg:"#0a2820", border:"#1a6a50" },
        { label:"Accounts Flagged",  value:"14",      sub:`Of ${isBook?352:1} total`, trend:null, spark:[4,6,8,9,11,13,14], color:"#7db8ff", bg:"#152640", border:"#2a4a8a" },
        { label:"Harvest Deadline",  value:"Dec 29",  sub:"6 business days",     trend:null, color:"#e09040", bg:"#221800", border:"#5a3a10" },
        { label:"Largest Harvest",   value:"$12,400", sub:`${isBook?"Anderson · NVDA":clientName+" · Top position"}`, color:"#f07850", bg:"#221008", border:"#6a3020" },
      ],
      table:{
        title:"Top Harvesting Opportunities",
        headers:["#","Client","Account","Security","Unrealized Loss","Replacement","Deadline","Priority"],
        rows:[
          [1,"Anderson, Robert","702-4521 (IRA)","NVDA","-$12,400","→ BRK-B","Dec 29","HIGH"],
          [2,"Chen, David","702-7823 (CMA)","META","-$8,900","→ GOOGL","Dec 29","HIGH"],
          [3,"Torres, Maria","702-3301 (IRA)","XPEV","-$6,200","→ NIO","Dec 28","HIGH"],
          [4,"Williams, James","702-9102 (CMA)","INTC","-$5,800","→ AMD","Dec 29","MED"],
          [5,"Kim, Sophie","702-5544 (IRRA)","PYPL","-$4,100","→ SQ","Dec 28","MED"],
          [6,"Brown, Michael","702-1120 (CMA)","RBLX","-$3,900","→ EA","Dec 29","MED"],
          [7,"Davis, Patricia","702-8870 (IRA)","LYFT","-$2,800","→ UBER","Dec 27","LOW"],
        ],
        priorityCol:7,
      },
      cashflow:[{v:240,label:"Jun"},{v:-80,label:"Jul"},{v:320,label:"Aug"},{v:-120,label:"Sep"},{v:410,label:"Oct"},{v:280,label:"Nov"},{v:520,label:"Dec"}],
      notes:"All recommended substitutions respect the IRS 30-day wash-sale rule (Rev. Rul. 2008-5). Execute all trades before market close on the deadline date. Document in compliance audit trail.",
      actions:["Execute trades via custodian by Dec 29 market close","Document all harvesting decisions in Salesforce","Verify replacement securities are in approved list","Re-run analysis in January for Q1 opportunities"],
    },

    "sub-203": {
      type:"at-risk", title:"At-Risk Client Alerts — Priority Action Report",
      agentName:"At-Risk Client Alerts", agentId:"sub-203", subject:"Book of Business", scope:"book",
      summary:"AI scan of 352 client accounts identified 14 clients requiring immediate attention based on withdrawal patterns, contact gaps, and life event signals.",
      generatedAt:ts,
      stats:[
        { label:"At-Risk Clients",  value:"14",     sub:"High churn risk",      trend:21,  spark:[5,7,8,9,11,12,14], color:"#f07850", bg:"#221008", border:"#6a3020" },
        { label:"AUM at Risk",      value:"$89.4M", sub:"3.4% of book value",   trend:null, color:"#e09040", bg:"#221800", border:"#5a3a10" },
        { label:"Avg Contact Gap",  value:"73 days",sub:"High churn threshold", trend:null, color:"#a882ff", bg:"#180f30", border:"#4a3080" },
        { label:"Actions Required", value:"8",      sub:"Due this week",        trend:null, color:"#7db8ff", bg:"#152640", border:"#2a4a8a" },
      ],
      table:{
        title:"At-Risk Client Roster — High Priority",
        headers:["Client","AUM","Risk Signal","Last Contact","AUM at Risk","Action","Due"],
        rows:[
          ["Smith, Patricia","$1.2M","Large withdrawal ($120K CMA)","61 days","$1.2M","Call immediately","Today"],
          ["Johnson, Marcus","$890K","No contact — 94 day gap","94 days","$890K","Schedule review","Mon"],
          ["Rodriguez, Ana","$2.1M","Estate change signal (Finra)","28 days","$2.1M","Confirm beneficiary","Tue"],
          ["Lee, Jennifer","$670K","RMD not taken — deadline near","45 days","$670K","Process RMD","Dec 31"],
          ["Brown, Thomas","$440K","New employer (rollover opp.)","12 days","$440K","Rollover outreach","Fri"],
          ["Park, Christina","$780K","Large wire transfer intent","3 days","$780K","Wire review call","Today"],
          ["Nguyen, Daniel","$320K","Account liquidation signal","5 days","$320K","Retention call","Today"],
        ],
        priorityCol:-1,
        highlightCol:6,
      },
      notes:"Churn risk score is calculated using withdrawal velocity, contact frequency, and life event triggers. Clients scoring above 72 are flagged as at-risk.",
      actions:["Call Smith, Johnson, and Nguyen TODAY — high churn probability","Process Lee's RMD before December 31 deadline","Review Rodriguez estate documents with compliance","Set up rollover consultation with Brown","Document all outreach in Salesforce within 24 hours"],
    },

    "sub-105": {
      type:"outreach", title:"Client Outreach Draft — Personalized Email",
      agentName:"Client Outreach Draft", agentId:"sub-105", subject:clientName||"Selected Client", scope:"individual",
      summary:`Personalized outreach draft prepared for ${clientName||"selected client"}. AI analyzed recent portfolio activity, contact history, and market conditions.`,
      generatedAt:ts,
      stats:[
        { label:"Contact Gap",    value:"47 days",      sub:"Avg is 30",    color:"#e09040", bg:"#221800", border:"#5a3a10" },
        { label:"Portf. YTD",    value:"+8.3%",         sub:"vs +6.1% bm",  trend:8, spark:[5,5.5,5.2,6,7,8,8.3], color:"#2dbe8a", bg:"#0a2820", border:"#1a6a50" },
        { label:"Open Items",    value:"2",             sub:"Action needed", color:"#f07850", bg:"#221008", border:"#6a3020" },
        { label:"Sentiment",     value:"Positive",      sub:"AI analysis",  color:"#7db8ff", bg:"#152640", border:"#2a4a8a" },
      ],
      emailDraft:{
        to: firstName,
        subject: `Quick Check-In — Portfolio Update & Year-End Planning`,
        body:`Hi ${firstName},\n\nI hope you're doing well! I wanted to reach out as we approach year-end with a few things that are relevant to your portfolio.\n\n**Portfolio Performance**\nYour diversified allocation continues to perform well — up 8.3% YTD vs. a 6.1% benchmark. Particularly strong contributions came from your technology and healthcare positions.\n\n**Year-End Tax Opportunity**\nI've identified a potential tax-loss harvesting opportunity that could save you an estimated $4,200 in taxes this year. The deadline is December 29th, so I wanted to flag this early.\n\n**Upcoming RMD**\nBased on your account profile, you have an RMD due by December 31st. I've already initiated the process, but I'd like to confirm your preferred distribution method.\n\n**Next Steps**\nWould you have 20 minutes for a brief call this week? I'd love to review these items together and ensure your portfolio is well-positioned for 2026.\n\nWarm regards,\nJames Miller\nSenior Financial Advisor\nWealth Assistant | (702) 555-1782`,
      },
      notes:"Personalization was based on portfolio activity from the past 90 days and comparison to similar client profiles in the book.",
      actions:["Send email via Outlook — review personalization before sending","Log outreach attempt in Salesforce","Follow up by phone if no response in 48 hours","Schedule annual review if call connects"],
    },

    "default": {
      type:"generic", title:agentName,
      agentName, agentId, subject, scope, generatedAt:ts,
      summary:`${agentName} completed analysis of ${subject} on ${ts}.`,
      stats:[
        { label:"Records Analyzed", value:isBook?"352":"1",   color:"#7db8ff", bg:"#152640", border:"#2a4a8a" },
        { label:"Findings",         value:"8",                color:"#2dbe8a", bg:"#0a2820", border:"#1a6a50" },
        { label:"High Priority",    value:"3",                color:"#e09040", bg:"#221800", border:"#5a3a10" },
        { label:"Time Saved",       value:"~4.5 hrs",         color:"#a882ff", bg:"#180f30", border:"#4a3080" },
      ],
      table:{
        title:"Summary Findings",
        headers:["#","Finding","Category","Impact","Status"],
        rows:[
          [1,"Book AUM up 8.3% YTD","Performance","High","✓ On track"],
          [2,"14 at-risk clients flagged","Client Health","High","⚠ Action needed"],
          [3,"$89.4M idle cash opportunity","Revenue","High","⚠ Review"],
          [4,"8 annual reviews due Q1","Compliance","Medium","📅 Scheduled"],
          [5,"ESG screening gaps in 6 accts","Suitability","Medium","Review"],
          [6,"Market volatility — rate sensitivity","Portfolio","Low","Monitor"],
        ],
        priorityCol:-1,
      },
      notes:"Analysis completed using real-time data from custodian feeds and CRM activity logs.",
      actions:["Review high-priority findings within 24 hours","Update Salesforce with action items","Schedule follow-up agent run in 30 days"],
    },
  };

  const tpl = templates[agentId] || { ...templates["default"], title:agentName };
  return tpl;
}

// ── Report Viewer ─────────────────────────────────────────────────────────────
export default function ReportViewer({ report, onClose, onPin }) {
  const C = useTheme();
  const [pinned, setPinned] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  if (!report) return null;

  function handlePin() { setPinned(true); onPin?.(report); }

  const priorityColors = { HIGH:C.danger, MED:C.amberText, MEDIUM:C.amberText, LOW:C.textDim, Today:"#DC2626", Mon:C.amberText, Tue:C.amberText };
  const priorityBgs    = { HIGH:C.dangerBg, MED:C.amberBg, MEDIUM:C.amberBg, LOW:C.surface2 };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"min(960px,94vw)", height:"min(88vh,860px)", background:"#0c0d11", border:"1px solid #2a3a60", borderRadius:16, display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.6)", overflow:"hidden", animation:"rvIn 0.25s ease" }}>

        {/* Header */}
        <div style={{ padding:"16px 22px", borderBottom:"1px solid #1e2029", display:"flex", alignItems:"center", gap:12, flexShrink:0, background:"#0f1014" }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"#152640", border:"1px solid #2a4a8a", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FileText size={18} color="#7db8ff"/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:15, fontWeight:700, color:"#eceef5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{report.title}</div>
            <div style={{ fontSize:11, color:"#8a8fa8", marginTop:2 }}>{report.subject} · Generated {report.generatedAt}</div>
          </div>
          <div style={{ display:"flex", gap:8, flexShrink:0 }}>
            <button onClick={handlePin} disabled={pinned} style={{ padding:"6px 12px", background:pinned?"#181a22":"#152640", color:pinned?"#8a8fa8":"#7db8ff", border:`1px solid ${pinned?"#2a2d3a":"#2a4a8a"}`, borderRadius:7, fontSize:11, fontWeight:600, cursor:pinned?"default":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
              <Star size={12} fill={pinned?"#8a8fa8":"none"}/>{pinned?"Pinned":"Pin to Home"}
            </button>
            <button style={{ padding:"6px 12px", background:"transparent", color:"#8a8fa8", border:"1px solid #1e2029", borderRadius:7, fontSize:11, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}>
              <Download size={12}/>Export PDF
            </button>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:"1px solid #1e2029", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#8a8fa8" }}><X size={15}/></button>
          </div>
        </div>

        {/* Summary banner */}
        <div style={{ padding:"11px 22px", background:"#0a2820", borderBottom:"1px solid #1a6a50", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <CheckCircle size={15} color="#2dbe8a"/>
          <span style={{ fontSize:13, color:"#2dbe8a", fontWeight:500 }}>{report.summary}</span>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>

          {/* Stat cards */}
          {report.stats?.length > 0 && (
            <div style={{ display:"flex", gap:12, marginBottom:22, flexWrap:"wrap" }}>
              {report.stats.map((s,i) => <StatCard key={i} {...s}/>)}
            </div>
          )}

          {/* Cash flow chart if present */}
          {report.cashflow && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a8fa8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>Monthly Cash Flow Impact</div>
              <div style={{ background:"#13151e", border:"1px solid #1e2029", borderRadius:10, padding:"14px 16px", display:"flex", alignItems:"flex-end", gap:16 }}>
                <MiniBar data={report.cashflow} width={300} height={60}/>
                <div style={{ fontSize:11, color:"#8a8fa8" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}><span style={{ width:10, height:10, borderRadius:2, background:"#2dbe8a", display:"inline-block" }}/> Inflows</div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:"#e06030", display:"inline-block" }}/> Outflows</div>
                </div>
              </div>
            </div>
          )}

          {/* Data table */}
          {report.table && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a8fa8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>{report.table.title}</div>
              <div style={{ border:"1px solid #1e2029", borderRadius:10, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"#13151e" }}>
                      {report.table.headers.map((h,i) => (
                        <th key={i} style={{ padding:"9px 12px", textAlign:"left", fontWeight:600, color:"#8a8fa8", fontSize:10, letterSpacing:".05em", textTransform:"uppercase", borderBottom:"1px solid #1e2029" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.table.rows.map((row, ri) => (
                      <tr key={ri} style={{ borderBottom:"1px solid #1e2029" }}
                        onMouseEnter={e=>e.currentTarget.style.background="#152640"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        {row.map((cell, ci) => {
                          const isPriority = ci === report.table.priorityCol && typeof cell==="string";
                          const isHighlight = ci === report.table.highlightCol && typeof cell==="string";
                          const pColor = priorityColors[cell];
                          const pBg    = priorityBgs[cell];
                          return (
                            <td key={ci} style={{ padding:"9px 12px", color:ci===0?"#7a7e94":ci===1||ci===2?"#eceef5":"#b0b8d0", fontWeight:ci===1?600:400 }}>
                              {isPriority && pColor
                                ? <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:pBg||"transparent", color:pColor, border:`1px solid ${pColor}44`, fontWeight:700 }}>{cell}</span>
                                : isHighlight && pColor
                                ? <span style={{ color:pColor, fontWeight:700 }}>{cell}</span>
                                : cell.toString().startsWith("-")
                                ? <span style={{ color:"#e06030", fontWeight:700, fontFamily:"monospace" }}>{cell}</span>
                                : cell.toString().startsWith("+")
                                ? <span style={{ color:"#2dbe8a", fontWeight:700, fontFamily:"monospace" }}>{cell}</span>
                                : <span style={{ fontFamily:ci===0?"monospace":"inherit" }}>{cell}</span>
                              }
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Email draft */}
          {report.emailDraft && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a8fa8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>Drafted Outreach Email</div>
              <div style={{ border:"1px solid #2a4a8a", borderRadius:10, overflow:"hidden" }}>
                <div style={{ background:"#152640", padding:"10px 14px", borderBottom:"1px solid #2a4a8a" }}>
                  <div style={{ fontSize:11, color:"#8a8fa8" }}>To: <span style={{ color:"#eceef5", fontWeight:500 }}>{report.emailDraft.to}</span></div>
                  <div style={{ fontSize:11, color:"#8a8fa8", marginTop:2 }}>Subject: <span style={{ color:"#eceef5", fontWeight:600 }}>{report.emailDraft.subject}</span></div>
                </div>
                <div style={{ padding:16, background:"#13151e", fontSize:12, color:"#b0b8d0", lineHeight:1.8, whiteSpace:"pre-line" }}>
                  {report.emailDraft.body.replace(/\*\*(.+?)\*\*/g,"$1")}
                </div>
                <div style={{ padding:"10px 14px", borderTop:"1px solid #1e2029", display:"flex", gap:8 }}>
                  <button style={{ padding:"6px 14px", background:"#2563eb", color:"#fff", border:"none", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Send via Outlook</button>
                  <button style={{ padding:"6px 12px", background:"transparent", color:"#8a8fa8", border:"1px solid #1e2029", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }} onClick={()=>{navigator.clipboard.writeText(report.emailDraft.body);setCopiedEmail(true);setTimeout(()=>setCopiedEmail(false),1500);}}>
                    {copiedEmail?"Copied!":"Copy text"}
                  </button>
                  <button style={{ padding:"6px 12px", background:"transparent", color:"#8a8fa8", border:"1px solid #1e2029", borderRadius:6, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Log to Salesforce</button>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a8fa8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:8 }}>Compliance Notes</div>
              <div style={{ background:"#13151e", border:"1px solid #1e2029", borderRadius:10, padding:14, fontSize:12, color:"#b0b8d0", lineHeight:1.75 }}>{report.notes}</div>
            </div>
          )}

          {/* Action items */}
          {report.actions?.length > 0 && (
            <div style={{ marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#8a8fa8", letterSpacing:".06em", textTransform:"uppercase", marginBottom:10 }}>Recommended Actions</div>
              {report.actions.map((a,i) => (
                <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"9px 14px", background:"#13151e", border:"1px solid #1e2029", borderRadius:8, marginBottom:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#2dbe8a", background:"#0a2820", border:"1px solid #1a6a50", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                  <span style={{ fontSize:12, color:"#b0b8d0", lineHeight:1.5 }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 22px", borderTop:"1px solid #1e2029", display:"flex", gap:10, alignItems:"center", background:"#0f1014", flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:"8px 18px", background:"#2563eb", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Done</button>
          <span style={{ fontSize:11, color:"#5a5d6a" }}>Auto-saved to Reports tab · {report.generatedAt}</span>
        </div>
      </div>
      <style>{`@keyframes rvIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
