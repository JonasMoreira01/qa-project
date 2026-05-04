import { cn, getStatusBadgeClass } from "../../pages/utils";

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
  approved: "var(--color-success)",
  approved_with_notes: "var(--color-warning)",
  reproved: "var(--color-error)",
};

export function SessionCard({ session, onOpen }) {
  const { id, status, taskData, qaAnalyst, result, totalTimeMs } = session;

  return (
    <button
      className="group text-left w-full h-[160px] cursor-pointer"
      onClick={() => onOpen(id)}
    >
      <div
        className={cn(
          "h-full relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col transition-all duration-200",
          "hover:border-[var(--color-accent)]/50 hover:shadow-lg hover:shadow-[var(--color-accent)]/5 hover:-translate-y-0.5"
        )}
        style={{
          borderTop: `3px solid ${
            status === "testing"
              ? "var(--color-info)"
              : status === "done"
              ? "var(--color-success)"
              : "var(--color-text-muted)"
          }`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn("badge text-[10px]", getStatusBadgeClass(status))}>
            {statusLabel[status] || status}
          </span>
          {taskData?.priority?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-[var(--color-bg-card)]"
              style={{ background: taskData.priority.color }}
              title={taskData.priority.label}
            />
          )}
        </div>

        <div className="text-sm font-semibold line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
          {taskData?.name || session.taskId}
        </div>

        <div className="mt-auto pt-3 border-t border-[var(--color-border-subtle)]">
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
            <span className="truncate max-w-[80px]">{taskData?.list || "—"}</span>
            <span className="text-[var(--color-border)]">•</span>
            <span className="truncate">{qaAnalyst}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            {status === "done" && result ? (
              <span
                className="text-xs font-semibold"
                style={{ color: resultColor[result] }}
              >
                {resultLabel[result]}
              </span>
            ) : (
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatDuration(totalTimeMs)}
              </span>
            )}
            <svg
              className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

function formatDuration(ms) {
  if (!ms) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}