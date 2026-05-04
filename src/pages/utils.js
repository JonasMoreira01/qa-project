export function getStatusBadgeClass(status) {
  switch (status) {
    case "testing": return "badge-testing";
    case "done": return "badge-done";
    default: return "badge-waiting";
  }
}

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatMs(ms) {
  if (!ms) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

export { cn, formatMs };