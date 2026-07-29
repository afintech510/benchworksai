export function BioSection() {
  return (
    <section className="flex flex-col items-center gap-8 md:flex-row md:items-start">
      {/* Founder photo placeholder — replace with public/images/headshot.jpg */}
      <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
        AL
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">BenchworksAI</h1>
        <p className="mt-1 text-lg text-primary">
          A full-service digital team for local business · Founded by Adam Larkin
        </p>
        <div className="prose-custom mt-6">
          <p>
            We build the digital backbone local businesses run on — websites and platforms, SEO,
            Google Ads, email &amp; SMS marketing, automation, and the AI tools that fit how you
            actually work. From a simple website to a full operating platform, we build it, run it,
            and hand you something you own.
          </p>
          <p>
            Our approach is hands-on and grounded in real engineering. We write the code, configure
            the infrastructure, and deploy to production — then we stay on as your team for whatever
            comes next. When we hand you a system, it is running, documented, and ready to keep working
            for you.
          </p>
          <p>
            We work across industries — construction and the trades, property management, professional
            services, and local SMBs — in English and Spanish. Founded by Adam Larkin, we pair senior
            technical depth with a partner who actually builds the work and stands behind it.
          </p>
        </div>
      </div>
    </section>
  );
}
