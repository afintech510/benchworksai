export function BioSection() {
  return (
    <section className="flex flex-col items-center gap-8 md:flex-row md:items-start">
      {/* Headshot placeholder — replace with public/images/headshot.jpg */}
      <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary">
        AL
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Adam Larkin</h1>
        <p className="mt-1 text-lg text-primary">AI Solutions Architect & Implementation Specialist</p>
        <div className="prose-custom mt-6">
          <p>
            I build AI systems that work in production — not slide decks, not proof-of-concepts, not demos
            that break the moment a real user touches them. My work spans the full stack: architecture
            design, prompt engineering, infrastructure, deployment, and the operational tooling that keeps
            systems running after launch.
          </p>
          <p>
            My approach is hands-on implementation grounded in software engineering fundamentals. I write the
            code, configure the infrastructure, debug the edge cases, and deploy to production. When I hand
            you a system, it is running, documented, and ready for your team to maintain.
          </p>
          <p>
            I work across industries — construction, property management, legal services, and general SMBs —
            because the patterns of AI implementation transfer across verticals. What changes is the domain
            language and business context. What stays the same is the engineering rigor required to ship
            reliable AI systems.
          </p>
        </div>
      </div>
    </section>
  );
}
