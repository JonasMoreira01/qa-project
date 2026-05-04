import { TopNav } from "../components/layout/TopNav";
import { AppFooter } from "../components/layout/AppFooter";
import { ImportBar } from "../components/sessions/ImportBar";
import { SessionsGrid } from "../components/sessions/SessionsGrid";

export function SessionList({ sessions, loading, onOpen, onRefresh, theme, onToggleTheme }) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <TopNav onRefresh={onRefresh} theme={theme} onToggleTheme={onToggleTheme} />
      <ImportBar onOpen={onOpen} />
      <SessionsGrid sessions={sessions} loading={loading} onOpen={onOpen} />
      <AppFooter />
    </div>
  );
}