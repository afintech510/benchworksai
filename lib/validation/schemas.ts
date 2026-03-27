import { z } from 'zod';

// Shared primitives
const email = z.string().email().max(255);
const uuid = z.string().uuid();

// Contact form / inquiry submission
export const inquirySchema = z.object({
  audience_type: z.enum(['hiring', 'smb_client', 'agency', 'other', 'booking']),
  name: z.string().min(1).max(200),
  email,
  company: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  message: z.string().min(1).max(5000),
  form_data: z.record(z.string(), z.unknown()).optional(),
  marketing_context: z.record(z.string(), z.string()).optional(),
  source_page: z.string().max(500).optional(),
});

// Email gate (demo access)
export const demoGateSchema = z.object({
  email,
  name: z.string().min(1).max(200).optional(),
  company: z.string().max(200).optional(),
  subscribed: z.boolean().default(false),
  marketing_context: z.record(z.string(), z.string()).optional(),
  vertical_interest: z.string().max(50).optional(),
  source_demo: z.string().max(50).optional(),
});

// Demo session creation
export const demoSessionSchema = z.object({
  demo_type: z.string().min(1).max(50),
  vertical: z.string().min(1).max(50),
});

// Demo interaction input
export const demoInteractSchema = z.object({
  session_id: uuid,
  input_type: z.enum(['text', 'click', 'upload', 'preset_command']).default('text'),
  user_input: z.string().max(2000).optional(),
  trigger_key: z.string().max(100).optional(),
});

// Competitive analysis request
export const competitiveAnalysisSchema = z.object({
  session_id: uuid,
  business_name: z.string().min(1).max(300),
  competitors: z.array(z.string().max(300)).max(10).optional(),
});

// Lead magnet download
export const magnetDownloadSchema = z.object({
  email,
  name: z.string().max(200).optional(),
  magnet_slug: z.string().min(1).max(100),
  vertical: z.string().max(50).optional(),
  source_page: z.string().max(500).optional(),
});

// Admin: update site config
export const adminConfigSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

// Admin: update lead
export const adminLeadUpdateSchema = z.object({
  contacted: z.boolean().optional(),
  notes: z.string().max(5000).optional(),
});

// Admin: drip message action
export const dripMessageActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'edit']),
  edited_subject: z.string().max(500).optional(),
  edited_body: z.string().max(50000).optional(),
});

// Booking webhook payload
export const bookingWebhookSchema = z.object({
  event: z.string(),
  payload: z.record(z.string(), z.unknown()),
});

// Type exports
export type InquiryInput = z.infer<typeof inquirySchema>;
export type DemoGateInput = z.infer<typeof demoGateSchema>;
export type DemoSessionInput = z.infer<typeof demoSessionSchema>;
export type DemoInteractInput = z.infer<typeof demoInteractSchema>;
export type CompetitiveAnalysisInput = z.infer<typeof competitiveAnalysisSchema>;
export type MagnetDownloadInput = z.infer<typeof magnetDownloadSchema>;
export type AdminConfigInput = z.infer<typeof adminConfigSchema>;
export type AdminLeadUpdateInput = z.infer<typeof adminLeadUpdateSchema>;
export type DripMessageActionInput = z.infer<typeof dripMessageActionSchema>;
export type BookingWebhookInput = z.infer<typeof bookingWebhookSchema>;
