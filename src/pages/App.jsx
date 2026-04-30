import { useState, useEffect, useCallback } from "react";
import {
  createQASession,
  getQASession,
  listQASessions,
  updateChecklist,
  saveResult,
  patchSession,
  formatDuration,
} from "../lib/firestore";
import { fetchClickUpTask, extractTaskId } from "../lib/clickup";
import { generateQAReport, downloadMarkdown, copyToClipboard } from "../lib/markdown";
import { useTimer } from "../hooks/useTimer";

// ─── Main App Shell ───────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("list"); // list | session
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="app">
      {view === "list" ? (
        <SessionList
          sessions={sessions}
          loading={loading}
          onOpen={openSession}
          onRefresh={loadSessions}
          onNew={(id) => openSession(id)}
        />
      ) : (
        <SessionView sessionId={sessionId} onBack={backToList} />
      )}
    </div>
  );
}

// ─── Session List ─────────────────────────────────────────────────────────────
function SessionList({ sessions, loading, onOpen, onRefresh, onNew }) {
  const [taskInput, setTaskInput] = useState("");
  const [qaAnalyst, setQaAnalyst] = useState(
    () => localStorage.getItem("qa_analyst") || ""
  );
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleImport = async () => {
    if (!taskInput.trim()) return;
    if (!qaAnalyst.trim()) {
      setError("Informe seu nome antes de importar.");
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
      onNew(id);
    } catch (e) {
      setError(e.message || "Erro ao importar tarefa.");
    } finally {
      setImporting(false);
    }
  };

  const statusLabel = {
    waiting: "Aguardando",
    testing: "Testando",
    done: "Concluído",
  };

  const resultLabel = {
    approved: "Aprovado",
    approved_with_notes: "Aprovado c/ ressalvas",
    reproved: "Reprovado",
  };

  const resultColor = {
    approved: "var(--green)",
    approved_with_notes: "var(--amber)",
    reproved: "var(--red)",
  };

  return (
    <div className="list-view">
      <header className="list-header">
        <div className="logo">
          <span className="logo-icon">QA</span>
          <div>
            <div className="logo-title">QA Platform</div>
            <div className="logo-sub">Gestão de testes</div>
          </div>
        </div>
        <button className="btn-ghost" onClick={onRefresh}>
          ↻ Atualizar
        </button>
      </header>

      <div className="import-bar">
        <div className="import-fields">
          <input
            className="input-analyst"
            placeholder="Seu nome (analista QA)"
            value={qaAnalyst}
            onChange={(e) => setQaAnalyst(e.target.value)}
          />
          <div className="import-row">
            <input
              className="input-task"
              placeholder="Link ou ID da tarefa no ClickUp"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
            />
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? "Importando..." : "Importar tarefa"}
            </button>
          </div>
        </div>
        {error && <div className="import-error">{error}</div>}
      </div>

      <div className="sessions-grid">
        {loading ? (
          <>
            <SessionCardSkeleton />
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div>Nenhuma sessão ainda.</div>
            <div className="empty-sub">
              Importe uma tarefa para começar.
            </div>
            <div className="sample-card">
              <div className="sample-badge">Exemplo</div>
              <div className="sample-title">Feature: Novo dashboard</div>
              <div className="sample-meta">Inboxes · João QA</div>
            </div>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`session-card status-${s.status}`}
              onClick={() => onOpen(s.id)}
            >
              <div className="card-top">
                <span
                  className="status-badge"
                  data-status={s.status}
                >
                  {statusLabel[s.status] || s.status}
                </span>
                <span
                  className="priority-dot"
                  style={{ background: s.taskData?.priority?.color }}
                  title={s.taskData?.priority?.label}
                />
              </div>
              <div className="card-name">{s.taskData?.name || s.taskId}</div>
              <div className="card-meta">
                <span>{s.taskData?.list || "—"}</span>
                <span>·</span>
                <span>{s.qaAnalyst}</span>
              </div>
              {s.status === "done" && s.result && (
                <div
                  className="card-result"
                  style={{ color: resultColor[s.result] }}
                >
                  {resultLabel[s.result]}
                </div>
              )}
              <div className="card-time">
                {formatDuration(s.totalTimeMs)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Session View ─────────────────────────────────────────────────────────────
function SessionView({ sessionId, onBack }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Result form state
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
  }, [sessionId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenu && !e.target.closest('.export-menu-wrapper')) {
        setExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [exportMenu]);

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

  const handleExportMarkdown = () => {
    const report = generateQAReport(session);
    const filename = `qa-report-${session.taskId}-${new Date().getTime()}.md`;
    downloadMarkdown(report, filename);
    setExportMenu(false);
  };

  const handleCopyMarkdown = () => {
    const report = generateQAReport(session);
    copyToClipboard(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setExportMenu(false);
  };

  if (loading) return <div className="loading">Carregando sessão...</div>;
  if (!session) return <div className="loading">Sessão não encontrada.</div>;

  const task = session.taskData || {};
  const done = session.status === "done";
  const checklistDone = session.checklist?.filter((c) => c.checked).length || 0;
  const checklistTotal = session.checklist?.length || 0;

  return (
    <div className="session-view">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="btn-back" onClick={onBack}>
            ← Voltar
          </button>
          <div className="export-menu-wrapper">
            <button
              className="btn-export"
              onClick={() => setExportMenu(!exportMenu)}
              title="Exportar relatório"
            >
              ⬇️
            </button>
            {exportMenu && (
              <div className="export-dropdown">
                <button
                  className="export-option"
                  onClick={handleExportMarkdown}
                >
                  📥 Download .md
                </button>
                <button
                  className="export-option"
                  onClick={handleCopyMarkdown}
                >
                  {copied ? "✓ Copiado!" : "📋 Copiar"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="task-card">
          <div className="task-id">
            <a href={task.url} target="_blank" rel="noreferrer">
              #{session.taskId}
            </a>
          </div>
          <div className="task-name">{task.name}</div>

          <div className="task-fields">
            <Field label="Lista" value={task.list} />
            <Field label="Pasta" value={task.folder} />
            <Field
              label="Prioridade"
              value={
                task.priority ? (
                  <span style={{ color: task.priority.color }}>
                    ● {task.priority.label}
                  </span>
                ) : null
              }
            />
            <Field label="Pontos" value={task.points} />
            <Field
              label="Status"
              value={
                task.status ? (
                  <span style={{ color: task.statusColor }}>
                    {task.status}
                  </span>
                ) : null
              }
            />
          </div>

          {task.assignees?.length > 0 && (
            <div className="people-section">
              <div className="field-label">Responsáveis</div>
              <div className="avatars">
                {task.assignees.map((u) => (
                  <Avatar key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}

          {task.watchers?.length > 0 && (
            <div className="people-section">
              <div className="field-label">Revisores</div>
              <div className="avatars">
                {task.watchers.map((u) => (
                  <Avatar key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}

          {task.tags?.length > 0 && (
            <div className="tags">
              {task.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="qa-meta">
          <div className="field-label">Analista QA</div>
          <div className="qa-analyst-name">{session.qaAnalyst}</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {/* Timer */}
        <section className="section timer-section">
          <div className="section-label">Tempo de teste</div>
          <div className="timer-display">
            {formatMs(timer.displayMs)}
          </div>
          {!done && (
            <div className="timer-controls">
              {!timer.running ? (
                <button className="btn-start" onClick={timer.start}>
                  ▶ {session.status === "waiting" ? "Iniciar teste" : "Retomar"}
                </button>
              ) : (
                <button className="btn-pause" onClick={timer.pause}>
                  ⏸ Pausar
                </button>
              )}
              {timer.running && (
                <button className="btn-stop" onClick={timer.stop}>
                  ⏹ Parar
                </button>
              )}
            </div>
          )}
          {done && (
            <div className="timer-done-note">
              Tempo registrado: {formatDuration(session.totalTimeMs)}
            </div>
          )}
        </section>

        {/* Checklist */}
        <section className="section">
          <div className="section-header">
            <div className="section-label">Checklist</div>
            <div className="checklist-progress">
              {checklistDone}/{checklistTotal}
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${checklistTotal ? (checklistDone / checklistTotal) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="checklist">
            {session.checklist?.map((item) => (
              <label key={item.id} className={`check-item ${item.checked ? "checked" : ""}`}>
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => !done && toggleCheck(item.id)}
                  disabled={done}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Bugs */}
        <section className="section">
          <div className="section-label">Bugs encontrados</div>
          {!done && (
            <div className="bug-input-row">
              <input
                className="input-bug"
                placeholder="Descreva o bug brevemente..."
                value={bugInput}
                onChange={(e) => setBugInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBug()}
              />
              <button className="btn-add-bug" onClick={addBug}>
                + Adicionar
              </button>
            </div>
          )}
          <div className="bug-list">
            {bugs.length === 0 && (
              <div className="empty-bugs">Nenhum bug registrado.</div>
            )}
            {bugs.map((b) => (
              <div key={b.id} className="bug-item">
                <span className="bug-dot" />
                <span className="bug-desc">{b.description}</span>
                {!done && (
                  <button
                    className="bug-remove"
                    onClick={() => removeBug(b.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Feedback */}
        <section className="section">
          <div className="section-label">Feedback / Observações</div>
          <textarea
            className="textarea"
            placeholder="Descreva o que foi testado, comportamentos encontrados, pontos de atenção..."
            value={feedback}
            onChange={(e) => !done && setFeedback(e.target.value)}
            disabled={done}
            rows={4}
          />
        </section>

        <section className="section">
          <div className="section-label">Notas internas (não vai para o dev)</div>
          <textarea
            className="textarea textarea-notes"
            placeholder="Notas do QA para o time interno..."
            value={notes}
            onChange={(e) => !done && setNotes(e.target.value)}
            disabled={done}
            rows={3}
          />
        </section>

        {/* Result */}
        <section className="section result-section">
          <div className="section-label">Resultado</div>
          <div className="result-grid">
            {[
              { value: "approved", label: "Aprovado", icon: "✓" },
              { value: "approved_with_notes", label: "Aprovado c/ ressalvas", icon: "~" },
              { value: "reproved", label: "Reprovado", icon: "✕" },
            ].map((opt) => (
              <button
                key={opt.value}
                className={`result-btn result-${opt.value} ${result === opt.value ? "active" : ""}`}
                onClick={() => !done && setResult(opt.value)}
                disabled={done}
              >
                <span className="result-icon">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          {(result === "reproved" || result === "approved_with_notes") && (
            <div className="severity-row">
              <div className="section-label">Severidade</div>
              <div className="severity-options">
                {["low", "medium", "high", "critical"].map((s) => (
                  <button
                    key={s}
                    className={`severity-btn sev-${s} ${severity === s ? "active" : ""}`}
                    onClick={() => !done && setSeverity(s)}
                    disabled={done}
                  >
                    {severityLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {!done && (
          <div className="save-bar">
            <button
              className="btn-save"
              onClick={handleSaveResult}
              disabled={saving || !result}
            >
              {saving ? "Salvando..." : "Finalizar sessão de QA"}
            </button>
            {!result && (
              <span className="save-hint">Selecione um resultado para finalizar</span>
            )}
          </div>
        )}

        {done && (
          <div className="done-banner">
            <span className="done-icon">✓</span>
            Sessão finalizada
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────
function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <span className="field-value">{value}</span>
    </div>
  );
}

function Avatar({ user }) {
  return (
    <div className="avatar" title={user.name}>
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        <span>{user.initials}</span>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const severityLabel = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

function formatMs(ms) {
  if (!ms) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((s % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function SessionCardSkeleton() {
  return (
    <div className="session-card skeleton">
      <div className="card-top">
        <div className="skeleton-badge"></div>
        <div className="skeleton-dot"></div>
      </div>
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-meta"></div>
      <div className="skeleton-line skeleton-time"></div>
    </div>
  );
}
