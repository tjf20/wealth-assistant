// client/src/App.jsx
import { useState, useEffect } from "react";
import WealthAssistant from "./components/WealthAssistant.jsx";

export default function App() {
  const [agentData, setAgentData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/agents")
      .then(r => r.json())
      .then(setAgentData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div style={{ color: "#d85a30", padding: 40, fontFamily: "monospace" }}>
      <strong>Could not load agent data.</strong><br />
      Make sure the Express server is running on port 3001.<br /><br />
      Error: {error}
    </div>
  );

  if (!agentData) return (
    <div style={{ color: "#5a5d6a", padding: 40, fontFamily: "'DM Sans', sans-serif" }}>
      Loading Wealth Assistant...
    </div>
  );

  return <WealthAssistant agentData={agentData} />;
}
