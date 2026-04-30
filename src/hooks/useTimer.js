import { useState, useEffect, useRef, useCallback } from "react";
import { startTimer, pauseTimer, stopTimer } from "../lib/firestore";

/**
 * Manages a Clockify-style timer for a QA session.
 * Persists elapsed time to Firestore on pause/stop.
 *
 * @param {string} sessionId - Firestore document ID
 * @param {object} session   - Current session data from Firestore
 */
export function useTimer(sessionId, session) {
  const [running, setRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);
  const intervalRef = useRef(null);
  const startedAtRef = useRef(null);
  const baseMs = useRef(0);

  // Sync initial state from Firestore session
  useEffect(() => {
    if (!session) return;
    baseMs.current = session.totalTimeMs || 0;

    if (session.timerRunning && session.timerStartedAt) {
      const serverStart =
        session.timerStartedAt?.toDate?.() ||
        new Date(session.timerStartedAt?.seconds * 1000);
      startedAtRef.current = serverStart;
      setRunning(true);
    } else {
      setRunning(false);
      setDisplayMs(session.totalTimeMs || 0);
    }
  }, [session?.id]); // only re-sync on session change, not every update

  // Tick loop
  useEffect(() => {
    if (running) {
      if (!startedAtRef.current) startedAtRef.current = new Date();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current.getTime();
        setDisplayMs(baseMs.current + elapsed);
      }, 500);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = useCallback(async () => {
    startedAtRef.current = new Date();
    setRunning(true);
    await startTimer(sessionId, baseMs.current);
  }, [sessionId]);

  const pause = useCallback(async () => {
    if (!startedAtRef.current) return;
    const elapsed = Date.now() - startedAtRef.current.getTime();
    const newTotal = baseMs.current + elapsed;
    baseMs.current = newTotal;
    startedAtRef.current = null;
    setRunning(false);
    setDisplayMs(newTotal);
    await pauseTimer(sessionId, elapsed, baseMs.current - elapsed);
  }, [sessionId]);

  const stop = useCallback(async () => {
    if (running && startedAtRef.current) {
      const elapsed = Date.now() - startedAtRef.current.getTime();
      baseMs.current = baseMs.current + elapsed;
    }
    startedAtRef.current = null;
    setRunning(false);
    setDisplayMs(baseMs.current);
    await stopTimer(sessionId, baseMs.current);
  }, [sessionId, running]);

  return { running, displayMs, start, pause, stop };
}
