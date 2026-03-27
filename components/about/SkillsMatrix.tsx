const SKILL_CATEGORIES = [
  {
    category: 'AI & ML',
    skills: ['Claude API', 'Prompt Engineering', 'RAG Pipelines', 'Multi-Agent Systems', 'LLM Evaluation'],
  },
  {
    category: 'Frontend',
    skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'React Hook Form'],
  },
  {
    category: 'Backend & Data',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'Supabase', 'REST APIs'],
  },
  {
    category: 'Infrastructure',
    skills: ['Docker', 'GitHub Actions', 'Hetzner VPS', 'Blue-Green Deploy', 'nginx'],
  },
  {
    category: 'Tools & Practices',
    skills: ['Git', 'CI/CD', 'Structured Logging', 'Rate Limiting', 'Security (JWT, RLS, CSRF)'],
  },
];

export function SkillsMatrix() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-foreground">Technical Skills</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SKILL_CATEGORIES.map((cat) => (
          <div key={cat.category} className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              {cat.category}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {cat.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
