import { USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockSessions } from "./mocks/data";
import type { SessionRecord, UUID } from "./types";

/** GET /api/sessions/my-sessions */
export async function mySessions(userId: UUID): Promise<SessionRecord[]> {
  if (USE_MOCKS) {
    await delay(180);
    return mockSessions.filter((s) => s.user_id === userId);
  }
  return apiFetch<SessionRecord[]>("/api/sessions/my-sessions");
}

export interface CreateSessionInput {
  brand_id: UUID;
  title: string;
}

/** POST /api/sessions — returns session_id; chat then bypasses Node to n8n directly. */
export async function createSession(
  input: CreateSessionInput,
  userId: UUID,
): Promise<SessionRecord> {
  if (USE_MOCKS) {
    await delay(220);
    const s: SessionRecord = {
      id: mockId(),
      user_id: userId,
      brand_id: input.brand_id,
      title: input.title,
      status: "Open",
      friction_level: 0,
      calcification_delta: 0,
      interval_count: 0,
      glitch_count: 0,
      encauzamiento_count: 0,
      coupling_node_triggered: false,
      resolution_status: "Unresolved",
      integration_signal_received_at: null,
      gold_extraction_status: "None",
      transcript_payload: [],
      extracted_asset_id: null,
      created_at: new Date().toISOString(),
    };
    mockSessions.unshift(s);
    return s;
  }
  return apiFetch<SessionRecord>("/api/sessions", { method: "POST", body: input });
}

/** GET /api/sessions — admin only. */
export async function listAllSessions(): Promise<SessionRecord[]> {
  if (USE_MOCKS) {
    await delay(240);
    return mockSessions;
  }
  return apiFetch<SessionRecord[]>("/api/sessions");
}

/** GET /api/sessions/:id — admin only; returns telemetry + transcript_payload. */
export async function getSession(id: UUID): Promise<SessionRecord> {
  if (USE_MOCKS) {
    await delay(160);
    const s = mockSessions.find((x) => x.id === id);
    if (!s) throw Object.assign(new Error("Session not found"), { status: 404 });
    return s;
  }
  return apiFetch<SessionRecord>(`/api/sessions/${id}`);
}

/** PATCH /api/sessions/:id/integrate — admin only. */
export async function integrateSession(id: UUID): Promise<SessionRecord> {
  if (USE_MOCKS) {
    await delay(360);
    const s = mockSessions.find((x) => x.id === id);
    if (!s) throw Object.assign(new Error("Session not found"), { status: 404 });
    s.integration_signal_received_at = new Date().toISOString();
    s.gold_extraction_status = "Pending";
    return s;
  }
  return apiFetch<SessionRecord>(`/api/sessions/${id}/integrate`, { method: "PATCH" });
}