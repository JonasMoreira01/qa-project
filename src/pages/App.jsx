import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Input,
  Textarea,
  Checkbox,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Progress,
  Skeleton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from "@inmediam/ui";
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

const severityLabel = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

// ─── Main App Shell ───────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("list");
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
    <div className="h-screen flex flex-col overflow-hidden">
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

  const statusConfig = {
    waiting: { label: "Aguardando", variant: "outline" },
    testing: { label: "Testando", variant: "default" },
    done: { label: "Concluído", variant: "success" },
  };

  const resultConfig = {
    approved: { label: "Aprovado", color: "text-success-400" },
    approved_with_notes: { label: "Aprovado c/ ressalvas", color: "text-warning-400" },
    reproved: { label: "Reprovado", color: "text-error-400" },
  };

  return (
    <div className="h-screen overflow-y-auto flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center font-mono-qa font-medium text-sm text-primary-foreground tracking-wide">
            QA
          </div>
          <div>
            <div className="text-base font-semibold">QA Platform</div>
            <div className="text-xs text-muted-foreground font-mono-qa">Gestão de testes</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          ↻ Atualizar
        </Button>
      </header>

      <div className="px-8 py-6 border-b border-border bg-card">
        <div className="flex flex-col gap-2.5 max-w-[720px]">
          <Input
            placeholder="Seu nome (analista QA)"
            value={qaAnalyst}
            onChange={(e) => setQaAnalyst(e.target.value)}
            className="max-w-[280px]"
          />
          <div className="flex gap-2.5">
            <Input
              className="flex-1 font-mono-qa"
              placeholder="Link ou ID da tarefa no ClickUp"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
            />
            <Button onClick={handleImport} disabled={importing}>
              {importing ? "Importando..." : "Importar tarefa"}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-sm text-error-400 mt-1 font-mono-qa">{error}</p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-7 content-start">
        {loading ? (
          <>
            <SessionCardSkeleton />
            <SessionCardSkeleton />
            <SessionCardSkeleton />
          </>
        ) : sessions.length === 0 ? (
          <div className="col-span-full flex flex-col items-center gap-2 py-15 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <div>Nenhuma sessão ainda.</div>
            <div className="text-sm text-muted-foreground mb-6">
              Importe uma tarefa para começar.
            </div>
            <Card className="w-[280px] bg-secondary border-dashed">
              <CardContent className="p-4">
                <div className="font-mono-qa text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
                  Exemplo
                </div>
                <div className="text-sm font-medium mb-1.5">Feature: Novo dashboard</div>
                <div className="text-xs text-muted-foreground font-mono-qa">Inboxes · João QA</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          sessions.map((s) => (
            <Card
              key={s.id}
              className={cn(
                "cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg",
                s.status === "testing" && "border-l-[3px] border-l-primary",
                s.status === "done" && "border-l-[3px] border-l-success-400",
                s.status === "waiting" && "border-l-[3px] border-l-muted-foreground"
              )}
              onClick={() => onOpen(s.id)}
            >
              <CardContent className="p-[18px] relative">
                <div className="flex items-center justify-between mb-2.5">
                  <Badge
                    variant={statusConfig[s.status]?.variant || "outline"}
                    className="font-mono-qa text-[11px] px-2 py-0.5 font-medium"
                  >
                    {statusConfig[s.status]?.label || s.status}
                  </Badge>
                  {s.taskData?.priority?.color && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: s.taskData.priority.color }}
                      title={s.taskData.priority.label}
                    />
                  )}
                </div>
                <div className="text-[15px] font-medium leading-tight mb-2">
                  {s.taskData?.name || s.taskId}
                </div>
                <div className="text-xs text-muted-foreground font-mono-qa flex gap-1.5">
                  <span>{s.taskData?.list || "—"}</span>
                  <span>·</span>
                  <span>{s.qaAnalyst}</span>
                </div>
                {s.status === "done" && s.result && (
                  <div className={cn("text-xs font-semibold mt-2 font-mono-qa", resultConfig[s.result]?.color)}>
                    {resultConfig[s.result]?.label}
                  </div>
                )}
                <div className="absolute top-[18px] right-[18px] font-mono-qa text-[11px] text-muted-foreground">
                  {formatDuration(s.totalTimeMs)}
                </div>
              </CardContent>
            </Card>
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

  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground font-mono-qa">Carregando sessão...</div>;
  if (!session) return <div className="flex items-center justify-center h-screen text-muted-foreground font-mono-qa">Sessão não encontrada.</div>;

  const task = session.taskData || {};
  const done = session.status === "done";
  const checklistDone = session.checklist?.filter((c) => c.checked).length || 0;
  const checklistTotal = session.checklist?.length || 0;
  const checklistPercent = checklistTotal ? (checklistDone / checklistTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="bg-card border-r border-border overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex gap-2 items-center">
          <Button variant="outline" size="sm" onClick={onBack} className="flex-1 text-left">
            ← Voltar
          </Button>
          <DropdownMenu open={exportMenu} onOpenChange={setExportMenu}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9" title="Exportar relatório">
                ⬇
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportMarkdown}>
                📥 Download .md
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyMarkdown}>
                {copied ? "✓ Copiado!" : "📋 Copiar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="bg-secondary">
          <CardContent className="p-4 flex flex-col gap-2.5">
            <div className="font-mono-qa text-xs">
              <a href={task.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                #{session.taskId}
              </a>
            </div>
            <div className="text-[15px] font-semibold leading-tight">{task.name}</div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-2.5">
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
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] text-muted-foreground font-mono-qa uppercase tracking-wide">
                  Responsáveis
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {task.assignees.map((u) => (
                    <DSAvatar key={u.id} user={u} />
                  ))}
                </div>
              </div>
            )}

            {task.watchers?.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] text-muted-foreground font-mono-qa uppercase tracking-wide">
                  Revisores
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {task.watchers.map((u) => (
                    <DSAvatar key={u.id} user={u} />
                  ))}
                </div>
              </div>
            )}

            {task.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[11px] px-2 py-0 font-mono-qa">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="px-1">
          <div className="text-[11px] text-muted-foreground font-mono-qa uppercase tracking-wide">
            Analista QA
          </div>
          <div className="text-sm font-medium mt-1">{session.qaAnalyst}</div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="overflow-y-auto p-7 flex flex-col gap-7">
        {/* Timer */}
        <section className="bg-card border border-border rounded-lg p-5 text-center">
          <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-3.5">
            Tempo de teste
          </div>
          <div className="font-mono-qa text-5xl font-normal tracking-[4px] text-foreground mb-5 leading-none">
            {formatMs(timer.displayMs)}
          </div>
          {!done && (
            <div className="flex gap-2.5 justify-center">
              {!timer.running ? (
                <Button size="lg" onClick={timer.start}>
                  ▶ {session.status === "waiting" ? "Iniciar teste" : "Retomar"}
                </Button>
              ) : (
                <>
                  <Button variant="warning" size="lg" onClick={timer.pause}>
                    ⏸ Pausar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={timer.stop}>
                    ⏹ Parar
                  </Button>
                </>
              )}
            </div>
          )}
          {done && (
            <div className="font-mono-qa text-sm text-success-400">
              Tempo registrado: {formatDuration(session.totalTimeMs)}
            </div>
          )}
        </section>

        {/* Checklist */}
        <section className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground">
              Checklist
            </div>
            <div className="font-mono-qa text-xs text-muted-foreground">
              {checklistDone}/{checklistTotal}
            </div>
          </div>
          <Progress value={checklistPercent} className="mb-4 h-1" />
          <div className="flex flex-col gap-2">
            {session.checklist?.map((item) => (
              <Label
                key={item.id}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 border border-border rounded-md cursor-pointer transition-colors text-foreground",
                  item.checked && "text-muted-foreground bg-success-400/5 border-transparent line-through"
                )}
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => !done && toggleCheck(item.id)}
                  disabled={done}
                  className="data-[state=checked]:bg-success-400 data-[state=checked]:border-success-400"
                />
                <span>{item.label}</span>
              </Label>
            ))}
          </div>
        </section>

        {/* Bugs */}
        <section className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-3.5">
            Bugs encontrados
          </div>
          {!done && (
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Descreva o bug brevemente..."
                value={bugInput}
                onChange={(e) => setBugInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addBug()}
              />
              <Button variant="outline" onClick={addBug}>
                + Adicionar
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {bugs.length === 0 && (
              <div className="text-sm text-muted-foreground italic">Nenhum bug registrado.</div>
            )}
            {bugs.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-2.5 p-2.5 bg-error-400/5 border border-error-400/15 rounded-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-error-400 flex-shrink-0 mt-1" />
                <span className="flex-1 text-sm text-foreground">{b.description}</span>
                {!done && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-error-400"
                    onClick={() => removeBug(b.id)}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Feedback */}
        <section className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-3.5">
            Feedback / Observações
          </div>
          <Textarea
            placeholder="Descreva o que foi testado, comportamentos encontrados, pontos de atenção..."
            value={feedback}
            onChange={(e) => !done && setFeedback(e.target.value)}
            disabled={done}
            rows={4}
          />
        </section>

        <section className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-3.5">
            Notas internas (não vai para o dev)
          </div>
          <Textarea
            placeholder="Notas do QA para o time interno..."
            value={notes}
            onChange={(e) => !done && setNotes(e.target.value)}
            disabled={done}
            rows={3}
            className="bg-warning-400/5 border-warning-400/15"
          />
        </section>

        {/* Result */}
        <section className="bg-card border border-border rounded-lg p-5">
          <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-3.5">
            Resultado
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: "approved", label: "Aprovado", icon: "✓", variant: "success" },
              { value: "approved_with_notes", label: "Aprovado c/ ressalvas", icon: "~", variant: "warning" },
              { value: "reproved", label: "Reprovado", icon: "✕", variant: "destructive" },
            ].map((opt) => (
              <Button
                key={opt.value}
                variant={result === opt.value ? opt.variant : "outline"}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-4",
                  result !== opt.value && "hover:bg-accent"
                )}
                onClick={() => !done && setResult(opt.value)}
                disabled={done}
              >
                <span className="text-xl font-semibold">{opt.icon}</span>
                {opt.label}
              </Button>
            ))}
          </div>

          {(result === "reproved" || result === "approved_with_notes") && (
            <div className="mt-4">
              <div className="text-[11px] font-mono-qa uppercase tracking-wider text-muted-foreground mb-2.5">
                Severidade
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { s: "low", color: "border-success-400 bg-success-400/10 text-success-400" },
                  { s: "medium", color: "border-warning-400 bg-warning-400/10 text-warning-400" },
                  { s: "high", color: "border-orange-400 border-orange-400/60 bg-orange-400/10 text-orange-400" },
                  { s: "critical", color: "border-error-400 bg-error-400/10 text-error-400" },
                ].map((opt) => (
                  <Button
                    key={opt.s}
                    variant={severity === opt.s ? "outline" : "outline"}
                    size="sm"
                    className={cn(
                      "font-mono-qa text-xs",
                      severity === opt.s && opt.color,
                      severity !== opt.s && "hover:bg-accent"
                    )}
                    onClick={() => !done && setSeverity(opt.s)}
                    disabled={done}
                  >
                    {severityLabel[opt.s]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>

        {!done && (
          <div className="flex items-center gap-4 pb-2">
            <Button variant="success" size="lg" onClick={handleSaveResult} disabled={saving || !result}>
              {saving ? "Salvando..." : "Finalizar sessão de QA"}
            </Button>
            {!result && (
              <span className="text-xs text-muted-foreground font-mono-qa">
                Selecione um resultado para finalizar
              </span>
            )}
          </div>
        )}

        {done && (
          <Card className="bg-success-400/5 border-success-400/25">
            <CardContent className="flex items-center gap-2.5 justify-center py-4 text-success-400 font-medium">
              <span className="text-lg">✓</span>
              Sessão finalizada
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// ─── Small Components ─────────────────────────────────────────────────────────
function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-[11px] text-muted-foreground font-mono-qa uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );
}

function DSAvatar({ user }) {
  return (
    <Avatar className="h-7 w-7 border border-border">
      {user.avatar ? (
        <AvatarImage src={user.avatar} alt={user.name} />
      ) : (
        <AvatarFallback className="text-[11px] font-semibold bg-secondary text-foreground">
          {user.initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    <Card className="animate-pulse">
      <CardContent className="p-[18px]">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-[60px] h-4" />
          <Skeleton className="w-2 h-2 rounded-full" />
        </div>
        <Skeleton className="w-full h-4 mb-2" />
        <Skeleton className="w-[70%] h-3" />
        <Skeleton className="w-10 h-2.5 mt-2" />
      </CardContent>
    </Card>
  );
}
