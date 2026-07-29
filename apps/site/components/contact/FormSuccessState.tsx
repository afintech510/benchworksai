import Link from 'next/link';

export function FormSuccessState() {
  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
      <div className="text-4xl">&#10003;</div>
      <h3 className="mt-4 text-xl font-semibold text-foreground">Message Sent!</h3>
      <p className="mt-2 text-muted-foreground">
        Thanks for reaching out. I typically respond within 24 hours.
      </p>
      <p className="mt-6 text-sm text-muted-foreground">
        While you wait, explore the{' '}
        <Link href="/demos" className="font-medium text-primary hover:underline">
          AI Demo Showroom
        </Link>{' '}
        to see what I build.
      </p>
    </div>
  );
}
