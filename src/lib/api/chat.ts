import { N8N_CHAT_WEBHOOK, USE_MOCKS, apiFetch, delay, mockId } from "./client";
import { mockSessions } from "./mocks/data";
import type { ChatLanguage } from "@/stores/session";
import type { ChatMessage, UUID } from "./types";

export interface SendPromptInput {
  session_id: UUID;
  prompt: string;
  language: ChatLanguage;
  /** Client-generated id so the loader can poll this turn's pipeline stage. */
  turn_id?: UUID;
}

/** Current pipeline stage of an in-flight turn, for the staged loader. */
export interface TurnProgress {
  stage: string | null;
  label?: string;
  detail?: string | null;
  route?: string | null;
  seq?: number;
}

/**
 * Reads the latest pipeline stage for a turn. Side channel only — a failure
 * here never affects the prompt response, so it resolves to an empty stage.
 */
export async function getTurnProgress(session_id: UUID, turn_id: UUID): Promise<TurnProgress> {
  if (USE_MOCKS) return { stage: null };
  try {
    return await apiFetch<TurnProgress>(`/api/sessions/${session_id}/progress?turn_id=${turn_id}`);
  } catch {
    return { stage: null };
  }
}

/**
 * POSTs prompt to the backend (which proxies it to n8n intake webhook).
 */
export async function sendPrompt(input: SendPromptInput): Promise<ChatMessage> {
  if (USE_MOCKS) {
    await delay(900 + Math.random() * 2200);
    const reply: ChatMessage = {
      id: mockId(),
      role: "ai-ceo",
      text: mockReply(input),
      ts: new Date().toISOString(),
    };
    const s = mockSessions.find((x) => x.id === input.session_id);
    if (s) {
      s.transcript_payload.push(reply);
      const isSuccess =
        input.prompt.toLowerCase().includes("oro") ||
        input.prompt.toLowerCase().includes("gold") ||
        input.prompt.toLowerCase().includes("encauzamiento");
      if (isSuccess) {
        s.status = "Closed";
        s.encauzamiento_count += 1;
      }
    }
    return reply;
  }

  return apiFetch<ChatMessage>(`/api/sessions/${input.session_id}/prompt`, {
    method: "POST",
    body: {
      prompt: input.prompt,
      language: input.language,
      turn_id: input.turn_id ?? null,
    },
  });
}

export function appendLocalUserMessage(session_id: UUID, text: string): ChatMessage {
  const msg: ChatMessage = {
    id: mockId(),
    role: "user",
    text,
    ts: new Date().toISOString(),
  };
  const s = mockSessions.find((x) => x.id === session_id);
  if (s) s.transcript_payload.push(msg);
  return msg;
}

export async function listMessages(session_id: UUID): Promise<ChatMessage[]> {
  if (USE_MOCKS) {
    await delay(80);
    return mockSessions.find((s) => s.id === session_id)?.transcript_payload ?? [];
  }
  return apiFetch<ChatMessage[]>(`/api/sessions/${session_id}/messages`);
}

function mockReply({ prompt, language }: SendPromptInput): string {
  const en = [
    "Define the variable you are unwilling to lose. The rest is noise.",
    "That isn't a decision — it's a description. Make a cut, name a name.",
    "If this fails, who carries it? Until that answer exists, you are stalling.",
    "Reframe in one sentence. If you can't, the thesis is not yours yet.",
  ];
  const es = [
    "Defina la variable que no está dispuesto a perder. Lo demás es ruido.",
    "Eso no es una decisión, es una descripción. Haga un corte, nombre a alguien.",
    "Si esto falla, ¿quién lo carga? Mientras no haya respuesta, está dilatando.",
    "Reformúlelo en una frase. Si no puede, la tesis aún no es suya.",
  ];
  const pool = language === "es" ? es : en;
  const seed = (prompt.length + Date.now()) % pool.length;
  return pool[seed];
}
