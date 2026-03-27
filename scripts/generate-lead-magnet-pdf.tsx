/**
 * Generates the AI Enablement Playbook placeholder PDF.
 * Run: npx tsx scripts/generate-lead-magnet-pdf.tsx
 *
 * Outputs to: public/downloads/ai-playbook-construction.pdf
 * Upload to Supabase Storage bucket "lead-magnets" under downloads/ai-playbook-construction.pdf
 */
import React from 'react';
import { renderToFile, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { mkdirSync } from 'fs';
import { join } from 'path';

const styles = StyleSheet.create({
  page: { padding: 50, fontFamily: 'Helvetica' },
  coverPage: { padding: 50, fontFamily: 'Helvetica', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 12, color: '#2563eb' },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 8 },
  author: { fontSize: 12, color: '#94a3b8', marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 20, color: '#0f172a' },
  subheading: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, marginTop: 12, color: '#1e293b' },
  body: { fontSize: 11, lineHeight: 1.6, color: '#334155', marginBottom: 8 },
  bulletItem: { fontSize: 11, lineHeight: 1.6, color: '#334155', marginBottom: 4, paddingLeft: 16 },
  cta: { fontSize: 13, fontWeight: 'bold', color: '#2563eb', marginTop: 20, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 30, left: 50, right: 50, fontSize: 9, color: '#94a3b8', textAlign: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginVertical: 16 },
});

function Playbook() {
  return (
    <Document title="AI Enablement Playbook: Construction & Building Materials" author="Larkin Tech">
      {/* Cover */}
      <Page size="LETTER" style={styles.coverPage}>
        <Text style={styles.title}>AI Enablement Playbook</Text>
        <Text style={styles.subtitle}>Construction & Building Materials</Text>
        <Text style={{ ...styles.subtitle, fontSize: 13 }}>A practical guide to implementing AI in your construction business</Text>
        <Text style={styles.author}>Larkin Tech — AI Implementation for Construction</Text>
        <Text style={{ ...styles.author, marginTop: 8 }}>larkintech.ai</Text>
        <Text style={styles.footer}>Copyright 2026 Larkin Tech. All rights reserved.</Text>
      </Page>

      {/* Page 2: Executive Summary */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.body}>
          AI is no longer a future technology for construction — it is an operational advantage that your competitors are adopting now. Labor costs are rising, margins are thinning, and the businesses that automate intelligently will outperform those that do not.
        </Text>
        <Text style={styles.body}>
          This playbook maps the highest-impact AI opportunities for construction and building materials businesses. It quantifies the costs of manual processes, shows what AI-assisted alternatives look like, and provides a phased implementation roadmap you can take to your partners or board today.
        </Text>
        <Text style={styles.body}>
          Every use case referenced in this playbook has a live, interactive demo at LarkinTECH.ai/demos — so you can see the technology in action before making any commitment.
        </Text>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Where Time and Money Disappear</Text>
        <Text style={styles.body}>
          Construction businesses lose thousands of hours annually to manual processes that AI can handle in minutes:
        </Text>
        <Text style={styles.bulletItem}>- Manual material quoting: 8-12 hours/week at $75/hr = $31K-$47K/year in labor alone</Text>
        <Text style={styles.bulletItem}>- Customer communication gaps: missed follow-ups, delayed responses, lost leads</Text>
        <Text style={styles.bulletItem}>- Document chaos: bids, change orders, and safety forms scattered across systems</Text>
        <Text style={styles.bulletItem}>- Billing friction: late invoices, missed payments, manual collections</Text>
        <Text style={styles.bulletItem}>- Safety compliance paperwork: repetitive, time-consuming, error-prone</Text>
        <Text style={styles.bulletItem}>- Inventory guesswork: over-ordering ties up capital, stockouts delay projects</Text>
        <Text style={styles.footer}>AI Enablement Playbook — Larkin Tech | Page 2</Text>
      </Page>

      {/* Page 3-4: AI Opportunity Map */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>The AI Opportunity Map</Text>
        <Text style={styles.subheading}>1. Material Quote Automation</Text>
        <Text style={styles.body}>Before: Staff manually calculates quantities from specs. 2-4 hours per quote.</Text>
        <Text style={styles.body}>After: AI reads project specs and drafts quotes in minutes. Estimated savings: 6+ hours/week.</Text>

        <Text style={styles.subheading}>2. Customer Communication Workflows</Text>
        <Text style={styles.body}>Before: Manual follow-ups, missed appointment reminders, delayed project updates.</Text>
        <Text style={styles.body}>After: AI-personalized communications sent automatically. No leads fall through cracks.</Text>

        <Text style={styles.subheading}>3. Document Processing & Extraction</Text>
        <Text style={styles.body}>Before: Staff manually reads plans, permits, invoices to extract data.</Text>
        <Text style={styles.body}>After: AI reads and extracts key data from any document format in seconds.</Text>

        <Text style={styles.subheading}>4. Competitive Pricing Intelligence</Text>
        <Text style={styles.body}>Before: Gut feel on pricing. No systematic competitor monitoring.</Text>
        <Text style={styles.body}>After: AI-generated competitive analysis with market positioning insights.</Text>

        <Text style={styles.subheading}>5. Safety Compliance Automation</Text>
        <Text style={styles.body}>Before: Manual inspection checklists, paper-based certification tracking.</Text>
        <Text style={styles.body}>After: AI generates checklists, tracks certifications, flags expirations.</Text>
        <Text style={styles.footer}>AI Enablement Playbook — Larkin Tech | Page 3</Text>
      </Page>

      {/* Page 5: Implementation Roadmap + CTA */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Implementation Roadmap</Text>
        <Text style={styles.subheading}>Phase 1: Quick Wins (30 days)</Text>
        <Text style={styles.body}>Start with 2-3 low-complexity, high-impact use cases. Customer communication workflows and document processing are ideal starting points. Expected: 5-10 hours/week saved, visible to the whole team.</Text>

        <Text style={styles.subheading}>Phase 2: Foundation (60-90 days)</Text>
        <Text style={styles.body}>Build data infrastructure, connect systems, add material quoting automation. Expected: 15-25 hours/week saved, measurable ROI.</Text>

        <Text style={styles.subheading}>Phase 3: Transformation (6 months)</Text>
        <Text style={styles.body}>Full integration — competitive intelligence, demand forecasting, marketing engine. Expected: 30%+ operational efficiency gain.</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Next Steps</Text>
        <Text style={styles.body}>
          This playbook is your starting point. To see these AI capabilities in action, visit the interactive demo showroom at LarkinTECH.ai/demos/construction. Every use case in this document has a live demo you can try.
        </Text>
        <Text style={styles.body}>
          Ready to start? Book a free discovery call to discuss which AI implementations make sense for your business.
        </Text>
        <Text style={styles.cta}>Book a Discovery Call: larkintech.ai/contact</Text>
        <Text style={{ ...styles.cta, marginTop: 8 }}>Try Live Demos: larkintech.ai/demos</Text>

        <Text style={styles.footer}>AI Enablement Playbook — Larkin Tech | Page 5</Text>
      </Page>
    </Document>
  );
}

const outDir = join(process.cwd(), 'public', 'downloads');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'ai-playbook-construction.pdf');

renderToFile(<Playbook />, outPath).then(() => {
  console.log(`PDF generated: ${outPath}`);
});
