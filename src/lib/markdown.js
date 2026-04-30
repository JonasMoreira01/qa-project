export function generateQAReport(session) {
  if (!session) return "";

  const task = session.taskData || {};
  const date = new Date(session.arrivedAt?.toDate?.() || session.arrivedAt).toLocaleString("pt-BR");

  let md = `# Relatório QA: ${task.name || session.taskId}\n\n`;

  // Header
  md += `**ID da tarefa:** [\`${session.taskId}\`](${task.url})\n`;
  md += `**Analista:** ${session.qaAnalyst}\n`;
  md += `**Data:** ${date}\n\n`;

  // Priority & Status
  if (task.priority) {
    md += `**Prioridade:** ${task.priority.label}\n`;
  }
  if (task.status) {
    md += `**Status:** ${task.status}\n`;
  }
  md += `\n`;

  // Timing
  md += `## ⏱️ Tempo\n`;
  md += `**Total:** ${formatDuration(session.totalTimeMs)}\n`;
  md += `**Início:** ${formatTime(session.testingStartedAt)}\n`;
  md += `**Fim:** ${formatTime(session.testingFinishedAt)}\n\n`;

  // Checklist
  if (session.checklist?.length > 0) {
    md += `## ✓ Checklist\n`;
    const done = session.checklist.filter(c => c.checked).length;
    md += `(${done}/${session.checklist.length})\n\n`;
    session.checklist.forEach(item => {
      md += `- [${item.checked ? "x" : " "}] ${item.label}\n`;
    });
    md += `\n`;
  }

  // Bugs
  if (session.bugs?.length > 0) {
    md += `## 🐛 Bugs Encontrados\n`;
    session.bugs.forEach(bug => {
      md += `- ${bug.description}\n`;
    });
    md += `\n`;
  }

  // Feedback
  if (session.feedback) {
    md += `## 💬 Feedback / Observações\n`;
    md += `${session.feedback}\n\n`;
  }

  // Notes
  if (session.notes) {
    md += `## 📝 Notas Internas\n`;
    md += `${session.notes}\n\n`;
  }

  // Result
  if (session.result) {
    md += `## 📊 Resultado\n`;
    const resultMap = {
      approved: "✅ Aprovado",
      approved_with_notes: "⚠️ Aprovado com ressalvas",
      reproved: "❌ Reprovado"
    };
    md += `**Resultado:** ${resultMap[session.result] || session.result}\n`;

    if (session.severity) {
      const sevMap = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        critical: "Crítica"
      };
      md += `**Severidade:** ${sevMap[session.severity] || session.severity}\n`;
    }
  }

  return md;
}

function formatDuration(ms) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatTime(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate?.() || timestamp;
  return new Date(date).toLocaleTimeString("pt-BR");
}

export function downloadMarkdown(content, filename = "qa-report.md") {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    return true;
  }).catch(() => {
    return false;
  });
}
