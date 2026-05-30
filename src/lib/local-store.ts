import type { Rider, ScoringSession } from "./dummy-data";

const RIDERS_KEY = "horsey-riders";
const SESSIONS_KEY = "horsey-sessions";

export function getLocalRiders(): Rider[] {
  try {
    const raw = localStorage.getItem(RIDERS_KEY);
    return raw ? (JSON.parse(raw) as Rider[]) : [];
  } catch { return []; }
}

export function addLocalRider(rider: Rider): void {
  try {
    const list = getLocalRiders();
    list.push(rider);
    localStorage.setItem(RIDERS_KEY, JSON.stringify(list));
  } catch {}
}

export function getLocalSessions(): ScoringSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as ScoringSession[]) : [];
  } catch { return []; }
}

export function addLocalSession(session: ScoringSession): void {
  try {
    const list = getLocalSessions();
    list.push(session);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
  } catch {}
}
