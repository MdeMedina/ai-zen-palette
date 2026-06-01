// Domain types aligned with the PKGD OS Prisma schema.
// The mock layer and the real REST backend (Node + Express + Prisma + n8n)
// must both honor these shapes so swapping `client.ts` is a one-line change.

export type UUID = string;

export type GlobalRole = "admin" | "operator";

export type AssetType = "SOP" | "Dogma" | "Gold" | "Jewel";
export type VectorizationStatus = "Pending" | "Embedded" | "Error";
export type BrandStatus = "Active" | "Paused" | "Archived";

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
  brand_id: UUID;
  title: string;
  asset_type: AssetType;
  status: "Active" | "Archived";
  source_file_url: string | null;
  pgvector_ref_id: string | null;
  vectorization_status: VectorizationStatus;
  source_session_id?: UUID | null;
  created_at: string;
}

export interface ChatMessage {
  id: UUID;
  role: "user" | "ai-ceo";
  text: string;
  ts: string;
}

export interface SessionRecord {
  id: UUID;
  user_id: UUID;
  brand_id: UUID;
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
  transcript_payload: ChatMessage[];
  extracted_asset_id: UUID | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}