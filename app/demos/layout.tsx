import { DemoNav } from '@/components/demos/DemoNav';

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoNav />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
