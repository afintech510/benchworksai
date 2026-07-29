'use client';

import { useState, useCallback } from 'react';
import { VerticalSelector } from './VerticalSelector';
import { DemoShowroomGrid } from './DemoShowroomGrid';

const VERTICAL_LABELS: Record<string, string> = {
  general_smb: 'General SMB',
  construction: 'Construction',
  property_mgmt: 'Property Management',
  legal: 'Legal',
};

function getStoredVertical(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('lt_demo_vertical');
  } catch {
    return null;
  }
}

export function DemoOnboarding() {
  const [selectedVertical, setSelectedVertical] = useState<string | null>(getStoredVertical);

  const handleSelect = useCallback((verticalId: string) => {
    setSelectedVertical(verticalId);
    try {
      sessionStorage.setItem('lt_demo_vertical', verticalId);
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const handleChangeVertical = useCallback(() => {
    setSelectedVertical(null);
    try {
      sessionStorage.removeItem('lt_demo_vertical');
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  if (!selectedVertical) {
    return <VerticalSelector onSelect={handleSelect} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <button
          onClick={handleChangeVertical}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Change industry
        </button>
      </div>
      <DemoShowroomGrid
        vertical={selectedVertical}
        verticalLabel={VERTICAL_LABELS[selectedVertical] || selectedVertical}
      />
    </div>
  );
}
