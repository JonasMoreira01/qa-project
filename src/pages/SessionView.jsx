import { useState, useEffect, useCallback } from "react";
import {
  getQASession,
  updateChecklist,
  saveResult,
  formatDuration,
} from "../lib/firestore";
import { useTimer } from "../hooks/useTimer";
import { TopNav } from "../components/layout/TopNav";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "testing": return "badge-testing";
    case "done": return "badge-done";
    default: return "badge-waiting";
  }
}

function formatMs(ms) {
  if (!ms) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export function SessionView({ sessionId, onBack, theme, onToggleTheme }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [result, setResult] = useState("");
  const [severity, setSeverity] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notes, setNotes] = useState("");
  const [bugs, setBugs] = useState([]);
  const [bugInput, setBugInput] = useState("");

  const timer = useTimer(sessionId, session);

  const load = useCallback(async () => {
    try {
      const data = await getQASession(sessionId);
      setSession(data);
      if (data.result) setResult(data.result);
      if (data.severity) setSeverity(data.severity);
      if (data.feedback) setFeedback(data.feedback);
      if (data.notes) setNotes(data.notes);
      if (data.bugs?.length) setBugs(data.bugs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, []);

  const toggleCheck = async (itemId) => {
    const updated = session.checklist.map((c) =>
      c.id === itemId ? { ...c, checked: !c.checked } : c
    );
    setSession((s) => ({ ...s, checklist: updated }));
    await updateChecklist(sessionId, updated);
  };

  const addBug = () => {
    if (!bugInput.trim()) return;
    setBugs((prev) => [
      ...prev,
      { id: Date.now().toString(), description: bugInput.trim() },
    ]);
    setBugInput("");
  };

  const removeBug = (id) => setBugs((prev) => prev.filter((b) => b.id !== id));

  const handleSaveResult = async () => {
    if (!result) return;
    setSaving(true);
    try {
      if (timer.running) await timer.stop();
      await saveResult(sessionId, { result, severity, feedback, notes, bugs });
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNav onRefresh={() => {}} theme={theme} onToggleTheme={onToggleTheme} showBack onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Carregando sessão...</p>
        </div>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopNav onRefresh={() => {}} theme={theme} onToggleTheme={onToggleTheme} showBack onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[var(--color-text-muted)]">Sessão não encontrada.</p>
        </div>
      </div>
    );
  }

  const task = session.taskData || {};
  const done = session.status === "done";
  const checklistDone = session.checklist?.filter((c) => c.checked).length || 0;
  const checklistTotal = session.checklist?.length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav onRefresh={load} theme={theme} onToggleTheme={onToggleTheme} showBack onBack={onBack} title={task.name?.slice(0, 30) || `Task #${session.taskId}`} />

      <main className="flex-1 overflow-auto max-w-3xl mx-auto w-full p-6 space-y-6">
        <Card className="bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-subtle)]/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn("badge", getStatusBadgeClass(session.status))}>
                  {session.status === "waiting" ? "Aguardando" : session.status === "testing" ? "Testando" : "Concluído"}
                </span>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--color-accent)] hover:underline font-medium"
                >
                  #{session.taskId}
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {formatDuration(session.totalTimeMs)}
              </div>
            </div>
            <CardTitle className="text-xl mt-3">{task.name}</CardTitle>
            <CardDescription className="text-[var(--color-text-secondary)] mt-1">
              {task.list} {task.folder && `• ${task.folder}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">Prioridade</span>
                <p className="font-medium flex items-center gap-1.5" style={{ color: task.priority?.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: task.priority?.color }}></span>
                  {task.priority?.label || "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">Status</span>
                <p className="font-medium">{task.status || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">Pontos</span>
                <p>{task.points || "—"}</p>
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide block mb-1">Analista</span>
                <p>{session.qaAnalyst}</p>
              </div>
            </div>

            {task.assignees?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide block mb-2">Responsáveis</span>
                <div className="flex gap-2">
                  {task.assignees.map((u) => (
                    <div
                      key={u.id}
                      className="w-8 h-8 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center text-xs font-medium border border-[var(--color-border)]"
                      title={u.name}
                    >
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.initials
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                {task.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-md bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-[var(--color-bg-subtle)]/50 border border-[var(--color-border)] rounded-xl p-6 text-center">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Tempo de teste</div>
          <div className="text-5xl font-semibold tracking-tight mb-4 font-mono text-[var(--color-text-primary)]">
            {formatMs(timer.displayMs)}
          </div>
          {!done && (
            <div className="flex gap-3 justify-center">
              {!timer.running ? (
                <Button onClick={timer.start} size="lg">
                  {session.status === "waiting" ? "▶ Iniciar teste" : "▶ Retomar"}
                </Button>
              ) : (
                <Button variant="secondary" size="lg" onClick={timer.pause}>
                  ⏸ Pausar
                </Button>
              )}
              {timer.running && (
                <Button variant="ghost" size="lg" onClick={timer.stop}>
                  ⏹ Parar
                </Button>
              )}
            </div>
          )}
          {done && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Tempo total: {formatDuration(session.totalTimeMs)}
            </p>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Checklist
              </CardTitle>
              <span className="text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] px-2 py-1 rounded">
                {checklistDone}/{checklistTotal}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-[var(--color-success)] transition-all duration-300"
                style={{
                  width: `${checklistTotal ? (checklistDone / checklistTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="space-y-2">
              {session.checklist?.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                    item.checked
                      ? "bg-[var(--color-success-bg)] border-transparent"
                      : "border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-text-muted)]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => !done && toggleCheck(item.id)}
                    disabled={done}
                    className="checkbox-custom"
                  />
                  <span className={cn("text-sm", item.checked && "line-through opacity-60")}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-error)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Bugs encontrados
              {bugs.length > 0 && (
                <span className="text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] px-2 py-0.5 rounded-full">
                  {bugs.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {!done && (
              <div className="flex gap-3 mb-4">
                <Input
                  className="flex-1"
                  placeholder="Descreva o bug..."
                  value={bugInput}
                  onChange={(e) => setBugInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addBug()}
                />
                <Button variant="secondary" onClick={addBug}>+ Add</Button>
              </div>
            )}
            <div className="space-y-2">
              {bugs.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] py-4 text-center bg-[var(--color-bg-subtle)]/50 rounded-lg">
                  Nenhum bug registrado
                </p>
              ) : (
                bugs.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 bg-[var(--color-error-bg)]/50 rounded-lg border border-[var(--color-error)]/20">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-error)] shrink-0" />
                    <span className="flex-1 text-sm">{b.description}</span>
                    {!done && (
                      <button
                        className="text-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] p-1"
                        onClick={() => removeBug(b.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Feedback / Observações
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <textarea
              className="form-textarea min-h-[120px]"
              placeholder="Descreva o que foi testado, comportamentos encontrados..."
              value={feedback}
              onChange={(e) => !done && setFeedback(e.target.value)}
              disabled={done}
              rows={5}
            />
          </CardContent>
        </Card>

        <Card className="border-[var(--color-warning)]/30 bg-[var(--color-warning-bg)]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-warning)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Notas internas
            </CardTitle>
            <CardDescription className="text-[var(--color-text-muted)] text-xs">Não visível para devs</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <textarea
              className="form-textarea min-h-[80px]"
              placeholder="Notas do QA para o time interno..."
              value={notes}
              onChange={(e) => !done && setNotes(e.target.value)}
              disabled={done}
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20,6 9,17 4,12"/>
              </svg>
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: "approved", label: "✓ Aprovado", icon: "✓" },
                { value: "approved_with_notes", label: "~ Aprovado c/ ressalvas", icon: "~" },
                { value: "reproved", label: "✕ Reprovado", icon: "✕" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={cn(
                    "result-option text-sm py-3",
                    result === opt.value && (
                      opt.value === "approved" ? "selected-approved" :
                      opt.value === "approved_with_notes" ? "selected-warning" : "selected-rejected"
                    )
                  )}
                  onClick={() => !done && setResult(opt.value)}
                  disabled={done}
                >
                  <span className="block text-lg mb-1">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>

            {(result === "reproved" || result === "approved_with_notes") && (
              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <div className="text-sm font-medium mb-3 text-[var(--color-text-secondary)]">Severidade</div>
                <div className="flex flex-wrap gap-2">
                  {["low", "medium", "high", "critical"].map((s) => (
                    <button
                      key={s}
                      className={cn(
                        "severity-btn px-4 py-2",
                        severity === s && `selected-${s}`
                      )}
                      onClick={() => !done && setSeverity(s)}
                      disabled={done}
                    >
                      {s === "low" ? "Baixa" : s === "medium" ? "Média" : s === "high" ? "Alta" : "Crítica"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!done && (
          <div className="flex items-center gap-4 pt-4 pb-8">
            <Button size="lg" onClick={handleSaveResult} disabled={saving || !result}>
              {saving ? "Salvando..." : "Finalizar sessão de QA"}
            </Button>
            {!result && (
              <span className="text-sm text-[var(--color-text-muted)]">
                Selecione um resultado para finalizar
              </span>
            )}
          </div>
        )}

        {done && (
          <div className="text-center py-8 bg-[var(--color-success-bg)] rounded-xl border border-[var(--color-success)]/20 mb-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-success)]">Sessão finalizada</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Resultado: {result === "approved" ? "Aprovado" : result === "approved_with_notes" ? "Aprovado c/ ressalvas" : "Reprovado"}
            </p>
          </div>
        )}
      </main>

      <footer className="shrink-0 py-4 text-center border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]/30">
        <p className="text-xs text-[var(--color-text-muted)] tracking-wide">QA Platform © 2024</p>
      </footer>
    </div>
  );
}