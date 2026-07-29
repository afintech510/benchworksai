import type { Metadata } from 'next';
import { DemoOnboarding } from '@/components/demos/DemoOnboarding';

export const metadata: Metadata = {
  title: 'Demo Showroom',
  description: 'Try interactive AI demos tailored to your industry. Chatbots, analytics, document processing, and more.',
};

export default function DemoShowroomPage() {
  return <DemoOnboarding />;
}
