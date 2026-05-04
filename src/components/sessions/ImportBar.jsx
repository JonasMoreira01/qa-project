import { useState, useEffect } from "react";
import { fetchClickUpTask, extractTaskId } from "../../lib/clickup";
import { createQASession } from "../../lib/firestore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function ImportBar({ onOpen }) {
  const [taskInput, setTaskInput] = useState("");
  const [qaAnalyst, setQaAnalyst] = useState(() => localStorage.getItem("qa_analyst") || "");
  const [isEditingAnalyst, setIsEditingAnalyst] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!qaAnalyst) {
      setIsEditingAnalyst(true);
    }
  }, [qaAnalyst]);

  const handleImport = async () => {
    if (!taskInput.trim()) return;
    if (!qaAnalyst.trim()) {
      setError("Informe seu nome primeiro.");
      setIsEditingAnalyst(true);
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const taskId = extractTaskId(taskInput);
      const taskData = await fetchClickUpTask(taskId);
      const id = await createQASession({
        taskId,
        taskData,
        qaAnalyst: qaAnalyst.trim(),
      });
      localStorage.setItem("qa_analyst", qaAnalyst.trim());
      setTaskInput("");
      onOpen(id);
    } catch (e) {
      setError(e.message || "Erro ao importar tarefa.");
    } finally {
      setImporting(false);
    }
  };

  const handleAnalystSave = (value) => {
    setQaAnalyst(value);
    if (value.trim()) {
      localStorage.setItem("qa_analyst", value.trim());
      setIsEditingAnalyst(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isEditingAnalyst && qaAnalyst.trim()) {
        handleAnalystSave(qaAnalyst);
      } else if (taskInput.trim()) {
        handleImport();
      }
    }
    if (e.key === "Escape") {
      if (isEditingAnalyst && qaAnalyst) {
        setIsEditingAnalyst(false);
      }
    }
  };

  return (
    <div className="sticky top-[60px] z-40 bg-[var(--color-bg-base)]/80 backdrop-blur-md border-b border-[var(--color-border)]/50">
      <div className="max-w-3xl mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          {isEditingAnalyst ? (
            <Input
              placeholder="Seu nome"
              value={qaAnalyst}
              onChange={(e) => setQaAnalyst(e.target.value)}
              onBlur={() => qaAnalyst && handleAnalystSave(qaAnalyst)}
              onKeyDown={handleKeyDown}
              className="w-40 text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingAnalyst(true)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-subtle)] transition-all"
            >
              <span className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-[var(--color-text-inverse)] text-xs font-medium flex items-center justify-center">
                {qaAnalyst.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[100px] truncate">{qaAnalyst}</span>
              <svg className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}

          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {importing ? (
                <svg className="w-4 h-4 animate-spin text-[var(--color-accent)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0a12 12 0 0 0 12 12h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              )}
            </div>
            <Input
              placeholder={importing ? "Importando..." : "Colar link ou ID da tarefa ClickUp... (Enter)"}
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={importing}
              className="pl-12 pr-20 bg-[var(--color-bg-subtle)]/50 border-transparent focus:border-[var(--color-accent)] focus:bg-[var(--color-bg-subtle)] transition-all"
            />
          </div>

          <Button 
            onClick={handleImport} 
            disabled={importing || !taskInput.trim()} 
            className="shrink-0"
            size="sm"
          >
            {importing ? (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0a12 12 0 0 0 12 12h-4z" />
              </svg>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Importar
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-[var(--color-error)] flex items-center gap-2 animate-in slide-in-from-top-1">
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}