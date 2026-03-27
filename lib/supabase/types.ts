// TODO: Generate from Supabase CLI: npx supabase gen types typescript --project-id <id>
// Manual types based on spec Section 2.2 + addendum Part 1

export interface SiteConfig {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface DemoType {
  id: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  active: boolean;
  sort_order: number;
}

export interface Vertical {
  id: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  config: Record<string, unknown>;
  active: boolean;
}

export interface VerticalContent {
  id: string;
  vertical_id: string;
  content_type: string;
  content_key: string;
  content_data: Record<string, unknown>;
  created_at: string;
}

export interface DemoLead {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  vertical_interest: string | null;
  source_demo: string | null;
  subscribed: boolean;
  subscribed_at: string | null;
  jwt_version: number;
  revoked_at: string | null;
  marketing_context: Record<string, unknown>;
  created_at: string;
  last_seen_at: string;
}

export type AudienceType = 'hiring' | 'smb_client' | 'agency' | 'other' | 'booking';

export interface Inquiry {
  id: string;
  audience_type: AudienceType;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string;
  form_data: Record<string, unknown>;
  marketing_context: Record<string, unknown>;
  source_page: string | null;
  demo_lead_id: string | null;
  contacted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoSession {
  id: string;
  demo_lead_id: string;
  demo_type: string;
  vertical: string;
  interactions_count: number;
  live_ai_count: number;
  started_at: string;
  last_activity: string;
}

export type InputType = 'text' | 'click' | 'upload' | 'preset_command';

export interface DemoInteraction {
  id: string;
  session_id: string;
  input_type: InputType;
  user_input: string | null;
  response: string;
  response_data: Record<string, unknown> | null;
  from_cache: boolean;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  created_at: string;
}

export interface DemoCachedResponse {
  id: string;
  demo_type: string;
  vertical: string;
  trigger_key: string;
  sequence_order: number;
  prompt_text: string;
  response_text: string;
  response_data: Record<string, unknown> | null;
  active: boolean;
  content_version: number;
  created_at: string;
  updated_at: string;
}

export interface RateLimit {
  id: string;
  identifier: string;
  limit_type: 'session' | 'email_daily' | 'global_daily';
  demo_type: string;
  count: number;
  window_start: string;
  window_end: string;
}

export interface LeadMagnetDownload {
  id: string;
  demo_lead_id: string | null;
  email: string;
  name: string | null;
  magnet_slug: string;
  download_token: string;
  vertical: string | null;
  source_page: string | null;
  downloaded_at: string;
}

export interface CompetitiveAnalysis {
  id: string;
  session_id: string | null;
  business_name: string;
  competitors: unknown[];
  report_data: Record<string, unknown> | null;
  pdf_storage_path: string | null;
  created_at: string;
}

export interface ApiUsageLog {
  id: string;
  demo_type: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_cents: number;
  created_at: string;
}

export interface VerticalDisclaimerAcknowledgment {
  id: string;
  demo_lead_id: string;
  vertical_id: string;
  disclaimer_version: number;
  acknowledged_at: string;
}

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'exhausted';

export interface NotificationOutbox {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: NotificationStatus;
  retry_count: number;
  created_at: string;
  next_retry_at: string | null;
  completed_at: string | null;
}

export interface LeadScore {
  id: string;
  demo_lead_id: string;
  score: number;
  score_breakdown: Record<string, number>;
  tier: 'cold' | 'warm' | 'hot' | 'on_fire';
  last_calculated: string;
}

export interface DripCampaign {
  id: string;
  name: string;
  trigger_tier: string;
  trigger_vertical: string | null;
  trigger_event: string;
  steps: DripStep[];
  active: boolean;
  created_at: string;
}

export interface DripStep {
  step_number: number;
  delay_hours: number;
  email_template: string;
  subject_prompt: string;
  body_prompt: string;
  requires_approval: boolean;
}

export type DripEnrollmentStatus = 'active' | 'completed' | 'paused' | 'unsubscribed';

export interface DripEnrollment {
  id: string;
  demo_lead_id: string;
  campaign_id: string;
  current_step: number;
  status: DripEnrollmentStatus;
  enrolled_at: string;
  next_step_at: string | null;
}

export type DripMessageStatus = 'pending_review' | 'approved' | 'sent' | 'rejected' | 'failed';

export interface DripMessage {
  id: string;
  enrollment_id: string;
  step_number: number;
  subject: string;
  body_html: string;
  status: DripMessageStatus;
  ai_model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface RateLimitConfig {
  global_daily: number;
  chatbot: number;
  competitive_analysis: number;
  doc_drafting: number;
  default: number;
  [key: string]: number;
}
