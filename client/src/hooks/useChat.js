// client/src/hooks/useChat.js
import { useState, useCallback } from "react";
import { api } from "../api.js";

export function useChat({ systemContext, advisorName } = {}) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Good morning${advisorName ? `, ${advisorName}` : ""}. How can I help with your book of business today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(async (userText) => {
    if (!userText.trim()) return;

    const userMsg = { role: "user", content: userText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);
    setError(null);

    try {
      // Only send actual user/assistant turns to the API (not the greeting)
      const apiMessages = nextMessages.filter(m => m.role === "user" || (m.role === "assistant" && m._sent));
      const { reply } = await api.chat(apiMessages, { systemContext, advisorName });
      const assistantMsg = { role: "assistant", content: reply, _sent: true };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [messages, systemContext, advisorName]);

  const clear = () => setMessages([]);

  return { messages, loading, error, send, clear };
}
