'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { EmailGateModal } from '@/components/demos/EmailGateModal';

function GateContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/demos';

  return <EmailGateModal redirectTo={redirect} />;
}

export default function GatePage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted max-w-md mx-auto mt-12" />}>
      <GateContent />
    </Suspense>
  );
}
