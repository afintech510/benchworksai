'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Project {
  slug: string;
  title: string;
  description: string;
  techStack: string[];
  categories: string[];
  featured?: boolean;
}

const PROJECTS: Project[] = [
  {
    slug: 'orchestration-framework',
    title: 'Multi-Agent Orchestration Framework',
    description: 'Production-grade multi-agent system with formal privilege escalation, policy engine, and tenant isolation.',
    techStack: ['Python', 'LangGraph', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
    categories: ['Architecture', 'AI'],
    featured: true,
  },
  {
    slug: 'customer-lifecycle-engine',
    title: 'Customer Lifecycle Engine',
    description: 'Data pipeline processing thousands of POS orders with intelligent identity matching and behavioral segmentation.',
    techStack: ['React', 'TypeScript', 'Supabase', 'PostgreSQL', 'Recharts'],
    categories: ['Data', 'Full-Stack'],
  },
  {
    slug: 'hamptons-estate',
    title: 'Hamptons Estate Property Management',
    description: 'Complete digital platform for a property management company — from contract negotiation to production deployment.',
    techStack: ['Next.js', 'TypeScript', 'Tailwind', 'Supabase', 'Docker', 'Google Maps API'],
    categories: ['Full-Stack', 'AI'],
  },
  {
    slug: 'host-hampton',
    title: 'HostHampton',
    description: 'High-conversion event platform with boutique Hamptons aesthetic and modular fundraiser configuration.',
    techStack: ['React', 'JavaScript', 'Tailwind', 'Twilio'],
    categories: ['Frontend'],
  },
];

const ALL_TECHNOLOGIES = [...new Set(PROJECTS.flatMap((p) => p.techStack))].sort();
const ALL_CATEGORIES = [...new Set(PROJECTS.flatMap((p) => p.categories))].sort();

export function PortfolioGrid() {
  const [techFilter, setTechFilter] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const filtered = PROJECTS.filter((p) => {
    if (techFilter && !p.techStack.includes(techFilter)) return false;
    if (catFilter && !p.categories.includes(catFilter)) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div>
          <span className="text-sm font-medium text-muted-foreground mr-3">Category:</span>
          <div className="inline-flex flex-wrap gap-2">
            <button
              onClick={() => setCatFilter(null)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                catFilter === null ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  catFilter === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground mr-3">Technology:</span>
          <div className="inline-flex flex-wrap gap-2">
            <button
              onClick={() => setTechFilter(null)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                techFilter === null ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            {ALL_TECHNOLOGIES.map((tech) => (
              <button
                key={tech}
                onClick={() => setTechFilter(techFilter === tech ? null : tech)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  techFilter === tech ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tech}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filtered.map((project) => (
          <Link
            key={project.slug}
            href={`/portfolio/${project.slug}`}
            className={`group relative rounded-xl border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg ${
              project.featured
                ? 'border-primary/30 sm:col-span-2'
                : 'border-border'
            }`}
          >
            {project.featured && (
              <span className="absolute top-4 right-4 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Featured
              </span>
            )}

            {/* Thumbnail placeholder */}
            <div className="mb-4 h-40 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
              {/* PLACEHOLDER — replace with project screenshots */}
              Architecture Preview
            </div>

            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
              {project.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="sm:col-span-2 text-center text-muted-foreground py-12">
            No projects match the selected filters.
          </p>
        )}
      </div>
    </div>
  );
}
