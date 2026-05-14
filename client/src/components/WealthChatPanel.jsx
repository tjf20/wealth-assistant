// client/src/components/WealthChatPanel.jsx
// Definitive fix for [object Object]:
//   - Uses a self-contained useLocalChat hook (no shared useChat dependency)
//   - Explicit String() coercion on ALL content before storing or rendering
//   - Calls /api/chat directly via fetch

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Paperclip, ChevronRight, X, Zap, MessageSquare, ChevronDown, ChevronUp, Play } from "lucide-react";
import { useTheme } from "../theme.js";
import clientsData from "../data/clients.json";

const CLIENTS = Array.isArray(clientsData) ? clientsData : [];

const CTX_LABELS = {
  canvas:"Home", agents:"Agent Control Center",
  customWorkspace:"Custom Workspace", clients:"My Clients",
  projectCenter:"Custom Workspace", projectDetail:"Workspace Detail",
};
const CHIPS = {
  canvas:    ["What needs attention today?","Show at-risk clients","Summarize book activity"],
  agents:    ["Which agents ran today?","Schedule Tax Loss Harvesting","Show queued jobs"],
  clients:   ["Find clients with idle cash","Who needs a review?","Show HNW clients"],
  projectCenter: ["Open latest workspace","Create new workspace"],
  projectDetail: ["Summarize this project","Run the agent now"],
};
const QUICK_AGENTS = [
  { id:"sub-101", name:"Tax Loss Harvesting" },
  { id:"sub-105", name:"Client Outreach Draft" },
  { id:"sub-104", name:"Morning Briefing" },
  { id:"sub-202", name:"At-Risk Alerts" },
];

function fmtTime(ts) {
  const d = new Date(ts);
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m < 10 ? "0" : ""}${m} ${ap}`;
}
function fmtAUM(accounts) {
  const t = (Array.isArray(accounts) ? accounts : []).reduce((s, a) => s + (a.netValue || 0), 0);
  return t >= 1e9 ? `$${(t/1e9).toFixed(2)}B` : t >= 1e6 ? `$${(t/1e6).toFixed(1)}M` : `$${(t/1e3).toFixed(0)}K`;
}

// ── Self-contained chat hook — eliminates all [object Object] sources ──────────
function useLocalChat(systemCtx, advisorName) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Good morning, ${advisorName}. How can I help with your book of business today?`, _ts: Date.now() }
  ]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const send = useCallback(async (rawText) => {
    const text = String(rawText || "").trim();
    if (!text) return;

    const userMsg = { role: "user", content: text, _ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      // Only send user + previously sent assistant turns
      const apiMsgs = [...messagesRef.current, userMsg]
        .filter(m => m.role === "user" || (m.role === "assistant" && m._sent))
        .map(m => ({ role: m.role, content: String(m.content || "") }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs, systemContext: systemCtx, advisorName }),
      });

      const data = await res.json();
      // Guaranteed string extraction — handles any server response shape
      let replyText;
      if (typeof data.reply === "string") {
        replyText = data.reply;
      } else if (data.error) {
        replyText = `Error: ${String(data.error)}`;
      } else {
        replyText = "I encountered an issue. Please try again.";
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: replyText,
        _sent: true,
        _ts: Date.now(),
      }]);
    } catch (err) {
      setError("Connection error — check your API key in .env");
    } finally {
      setLoading(false);
    }
  }, [systemCtx, advisorName]);

  return { messages, loading, error, send };
}

// ── @Mention dropdown ─────────────────────────────────────────────────────────
function MentionDropdown({ query, agentData, onSelect }) {
  const C = useTheme();
  const lc = String(query || "").toLowerCase();

  const clients = CLIENTS
    .filter(c => String(c.name || "").toLowerCase().includes(lc))
    .slice(0, 4)
    .map(c => ({
      type: "Client",
      label: String(c.name),  // always a string
      sub: `${c.type} · ${Array.isArray(c.accounts) ? c.accounts.length : 0} accts · ${fmtAUM(c.accounts)}`,
    }));

  const agents = Object.entries(agentData || {})
    .filter(([k]) => k.startsWith("sub-ag-"))
    .flatMap(([, items]) => items.filter(i => i.runnable))
    .filter(a => String(a.name || "").toLowerCase().includes(lc))
    .slice(0, 3)
    .map(a => ({ type: "Agent", label: String(a.name), sub: a.scope === "both" ? "Book or Individual" : (a.scope || "Book") }));

  const all = [...clients, ...agents];
  if (!all.length) return null;

  const tag = {
    Client: { bg: C.blueBg, text: C.accent, border: C.blueBorder },
    Agent:  { bg: C.amberBg, text: C.amberText, border: C.amberBorder },
  };

  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden", marginBottom:6, background:C.surface }}>
      <div style={{ padding:"4px 10px", fontSize:10, fontWeight:700, color:C.textHint, background:C.surface2, borderBottom:`1px solid ${C.border}`, textTransform:"uppercase", letterSpacing:".07em" }}>@mention</div>
      {all.map((item, i) => {
        const ts = tag[item.type] || tag.Agent;
        return (
          <div key={i} onMouseDown={() => onSelect(String(item.label))}
            style={{ padding:"8px 10px", display:"flex", alignItems:"center", gap:8, cursor:"pointer", borderBottom: i < all.length-1 ? `1px solid ${C.border}` : "none" }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div style={{ width:26, height:26, borderRadius:7, background:ts.bg, border:`1px solid ${ts.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:ts.text, fontWeight:700, flexShrink:0 }}>{item.type[0]}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.label}</div>
              <div style={{ fontSize:10, color:C.textDim }}>{item.sub}</div>
            </div>
            <span style={{ fontSize:9, padding:"1px 6px", borderRadius:6, background:ts.bg, color:ts.text, border:`1px solid ${ts.border}`, flexShrink:0 }}>{item.type}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Message bubble — defensive rendering ──────────────────────────────────────
function MsgBubble({ msg }) {
  const C = useTheme();
  const isUser = msg.role === "user";

  // Guaranteed string — handles object, undefined, null, number, etc.
  const rawContent = msg.content;
  const textContent =
    typeof rawContent === "string" ? rawContent :
    rawContent && typeof rawContent === "object"
      ? (rawContent.text || rawContent.content || JSON.stringify(rawContent))
      : String(rawContent || "");

  // Split on @mentions (handles names with commas and spaces)
  const parts = textContent.split(/(@[A-Z][^\s@]{0,40})/g).filter(Boolean);

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems: isUser ? "flex-end" : "flex-start", gap:3 }}>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, flexDirection: isUser ? "row-reverse" : "row" }}>
        <div style={{ width:28, height:28, borderRadius:"50%", background: isUser ? C.accent : C.accentBg, border: isUser ? "none" : `1px solid ${C.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:10, fontWeight:700, color: isUser ? "#fff" : C.accent }}>
          {isUser ? "A" : <Zap size={12} />}
        </div>
        <div style={{ maxWidth:"75%", padding:"9px 12px", borderRadius: isUser ? "14px 14px 2px 14px" : "14px 14px 14px 2px", background: isUser ? C.accent : C.surface2, color: isUser ? "#fff" : C.text, border: isUser ? "none" : `1px solid ${C.border}`, fontSize:12, lineHeight:1.65, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
          {parts.map((p, i) =>
            p.startsWith("@") && p.length > 1
              ? <span key={i} style={{ background: isUser ? "rgba(255,255,255,0.25)" : C.accentBg, color: isUser ? "#fff" : C.accent, borderRadius:4, padding:"0 4px", fontWeight:600 }}>{p}</span>
              : <span key={i}>{p}</span>
          )}
        </div>
      </div>
      <div style={{ fontSize:10, color:C.textHint, paddingLeft: isUser ? 0 : 36, paddingRight: isUser ? 36 : 0 }}>
        {msg._ts ? fmtTime(msg._ts) : "Just now"}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WealthChatPanel({ advisorName, navView, agentData, workstationClient, onClearWorkstation, collapsed, onToggleCollapse }) {
  const C   = useTheme();
  const ctx = CTX_LABELS[navView] || navView || "Home";
  const chips = CHIPS[navView] || CHIPS.canvas;

  const systemCtx = [
    `You are Wealth Assistant, an AI co-pilot for ${advisorName}, a financial advisor.`,
    `Book of business: 352 clients, $5.53B AUM. Currently viewing: "${ctx}".`,
    workstationClient ? `Active workstation client: ${workstationClient.name} (${workstationClient.type}, ${fmtAUM(workstationClient.accounts)} AUM).` : "",
    "Be concise, professional, actionable. Reference clients by last name. Never fabricate financial data.",
  ].filter(Boolean).join(" ");

  const { messages, loading, error, send } = useLocalChat(systemCtx, advisorName);
  const [input,      setInput]      = useState("");
  const [mentionQ,   setMentionQ]   = useState(null);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const textareaRef = useRef(null);
  const msgsEndRef  = useRef(null);

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);

  function handleInput(e) {
    const val = e.target.value;
    setInput(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match  = before.match(/@([\w, ]*)$/);
    setMentionQ(match ? match[1] : null);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  }

  function insertMention(label) {
    const safeLabel = String(label);  // always a string
    const cursor = textareaRef.current?.selectionStart ?? input.length;
    const before = input.slice(0, cursor).replace(/@([\w, ]*)$/, `@${safeLabel} `);
    setInput(before + input.slice(cursor));
    setMentionQ(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function doSend() {
    const txt = input.trim();
    if (!txt) return;
    send(txt);
    setInput(""); setMentionQ(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  if (collapsed) return (
    <div onClick={onToggleCollapse} style={{ width:42, background:C.surface, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", alignItems:"center", paddingTop:12, flexShrink:0, cursor:"pointer" }}>
      <div style={{ width:26, height:26, borderRadius:8, background:C.accentBg, border:`1px solid ${C.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <MessageSquare size={13} color={C.accent} />
      </div>
    </div>
  );

  return (
    <div style={{ width:400, minWidth:400, background:C.surface, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ padding:"9px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:"#22C55E" }} />
        <span style={{ fontSize:12, fontWeight:700, color:C.text, flex:1 }}>Wealth Chat</span>
        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:C.accentBg, color:C.accent, border:`1px solid ${C.accentBorder}` }}>{ctx}</span>
        <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:C.surface2, color:C.textDim, border:`1px solid ${C.border}` }}>sonnet-4</span>
        <div onClick={onToggleCollapse} style={{ width:22, height:22, borderRadius:6, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textDim }}>
          <ChevronRight size={12} />
        </div>
      </div>

      {/* Client context */}
      {workstationClient ? (
        <div style={{ padding:"7px 12px", background:C.accentBg, borderBottom:`1px solid ${C.accentBorder}`, display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:26, height:26, borderRadius:"50%", background:C.accent, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>
            {String(workstationClient.name || "").split(",")[0].trim().slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{workstationClient.name}</div>
            <div style={{ fontSize:10, color:C.textDim }}>{fmtAUM(workstationClient.accounts)} AUM · {workstationClient.type}</div>
          </div>
          <span style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0", fontWeight:600, flexShrink:0 }}>✓ Synced</span>
          <button onClick={onClearWorkstation} style={{ background:"none", border:"none", cursor:"pointer", color:C.textDim, padding:0, display:"flex" }}><X size={13}/></button>
        </div>
      ) : (
        <div style={{ padding:"5px 12px", background:C.surface2, borderBottom:`1px solid ${C.border}`, fontSize:10, color:C.textHint, flexShrink:0 }}>
          No client context — type @name or select from My Clients
        </div>
      )}

      {/* Session divider */}
      <div style={{ textAlign:"center", padding:"5px 0", fontSize:10, color:C.textHint, flexShrink:0, background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
        Wealth Assistant · Session started
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:14 }}>
        {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
        {loading && (
          <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:C.accentBg, border:`1px solid ${C.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Zap size={12} color={C.accent}/></div>
            <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:"14px 14px 14px 2px", padding:"10px 14px", display:"flex", gap:4 }}>
              {[0,1,2].map(j=><span key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.textDim, display:"inline-block", animation:`wcp 1.2s ${j*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        {error && <div style={{ fontSize:11, color:C.danger, textAlign:"center", padding:"8px 12px", background:C.dangerBg, border:`1px solid ${C.dangerBorder}`, borderRadius:8 }}>{error}</div>}
        <div ref={msgsEndRef}/>
      </div>

      {/* @Mention */}
      {mentionQ !== null && (
        <div style={{ padding:"0 10px", flexShrink:0 }}>
          <MentionDropdown query={mentionQ} agentData={agentData} onSelect={insertMention}/>
        </div>
      )}

      {/* Quick Agents */}
      <div style={{ borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
        <button onClick={()=>setAgentsOpen(o=>!o)} style={{ width:"100%", padding:"7px 12px", background:"none", border:"none", display:"flex", alignItems:"center", gap:6, cursor:"pointer", color:C.textDim, fontSize:10, fontWeight:700, letterSpacing:".07em", textTransform:"uppercase", fontFamily:"inherit" }}>
          🔒 Quick Agents {agentsOpen ? <ChevronUp size={11} style={{marginLeft:"auto"}}/> : <ChevronDown size={11} style={{marginLeft:"auto"}}/>}
        </button>
        {agentsOpen && (
          <div style={{ padding:"4px 10px 10px", display:"flex", flexWrap:"wrap", gap:5 }}>
            {QUICK_AGENTS.map(a=>(
              <button key={a.id} onClick={()=>send(`Run ${a.name}${workstationClient?` for @${workstationClient.name}`:" for my book"}`)}
                style={{ padding:"5px 10px", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:8, fontSize:10, color:C.text, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5 }}
                onMouseEnter={e=>{e.currentTarget.style.background=C.accentBg;e.currentTarget.style.borderColor=C.accentBorder;e.currentTarget.style.color=C.accent;}}
                onMouseLeave={e=>{e.currentTarget.style.background=C.surface2;e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.text;}}>
                <Play size={9}/>{a.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chips */}
      <div style={{ padding:"6px 10px", borderTop:`1px solid ${C.border}`, display:"flex", flexWrap:"wrap", gap:5, flexShrink:0 }}>
        {chips.map(chip=>(
          <button key={chip} onClick={()=>send(chip)}
            style={{ padding:"4px 9px", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:12, fontSize:10, color:C.textDim, cursor:"pointer", fontFamily:"inherit", lineHeight:1.4 }}
            onMouseEnter={e=>{e.currentTarget.style.background=C.accentBg;e.currentTarget.style.color=C.accent;e.currentTarget.style.borderColor=C.accentBorder;}}
            onMouseLeave={e=>{e.currentTarget.style.background=C.surface2;e.currentTarget.style.color=C.textDim;e.currentTarget.style.borderColor=C.border;}}>
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding:"8px 10px", borderTop:`1px solid ${C.border}`, display:"flex", gap:6, alignItems:"flex-end", flexShrink:0 }}>
        <div style={{ width:28, height:28, borderRadius:7, background:C.surface2, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:C.textDim, flexShrink:0 }}><Paperclip size={13}/></div>
        <textarea ref={textareaRef} value={input} onChange={handleInput}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();doSend();}if(e.key==="Escape")setMentionQ(null);}}
          placeholder="Ask anything… type @ to mention a client or agent" rows={1}
          style={{ flex:1, padding:"7px 10px", border:`1px solid ${mentionQ!==null?C.accentBorder:C.border}`, borderRadius:8, fontSize:11, fontFamily:"inherit", color:C.text, background:C.surface2, resize:"none", outline:"none", lineHeight:1.5, minHeight:34, maxHeight:100, overflowY:"auto" }}/>
        <button onClick={doSend} disabled={!input.trim()} style={{ width:32, height:32, borderRadius:8, background:input.trim()?C.accent:C.surface2, border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:input.trim()?"pointer":"default", flexShrink:0 }}>
          <Send size={14} color={input.trim()?"#fff":C.textDim}/>
        </button>
      </div>
      <style>{`@keyframes wcp{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
