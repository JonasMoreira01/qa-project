const CLICKUP_TOKEN = import.meta.env.VITE_CLICKUP_TOKEN;

/**
 * Extracts a task ID from a ClickUp URL or returns the raw ID.
 * Supports formats:
 *   https://app.clickup.com/t/TASK_ID
 *   https://app.clickup.com/WORKSPACE/v/t/TASK_ID
 *   Raw ID: abc123xyz
 */
export function extractTaskId(input) {
  const trimmed = input.trim();
  // Match /t/TASKID at end of URL
  const urlMatch = trimmed.match(/\/t\/([a-zA-Z0-9]+)\/?$/);
  if (urlMatch) return urlMatch[1];
  // Match last segment after final slash (other URL formats)
  const lastSegment = trimmed.match(/\/([a-zA-Z0-9]+)\/?$/);
  if (lastSegment && trimmed.startsWith("http")) return lastSegment[1];
  // Assume raw ID
  return trimmed;
}

/**
 * Fetches task details from ClickUp API.
 * Returns a normalized task object.
 */
export async function fetchClickUpTask(taskId) {
  const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
    headers: {
      Authorization: CLICKUP_TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.err || `ClickUp error ${res.status}`);
  }

  const data = await res.json();
  return normalizeTask(data);
}

function normalizeTask(raw) {
  const customFields = {};
  (raw.custom_fields || []).forEach((f) => {
    customFields[f.name] = f.value ?? f.type_config?.default ?? null;
  });

  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || "",
    status: raw.status?.status || "unknown",
    statusColor: raw.status?.color || "#999",
    priority: normalizePriority(raw.priority),
    points: raw.points ?? raw.story_points ?? customFields["Story Points"] ?? null,
    url: raw.url,

    // People
    assignees: (raw.assignees || []).map((u) => ({
      id: u.id,
      name: u.username,
      avatar: u.profilePicture || null,
      initials: getInitials(u.username),
    })),
    watchers: (raw.watchers || []).map((u) => ({
      id: u.id,
      name: u.username,
      avatar: u.profilePicture || null,
      initials: getInitials(u.username),
    })),
    creator: raw.creator
      ? {
          id: raw.creator.id,
          name: raw.creator.username,
          avatar: raw.creator.profilePicture || null,
          initials: getInitials(raw.creator.username),
        }
      : null,

    // Location
    list: raw.list?.name || null,
    folder: raw.folder?.name || null,
    space: raw.space?.id || null,

    // Dates
    dueDate: raw.due_date ? new Date(parseInt(raw.due_date)) : null,
    createdAt: raw.date_created ? new Date(parseInt(raw.date_created)) : null,
    updatedAt: raw.date_updated ? new Date(parseInt(raw.date_updated)) : null,

    // Tags
    tags: (raw.tags || []).map((t) => t.name),

    // Custom fields passthrough
    customFields,
  };
}

function normalizePriority(p) {
  if (!p) return { label: "Sem prioridade", value: 0, color: "#999" };
  const map = {
    urgent: { label: "Urgente", value: 4, color: "#FF4444" },
    high: { label: "Alta", value: 3, color: "#FF8C00" },
    normal: { label: "Normal", value: 2, color: "#2196F3" },
    low: { label: "Baixa", value: 1, color: "#4CAF50" },
  };
  return (
    map[p.priority?.toLowerCase()] || {
      label: p.priority || "Desconhecida",
      value: 0,
      color: p.color || "#999",
    }
  );
}

function getInitials(name = "") {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}
