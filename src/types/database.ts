// TailStake Database Types
// Mirrors the Supabase schema exactly

export type SyndicateStatus = "draft" | "active" | "dissolved";
export type MemberRole = "initiator" | "member";
export type InvitationStatus = "pending" | "accepted" | "expired";
export type AgreementType = "formation" | "amendment" | "transfer";
export type AgreementStatus = "draft" | "pending_signatures" | "signed";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface Syndicate {
  id: string;
  name: string;
  aircraft_tail_number: string;
  aircraft_type: string;
  aircraft_value: number;
  home_airfield: string;
  status: SyndicateStatus;
  created_by: string;
  created_at: string;
}

export interface Member {
  id: string;
  syndicate_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  ownership_bps: number; // 0-10000, where 10000 = 100%
  role: MemberRole;
  joined_at: string | null;
}

export interface Invitation {
  id: string;
  syndicate_id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  created_at: string;
  expires_at: string;
}

export interface AgreementTerms {
  aircraft_tail_number: string;
  aircraft_type: string;
  aircraft_value: number;
  home_airfield: string;
  rofr_window_days: number;
  voting_threshold_bps: number; // e.g., 6667 = 66.67%
  monthly_dues_eur: number;
  members: Array<{
    name: string;
    email: string;
    ownership_bps: number;
    role: MemberRole;
  }>;
}

export interface Agreement {
  id: string;
  syndicate_id: string;
  type: AgreementType;
  version: number;
  terms: AgreementTerms;
  pdf_url: string | null;
  status: AgreementStatus;
  created_at: string;
}

export interface Signature {
  id: string;
  agreement_id: string;
  member_id: string;
  signed_at: string;
  ip_address: string;
  user_agent: string;
}

export interface Payment {
  id: string;
  syndicate_id: string;
  member_id: string | null;
  stripe_session_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

// Wizard draft state (stored in syndicates table while status=draft)
export interface WizardDraft {
  step: number;
  aircraft: {
    tail_number: string;
    type: string;
    value: number;
    airfield: string;
  };
  members: Array<{
    name: string;
    email: string;
    ownership_bps: number;
    role: MemberRole;
  }>;
  rules: {
    rofr_window_days: number;
    voting_threshold_bps: number;
    monthly_dues_eur: number;
  };
}
