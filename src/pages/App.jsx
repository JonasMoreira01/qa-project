import { useState, useEffect, useCallback } from "react";
import { listQASessions } from "../lib/firestore";
import { SessionList } from "./SessionList";
import { SessionView } from "./SessionView";

export default function App() {
  const [view, setView] = useState("list");
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qa-theme");
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("qa-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listQASessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  const openSession = (id) => {
    setSessionId(id);
    setView("session");
  };

  const backToList = () => {
    setView("list");
    setSessionId(null);
    loadSessions();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors duration-300">
      {view === "list" ? (
        <SessionList
          sessions={sessions}
          loading={loading}
          onOpen={openSession}
          onRefresh={loadSessions}
          onNew={(id) => openSession(id)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <SessionView 
          sessionId={sessionId} 
          onBack={backToList}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}