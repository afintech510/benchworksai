'use client';

const VERTICALS = [
  {
    id: 'general_smb',
    label: 'General SMB',
    description: 'I run a general business',
    icon: '🏢',
  },
  {
    id: 'construction',
    label: 'Construction',
    description: "I'm in construction",
    icon: '🏗️',
  },
  {
    id: 'property_mgmt',
    label: 'Property Management',
    description: 'I manage properties',
    icon: '🏠',
  },
  {
    id: 'legal',
    label: 'Legal',
    description: 'I work in legal',
    icon: '⚖️',
  },
] as const;

interface VerticalSelectorProps {
  onSelect: (verticalId: string) => void;
}

export function VerticalSelector({ onSelect }: VerticalSelectorProps) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Welcome to the Demo Showroom
      </h2>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Select your industry to see AI demos tailored to your business.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {VERTICALS.map((v) => (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-background hover:border-primary hover:shadow-md transition-all text-left"
          >
            <span className="text-3xl">{v.icon}</span>
            <span className="font-semibold text-foreground">{v.label}</span>
            <span className="text-sm text-muted-foreground">{v.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
