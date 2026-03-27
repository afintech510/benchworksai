-- =============================================================================
-- Larkin Tech — Seed Data
-- Idempotent: uses INSERT ... ON CONFLICT DO UPDATE
-- Spec: Section 2.4 + addendum Part 1 Section 8
-- =============================================================================

-- 7 demo_types
INSERT INTO demo_types (id, display_name, description, icon, active, sort_order) VALUES
  ('chatbot', 'AI Chatbot', 'Intelligent conversational assistant tailored to your business', 'MessageSquare', true, 1),
  ('analytics', 'Predictive Analytics', 'AI-powered business intelligence and forecasting', 'BarChart3', true, 2),
  ('email_sms', 'Email & SMS Workflows', 'Automated communication sequences with AI personalization', 'Mail', true, 3),
  ('doc_processing', 'Document Processing', 'Intelligent document analysis and data extraction', 'FileSearch', true, 4),
  ('competitive_analysis', 'Competitive Analysis', 'AI-driven competitor research and market positioning', 'Target', true, 5),
  ('doc_drafting', 'Document Drafting', 'AI-assisted document and contract generation', 'FilePen', true, 6),
  ('marketing_engine', 'Marketing Engine', 'AI-powered content creation and campaign optimization', 'Megaphone', true, 7)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order;

-- 4 verticals
INSERT INTO verticals (id, display_name, description, icon, config, active) VALUES
  ('general_smb', 'General SMB', 'Small and medium businesses across industries', 'Building2', '{"disclaimer_required": false}', true),
  ('legal', 'Legal', 'Law firms and legal services', 'Scale', '{"disclaimer_required": true, "disclaimer_version": 1, "disclaimer_text": "AI-generated content is for informational purposes only and does not constitute legal advice."}', true),
  ('construction', 'Construction', 'Construction and contracting businesses', 'HardHat', '{"disclaimer_required": false}', true),
  ('property_mgmt', 'Property Management', 'Property management and real estate services', 'Building', '{"disclaimer_required": false}', true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  config = EXCLUDED.config,
  active = EXCLUDED.active;

-- site_config
INSERT INTO site_config (key, value) VALUES
  ('availability_status', '"available"'),
  ('rate_limit_config', '{"global_daily": 15, "chatbot": 5, "competitive_analysis": 1, "doc_drafting": 3, "default": 5}'),
  ('social_proof', '[{"metric": "TBD", "description": "TBD"}]')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;

-- 4 drip campaigns (addendum Part 1 Section 8)
INSERT INTO drip_campaigns (id, name, trigger_tier, trigger_vertical, trigger_event, steps, active) VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'Warm Lead — General',
    'warm',
    NULL,
    'score_change',
    '[{"step_number":1,"delay_hours":0,"email_template":"welcome_personalized","subject_prompt":"Write a subject line for a follow-up to {{lead_name}} who just tried our {{demo_type}} demo for {{vertical}}","body_prompt":"Write a personalized follow-up email to {{lead_name}} at {{company}}. They explored our {{demo_type}} demo in the {{vertical}} vertical. Position Adam Larkin as an AI implementation expert. Include a soft CTA to book a discovery call.","requires_approval":true},{"step_number":2,"delay_hours":48,"email_template":"value_add","subject_prompt":"Write a subject line delivering AI insights relevant to {{vertical}} businesses","body_prompt":"Write a value-add email sharing 2-3 specific AI automation opportunities for {{vertical}} businesses. Position as thought leadership, not a hard sell.","requires_approval":true},{"step_number":3,"delay_hours":168,"email_template":"case_study_share","subject_prompt":"Write a subject line sharing a relevant case study with {{lead_name}}","body_prompt":"Write an email sharing the most relevant Larkin Tech case study for {{vertical}}. Soft CTA to schedule a call.","requires_approval":false}]',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'Hot Lead — Competitive Analysis',
    'hot',
    NULL,
    'competitive_analysis',
    '[{"step_number":1,"delay_hours":0,"email_template":"competitive_ready","subject_prompt":"Your competitive analysis for {{business_name}} is ready","body_prompt":"Write an email delivering the competitive analysis results for {{business_name}}. Attach the full PDF. Position Adam as the expert who can implement these insights.","requires_approval":false},{"step_number":2,"delay_hours":72,"email_template":"competitive_insights","subject_prompt":"3 AI opportunities we spotted for {{business_name}}","body_prompt":"Write an email sharing 3 specific AI automation opportunities identified from their competitive analysis. Reference specific competitors and gaps.","requires_approval":true}]',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000003',
    'On Fire — Contact Form Submitted',
    'on_fire',
    NULL,
    'score_change',
    '[{"step_number":1,"delay_hours":0,"email_template":"contact_thanks","subject_prompt":"Thanks for reaching out, {{lead_name}}","body_prompt":"Write a thank-you email to {{lead_name}} who submitted a contact form. Reference the demos they explored. Adam will likely respond personally.","requires_approval":true}]',
    true
  ),
  (
    'a0000000-0000-0000-0000-000000000004',
    'Legal Vertical Specialist',
    'warm',
    'legal',
    'score_change',
    '[{"step_number":1,"delay_hours":0,"email_template":"legal_welcome","subject_prompt":"AI solutions for your legal practice, {{lead_name}}","body_prompt":"Write a personalized follow-up referencing legal AI capabilities the lead explored. Mention document drafting and compliance features.","requires_approval":true},{"step_number":2,"delay_hours":48,"email_template":"legal_thought_leadership","subject_prompt":"How AI is transforming estate planning","body_prompt":"Write a thought leadership email about AI in legal practice. Reference specific use cases.","requires_approval":true},{"step_number":3,"delay_hours":168,"email_template":"legal_case_study","subject_prompt":"See how a law firm automated their workflow","body_prompt":"Write an email sharing a Duffley Law-style engagement pitch with case study outcomes.","requires_approval":true}]',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  trigger_tier = EXCLUDED.trigger_tier,
  trigger_vertical = EXCLUDED.trigger_vertical,
  trigger_event = EXCLUDED.trigger_event,
  steps = EXCLUDED.steps,
  active = EXCLUDED.active;

-- 35 minimal demo_cached_responses (general_smb × 7 demos × 5 interactions)
INSERT INTO demo_cached_responses (demo_type, vertical, trigger_key, sequence_order, prompt_text, response_text, active) VALUES
  ('chatbot', 'general_smb', 'welcome', 1, 'Start conversation', 'Welcome! I''m your AI business assistant. I can help with customer inquiries, scheduling, and general business questions. What would you like to explore?', true),
  ('chatbot', 'general_smb', 'capabilities', 2, 'What can you do?', 'I can handle customer FAQs, appointment scheduling, order status inquiries, product recommendations, and after-hours support. I learn from your business data to give accurate, contextual responses.', true),
  ('chatbot', 'general_smb', 'pricing_inquiry', 3, 'How does pricing work?', 'Our chatbot solutions start with understanding your business needs. We analyze your most common customer interactions, build a custom knowledge base, and deploy an AI assistant that handles 70-80% of routine inquiries automatically.', true),
  ('chatbot', 'general_smb', 'integration', 4, 'How does it integrate?', 'The AI chatbot integrates with your existing website, CRM, and communication tools. Setup typically takes 2-3 weeks including training on your business data and testing.', true),
  ('chatbot', 'general_smb', 'get_started', 5, 'How do I get started?', 'Book a discovery call and we''ll analyze your current customer interaction patterns. We''ll identify the highest-impact automation opportunities and build a custom implementation plan.', true),
  ('analytics', 'general_smb', 'welcome', 1, 'Start analytics demo', 'Welcome to the Predictive Analytics demo. I''ll show you how AI can transform your business data into actionable forecasts. What aspect interests you most?', true),
  ('analytics', 'general_smb', 'revenue_forecast', 2, 'Show revenue forecast', 'Based on historical patterns, AI can predict revenue trends 3-6 months ahead with 85%+ accuracy. It identifies seasonal patterns, growth trajectories, and early warning signs of downturns.', true),
  ('analytics', 'general_smb', 'customer_insights', 3, 'Customer behavior analysis', 'AI analyzes purchase history, engagement patterns, and demographic data to identify your most valuable customer segments and predict churn risk before it happens.', true),
  ('analytics', 'general_smb', 'inventory', 4, 'Inventory optimization', 'Predictive models optimize stock levels by forecasting demand, reducing carrying costs by 15-25% while preventing stockouts. It factors in seasonality, promotions, and market trends.', true),
  ('analytics', 'general_smb', 'get_started', 5, 'How to implement?', 'We start with a data audit to assess your current data quality and sources. Then we build custom models tailored to your KPIs. Most SMBs see ROI within the first quarter.', true),
  ('email_sms', 'general_smb', 'welcome', 1, 'Start email workflow demo', 'Welcome to the Email & SMS Workflow demo. I''ll show you how AI creates personalized communication sequences that feel human-written. What would you like to see?', true),
  ('email_sms', 'general_smb', 'welcome_series', 2, 'Show welcome series', 'Here''s an AI-generated welcome series: personalized onboarding emails that adapt based on how each customer interacts. Open rates typically improve 40-60% vs generic templates.', true),
  ('email_sms', 'general_smb', 're_engagement', 3, 'Re-engagement campaign', 'AI identifies at-risk customers and generates personalized win-back messages. It picks the right channel (email vs SMS), timing, and offer based on individual behavior patterns.', true),
  ('email_sms', 'general_smb', 'ab_testing', 4, 'AI A/B testing', 'Instead of manual A/B tests, AI continuously optimizes subject lines, send times, and content variations. It learns from every interaction to improve future campaigns automatically.', true),
  ('email_sms', 'general_smb', 'get_started', 5, 'Implementation process', 'We integrate with your existing email platform (Mailchimp, SendGrid, etc.) and CRM. AI analyzes your past campaigns to establish baselines, then starts generating optimized content.', true),
  ('doc_processing', 'general_smb', 'welcome', 1, 'Start document processing demo', 'Welcome to Document Processing. I''ll demonstrate how AI extracts, classifies, and processes business documents automatically. What type of documents do you work with?', true),
  ('doc_processing', 'general_smb', 'invoice_processing', 2, 'Invoice processing', 'AI reads invoices from any format (PDF, scan, email), extracts key fields (vendor, amount, line items, dates), validates against PO numbers, and routes for approval. Accuracy: 95%+.', true),
  ('doc_processing', 'general_smb', 'contract_review', 3, 'Contract analysis', 'AI scans contracts for key terms, obligations, deadlines, and risk clauses. It flags non-standard language and generates summary reports highlighting action items.', true),
  ('doc_processing', 'general_smb', 'data_extraction', 4, 'Data extraction', 'From forms, receipts, reports — AI extracts structured data and feeds it directly into your systems. No manual data entry. Handles handwriting, tables, and multi-page documents.', true),
  ('doc_processing', 'general_smb', 'get_started', 5, 'Getting started', 'Send us sample documents and we''ll run a proof-of-concept extraction. We''ll measure accuracy against your current process and project time/cost savings.', true),
  ('competitive_analysis', 'general_smb', 'welcome', 1, 'Start competitive analysis', 'Welcome to Competitive Analysis. Enter your business name and I''ll generate an AI-powered competitive landscape report. What''s your business?', true),
  ('competitive_analysis', 'general_smb', 'market_position', 2, 'Analyze market position', 'AI maps your competitive landscape by analyzing online presence, pricing signals, customer reviews, and market positioning. It identifies gaps and opportunities in real-time.', true),
  ('competitive_analysis', 'general_smb', 'competitor_strengths', 3, 'Competitor strengths', 'For each competitor, AI evaluates their digital presence, customer sentiment, product/service offerings, and marketing strategies. You get actionable intelligence, not just data.', true),
  ('competitive_analysis', 'general_smb', 'opportunities', 4, 'Find opportunities', 'AI identifies underserved market segments, pricing opportunities, and areas where competitors are weak. These become your strategic advantages.', true),
  ('competitive_analysis', 'general_smb', 'get_started', 5, 'Full analysis', 'Book a discovery call and we''ll run a comprehensive competitive analysis for your business. You''ll receive a detailed PDF report with actionable recommendations.', true),
  ('doc_drafting', 'general_smb', 'welcome', 1, 'Start document drafting', 'Welcome to Document Drafting. I''ll show how AI generates professional business documents tailored to your needs. What type of document interests you?', true),
  ('doc_drafting', 'general_smb', 'proposal', 2, 'Generate a proposal', 'AI drafts professional proposals incorporating your services, pricing, timelines, and terms. It adapts tone and structure based on the prospect''s industry and size.', true),
  ('doc_drafting', 'general_smb', 'agreement', 3, 'Service agreement', 'Generate service agreements with standard clauses customized to your business. AI ensures consistency across documents while allowing per-client customization.', true),
  ('doc_drafting', 'general_smb', 'report', 4, 'Business report', 'AI compiles data from multiple sources into formatted reports with executive summaries, charts, and actionable recommendations. Saves hours of manual report writing.', true),
  ('doc_drafting', 'general_smb', 'get_started', 5, 'Implementation', 'We start by templating your most common documents, then train AI on your style and requirements. Most businesses automate 60-70% of routine document creation.', true),
  ('marketing_engine', 'general_smb', 'welcome', 1, 'Start marketing engine demo', 'Welcome to the Marketing Engine. I''ll demonstrate AI-powered content creation and campaign optimization. What marketing challenge are you facing?', true),
  ('marketing_engine', 'general_smb', 'content_creation', 2, 'AI content creation', 'AI generates blog posts, social media content, ad copy, and email campaigns aligned with your brand voice. It maintains consistency while scaling content production 10x.', true),
  ('marketing_engine', 'general_smb', 'seo_optimization', 3, 'SEO optimization', 'AI analyzes search trends, competitor rankings, and your existing content to generate SEO-optimized articles. It identifies keyword opportunities and content gaps automatically.', true),
  ('marketing_engine', 'general_smb', 'campaign_optimization', 4, 'Campaign optimization', 'AI monitors campaign performance across channels and automatically adjusts targeting, creative, and budget allocation to maximize ROI.', true),
  ('marketing_engine', 'general_smb', 'get_started', 5, 'Get started', 'We analyze your current marketing stack, brand guidelines, and performance data. Then we deploy AI tools that amplify your existing efforts — not replace your strategy.', true)
ON CONFLICT (demo_type, vertical, trigger_key) DO UPDATE SET
  sequence_order = EXCLUDED.sequence_order,
  prompt_text = EXCLUDED.prompt_text,
  response_text = EXCLUDED.response_text,
  active = EXCLUDED.active;

-- Additional 35 demo_cached_responses (general_smb × 7 demos × entries 6-10)
INSERT INTO demo_cached_responses (demo_type, vertical, trigger_key, sequence_order, prompt_text, response_text, active) VALUES
  -- chatbot 6-10
  ('chatbot', 'general_smb', 'response_time', 6, 'How fast are responses?', 'Average response time is under 2 seconds. The AI handles multiple conversations simultaneously with no wait times, even during peak hours. Customers get instant, accurate answers 24/7.', true),
  ('chatbot', 'general_smb', 'languages', 7, 'Multi-language support?', 'The chatbot supports 30+ languages with automatic detection. It seamlessly switches languages mid-conversation and maintains context. Great for businesses serving diverse communities.', true),
  ('chatbot', 'general_smb', 'handoff', 8, 'Human handoff process', 'When the AI detects complex issues or frustrated sentiment, it smoothly transfers to a human agent with full conversation context. Your team picks up exactly where the AI left off — no repeat explanations.', true),
  ('chatbot', 'general_smb', 'training', 9, 'How is it trained?', 'We train on your FAQ database, product catalog, past support tickets, and company policies. The AI continuously learns from new interactions and flagged corrections. Monthly accuracy reports keep you informed.', true),
  ('chatbot', 'general_smb', 'roi', 10, 'What ROI can I expect?', 'Most SMBs see 40-60% reduction in support ticket volume within 90 days. That translates to significant cost savings while improving customer satisfaction scores. We measure and report ROI monthly.', true),

  -- analytics 6-10
  ('analytics', 'general_smb', 'churn_prediction', 6, 'Predict customer churn', 'AI identifies customers likely to churn 30-60 days before they leave. It scores each customer on risk factors — declining engagement, support issues, competitive browsing — so you can intervene early.', true),
  ('analytics', 'general_smb', 'pricing', 7, 'Dynamic pricing insights', 'AI analyzes competitor pricing, demand elasticity, and customer willingness-to-pay to recommend optimal price points. Real-time adjustments can increase margin by 5-15%.', true),
  ('analytics', 'general_smb', 'marketing_roi', 8, 'Marketing spend analysis', 'AI attributes revenue to specific marketing channels and campaigns with multi-touch modeling. It identifies your most efficient spend and recommends budget reallocation for maximum ROI.', true),
  ('analytics', 'general_smb', 'anomaly_detection', 9, 'Anomaly detection', 'AI monitors your key metrics 24/7 and alerts you to unusual patterns — sudden drops in sales, spikes in returns, or unexpected cost increases. Early detection prevents small issues from becoming crises.', true),
  ('analytics', 'general_smb', 'dashboard', 10, 'Custom dashboards', 'AI generates natural-language summaries of your dashboards. Ask questions like "Why did revenue drop last week?" and get specific, data-backed explanations instead of just charts.', true),

  -- email_sms 6-10
  ('email_sms', 'general_smb', 'segmentation', 6, 'Smart segmentation', 'AI automatically segments your audience based on behavior, purchase history, and engagement patterns. Each segment gets tailored messaging that resonates with their specific needs and buying stage.', true),
  ('email_sms', 'general_smb', 'drip_campaigns', 7, 'Automated drip campaigns', 'AI designs multi-step drip campaigns that adapt in real-time. If a customer opens but doesn''t click, the next message adjusts. If they purchase, they move to a post-sale nurture track automatically.', true),
  ('email_sms', 'general_smb', 'personalization', 8, 'Hyper-personalization', 'Beyond "Hi {name}" — AI personalizes content, offers, and timing for each recipient. Product recommendations, dynamic content blocks, and send-time optimization based on individual behavior.', true),
  ('email_sms', 'general_smb', 'sms_automation', 9, 'SMS automation', 'AI determines when SMS vs email is more effective for each customer. Appointment reminders, shipping updates, flash sales — all timed for maximum engagement with smart frequency capping.', true),
  ('email_sms', 'general_smb', 'compliance', 10, 'Compliance & deliverability', 'Built-in CAN-SPAM and TCPA compliance. AI monitors deliverability metrics, manages unsubscribes, and automatically adjusts sending patterns to maintain high inbox placement rates.', true),

  -- doc_processing 6-10
  ('doc_processing', 'general_smb', 'receipt_scanning', 6, 'Receipt & expense processing', 'Photograph receipts and AI extracts vendor, amount, category, and tax info. Integrates with accounting software for automatic expense categorization and report generation. No more manual data entry.', true),
  ('doc_processing', 'general_smb', 'form_processing', 7, 'Form processing', 'AI processes applications, surveys, and registration forms from any format. It handles checkboxes, signatures, handwriting, and multi-page forms with field validation built in.', true),
  ('doc_processing', 'general_smb', 'classification', 8, 'Document classification', 'AI automatically sorts incoming documents by type — invoices, contracts, correspondence, tax forms — and routes them to the right department or workflow. 98% classification accuracy.', true),
  ('doc_processing', 'general_smb', 'compliance_check', 9, 'Compliance checking', 'AI reviews documents against your compliance requirements and flags missing fields, expired certifications, or non-compliant language. Reduces audit preparation time by 70%.', true),
  ('doc_processing', 'general_smb', 'batch_processing', 10, 'Batch processing', 'Process hundreds of documents simultaneously. AI maintains accuracy at scale — whether it''s year-end tax documents, quarterly reports, or a backlog of unprocessed invoices.', true),

  -- competitive_analysis 6-10
  ('competitive_analysis', 'general_smb', 'pricing_analysis', 6, 'Pricing comparison', 'AI monitors competitor pricing across products and services, tracks changes over time, and identifies pricing tiers and strategies. You see exactly where you''re positioned in the market.', true),
  ('competitive_analysis', 'general_smb', 'review_sentiment', 7, 'Review sentiment analysis', 'AI analyzes thousands of competitor reviews to identify recurring complaints and praised features. These insights reveal exactly what customers wish competitors did better — your opportunity.', true),
  ('competitive_analysis', 'general_smb', 'digital_presence', 8, 'Digital presence audit', 'AI evaluates competitors'' websites, SEO rankings, social media activity, and online advertising. You get a clear picture of their digital strategy and where you can outperform them.', true),
  ('competitive_analysis', 'general_smb', 'trend_monitoring', 9, 'Market trend monitoring', 'AI tracks industry trends, emerging competitors, and market shifts relevant to your business. Monthly intelligence briefings keep you ahead of changes before they impact your revenue.', true),
  ('competitive_analysis', 'general_smb', 'swot', 10, 'SWOT analysis', 'AI generates detailed SWOT analyses for your business and each competitor. Strengths, weaknesses, opportunities, and threats are backed by data — not guesswork — making strategy planning concrete.', true),

  -- doc_drafting 6-10
  ('doc_drafting', 'general_smb', 'email_templates', 6, 'Email templates', 'AI creates professional email templates for common scenarios — follow-ups, introductions, proposals, thank-yous. Each template adapts to the recipient''s context and your brand voice.', true),
  ('doc_drafting', 'general_smb', 'sop', 7, 'Standard operating procedures', 'AI helps draft SOPs by structuring your process knowledge into clear, step-by-step documents. It ensures consistency, includes safety notes, and formats for easy team reference.', true),
  ('doc_drafting', 'general_smb', 'marketing_copy', 8, 'Marketing copy', 'Generate ad copy, landing page text, brochure content, and social media posts. AI maintains your brand voice while optimizing for engagement and conversion across all formats.', true),
  ('doc_drafting', 'general_smb', 'legal_basics', 9, 'Basic legal documents', 'AI drafts NDAs, terms of service, privacy policies, and basic agreements using industry-standard templates. Always have these reviewed by legal counsel before use.', true),
  ('doc_drafting', 'general_smb', 'formatting', 10, 'Smart formatting', 'AI applies professional formatting — headers, tables, bullet points, page breaks — automatically. Documents look polished and consistent whether it''s a one-page letter or a 20-page report.', true),

  -- marketing_engine 6-10
  ('marketing_engine', 'general_smb', 'social_media', 6, 'Social media content', 'AI generates platform-specific content — LinkedIn thought leadership, Instagram captions, Twitter threads, Facebook posts. Each piece is optimized for the platform''s algorithm and audience expectations.', true),
  ('marketing_engine', 'general_smb', 'ad_copy', 7, 'Ad copy generation', 'Generate Google Ads, Facebook Ads, and display ad copy with AI. It creates multiple variations, suggests targeting criteria, and optimizes headlines for click-through rates.', true),
  ('marketing_engine', 'general_smb', 'brand_voice', 8, 'Brand voice consistency', 'AI learns your brand voice, tone guidelines, and messaging framework. Every piece of content — from tweets to whitepapers — sounds authentically you, just produced 10x faster.', true),
  ('marketing_engine', 'general_smb', 'competitor_content', 9, 'Competitor content analysis', 'AI monitors competitor content strategies — what topics they cover, how often they publish, what resonates with their audience. Use these insights to differentiate your content.', true),
  ('marketing_engine', 'general_smb', 'performance_reports', 10, 'Performance reporting', 'AI compiles content performance data across all channels into actionable reports. It identifies what''s working, what''s not, and recommends specific content strategy adjustments.', true)
ON CONFLICT (demo_type, vertical, trigger_key) DO UPDATE SET
  sequence_order = EXCLUDED.sequence_order,
  prompt_text = EXCLUDED.prompt_text,
  response_text = EXCLUDED.response_text,
  active = EXCLUDED.active;
