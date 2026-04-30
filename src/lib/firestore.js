import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const QA_SESSIONS = "qa_sessions";

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────

/**
 * Creates a new QA session for a task.
 * Called when the QA drags or selects a task to start reviewing.
 */
export async function createQASession({ taskId, taskData, qaAnalyst }) {
  const ref = await addDoc(collection(db, QA_SESSIONS), {
    // ClickUp task snapshot
    taskId,
    taskData,

    // QA metadata
    qaAnalyst,
    status: "waiting", // waiting | testing | done
    arrivedAt: serverTimestamp(),
    testingStartedAt: null,
    testingFinishedAt: null,

    // Timer
    timerRunning: false,
    timerStartedAt: null,
    totalTimeMs: 0,

    // Checklist (pre-populated, can be customized later)
    checklist: defaultChecklist(),

    // Results
    result: null, // approved | approved_with_notes | reproved
    severity: null, // none | low | medium | high | critical
    bugs: [],
    feedback: "",
    notes: "",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ─────────────────────────────────────────
// READ
// ─────────────────────────────────────────

export async function getQASession(sessionId) {
  const snap = await getDoc(doc(db, QA_SESSIONS, sessionId));
  if (!snap.exists()) throw new Error("Sessão não encontrada");
  return { id: snap.id, ...snap.data() };
}

export async function listQASessions() {
  const q = query(collection(db, QA_SESSIONS), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────

export async function startTimer(sessionId, currentTotalMs = 0) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    timerRunning: true,
    timerStartedAt: serverTimestamp(),
    status: "testing",
    testingStartedAt: serverTimestamp(),
    totalTimeMs: currentTotalMs,
    updatedAt: serverTimestamp(),
  });
}

export async function pauseTimer(sessionId, elapsedMs, currentTotalMs) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    timerRunning: false,
    timerStartedAt: null,
    totalTimeMs: currentTotalMs + elapsedMs,
    updatedAt: serverTimestamp(),
  });
}

export async function stopTimer(sessionId, totalMs) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    timerRunning: false,
    timerStartedAt: null,
    totalTimeMs: totalMs,
    testingFinishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────
// CHECKLIST
// ─────────────────────────────────────────

export async function updateChecklist(sessionId, checklist) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    checklist,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────
// RESULT
// ─────────────────────────────────────────

export async function saveResult(sessionId, { result, severity, feedback, notes, bugs }) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    result,
    severity,
    feedback,
    notes,
    bugs,
    status: "done",
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────
// GENERIC PATCH
// ─────────────────────────────────────────

export async function patchSession(sessionId, fields) {
  await updateDoc(doc(db, QA_SESSIONS, sessionId), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function defaultChecklist() {
  return [
    { id: "c1", label: "Critérios de aceite verificados", checked: false },
    { id: "c2", label: "Fluxo principal testado", checked: false },
    { id: "c3", label: "Fluxos alternativos testados", checked: false },
    { id: "c4", label: "Casos de erro verificados", checked: false },
    { id: "c5", label: "Responsividade verificada", checked: false },
    { id: "c6", label: "Sem erros no console", checked: false },
    { id: "c7", label: "Performance aceitável", checked: false },
    { id: "c8", label: "Regressão nos fluxos adjacentes", checked: false },
  ];
}

export function formatDuration(ms) {
  if (!ms) return "0m";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
