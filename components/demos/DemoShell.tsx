'use client';

import { Suspense, type ReactNode } from 'react';
import { DemoDisclaimer } from './DemoDisclaimer';

interface DemoShellProps {
  demoType?: string;
  demoDisplayName: string;
  vertical: string;
  verticalDisplayName: string;
  sessionId?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  children: ReactNode;
}

function DemoSkeleton({ message }: { message?: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-4 bg-muted rounded w-5/6" />
      {message && (
        <p className="text-sm text-muted-foreground mt-4">{message}</p>
      )}
    </div>
  );
}

function DemoError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-sm text-red-700 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-primary hover:text-primary-hover transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function DemoShell({
  demoDisplayName,
  vertical,
  verticalDisplayName,
  isLoading,
  loadingMessage,
  error,
  onRetry,
  children,
}: DemoShellProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{demoDisplayName}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Industry: {verticalDisplayName}
        </p>
      </div>

      {/* Content area */}
      <div className="rounded-xl border border-border bg-background p-6 min-h-[400px]">
        {error ? (
          <DemoError message={error} onRetry={onRetry} />
        ) : isLoading ? (
          <DemoSkeleton message={loadingMessage} />
        ) : (
          <Suspense fallback={<DemoSkeleton />}>
            {children}
          </Suspense>
        )}
      </div>

      <DemoDisclaimer vertical={vertical} />
    </div>
  );
}
