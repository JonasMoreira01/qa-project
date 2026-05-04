import { SessionCard } from "./SessionCard";

export function SessionsGrid({ sessions, loading, onOpen }) {
  return (
    <section className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Sessões de QA</h2>
          <span className="text-sm text-[var(--color-text-muted)]">
            {sessions.length} {sessions.length === 1 ? "sessão" : "sessões"}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[var(--color-text-muted)]">
            Carregando sessões...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center">
              <span className="text-4xl opacity-40">📋</span>
            </div>
            <div className="text-lg font-medium text-[var(--color-text-secondary)]">
              Nenhuma sessão ainda
            </div>
            <div className="text-sm text-[var(--color-text-muted)] mt-2">
              Importe uma tarefa do ClickUp para começar
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}