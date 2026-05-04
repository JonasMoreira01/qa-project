export function getStatusBadgeClass(status) {
  switch (status) {
    case "testing": return "badge-testing";
    case "done": return "badge-done";
    default: return "badge-waiting";
  }
}