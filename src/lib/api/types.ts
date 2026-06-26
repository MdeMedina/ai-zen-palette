// Domain types aligned with the PKGD OS Prisma schema.
// The mock layer and the real REST backend (Node + Express + Prisma + n8n)
// must both honor these shapes so swapping `client.ts` is a one-line change.

export type UUID = string;

export type GlobalRole = "admin" | "operator";

export type AssetType = "SOP" | "Dogma" | "Gold" | "Jewel" | "External";
export type VectorizationStatus = "Pending" | "Embedded" | "Error";
export type BrandStatus = "Active" | "Paused" | "Archived";

export interface DepartmentRole {
  id: UUID;
  name: string;
  department_id: UUID;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: UUID;
  name: string;
  roles?: DepartmentRole[];
  created_at?: string;
  updated_at?: string;
}

export type SessionStatus = "Open" | "Closed" | "Archived";
export type ResolutionStatus = "Unresolved" | "Resolved" | "Stalled";
export type GoldExtractionStatus = "None" | "Pending" | "Extracted" | "Failed";

export interface User {
  id: UUID;
  full_name: string;
  email: string;
  password_hash?: string;
  global_role: GlobalRole;
  session_token_n8n?: string | null;
  /** Admin-only fields — backend DTO purges these for operators. */
  friction_level?: number | null;
  calcification_level?: number | null;
  /** Brands this operator can address. Empty for admins (full access). */
  brand_access?: UUID[];
  department_id?: UUID | null;
  department_role_id?: UUID | null;
  department?: { id: UUID; name: string } | null;
  department_role?: { id: UUID; name: string } | null;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: UUID;
  name: string;
  industry: string;
  status: BrandStatus;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeAsset {
  id: UUID;
  brand_id?: UUID | null;
  title: string;
  asset_type: AssetType;
  status: "Active" | "Archived" | "Proposed";
  source_file_url: string | null;
  pgvector_ref_id: string | null;
  vectorization_status: VectorizationStatus;
  percent?: number;
  source_session_id?: UUID | null;
  department_id?: UUID | null;
  department_role_id?: UUID | null;
  department?: { id: UUID; name: string } | null;
  department_role?: { id: UUID; name: string } | null;
  /** Included by GET /knowledge/proposals (admin proposal review). */
  brand?: { id: UUID; name: string } | null;
  created_at: string;
}

export interface ChatMessage {
  id: UUID;
  role: "user" | "ai-ceo" | "concepto";
  text: string;
  ts: string;
  success?: boolean;
  /** Sólo para entradas `concepto`: título del Oro sintetizado. */
  title?: string;
  /**
   * Adjuntado por el backend a la respuesta del turno de cierre: la entrada
   * `concepto` (resumen de Oro) que debe pintarse como bloque amarillo.
   */
  concepto_entry?: ChatMessage;
}

/**
 * Glitch surfaced by the agent during a session.
 * `score >= 5` → healthy (green check). `score < 5` → warning (yellow).
 */
export interface Glitch {
  id: UUID;
  text: string;
  score: number;
  ts: string;
}

export interface SessionRecord {
  id: UUID;
  user_id: UUID;
  brand_id: UUID | null;
  title: string;
  status: SessionStatus;
  friction_level: number; // max reached
  calcification_delta: number;
  interval_count: number;
  glitch_count: number;
  encauzamiento_count: number;
  coupling_node_triggered: boolean;
  resolution_status: ResolutionStatus;
  integration_signal_received_at: string | null;
  gold_extraction_status: GoldExtractionStatus;
  /** How the session closed: 'gold' | 'coupling_pause' | 'coupling_max' (null while open / legacy). */
  close_reason?: string | null;
  transcript_payload: ChatMessage[];
  glitches: Glitch[];
  extracted_asset_id: UUID | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Aggregated operator diagnostic produced by the backend
 * (combines friction, encauzamientos, coupling nodes and glitches).
 */
export interface DiagnosticPayload {
  friction_trend?: {
    direction?: "subiendo" | "bajando" | "plano" | string;
    stuck_level?: number | null;
    lectura?: string;
  } | null;
  coupling?: { entered_last_3?: boolean; porque?: string; vigilar?: string } | null;
  last_encauzamiento?: { existe?: boolean; valoracion?: string } | null;
  supervision_flags?: string[];
}

export interface OperatorDiagnostic {
  text: string;
  score: number;
  max_friction: number;
  encauzamiento_count: number;
  glitch_count: number;
  coupling_node_count: number;
  glitches: Glitch[];
  /** Diagnóstico narrativo del motor n8n (persistido). Ausente hasta el primer cierre. */
  payload?: DiagnosticPayload | null;
  generated_at?: string | null;
  trigger_reason?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
