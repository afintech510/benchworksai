-- =============================================================================
-- Storage bucket for demo assets (PDFs, generated reports)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'demo-assets',
  'demo-assets',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated service-role inserts (server-side only)
-- No public read — signed URLs used for download
CREATE POLICY "Service role can upload demo assets"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'demo-assets');

CREATE POLICY "Service role can read demo assets"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'demo-assets');
