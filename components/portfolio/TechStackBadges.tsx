interface TechStackBadgesProps {
  stack: string[];
  className?: string;
}

export function TechStackBadges({ stack, className = '' }: TechStackBadgesProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stack.map((tech) => (
        <span
          key={tech}
          className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {tech}
        </span>
      ))}
    </div>
  );
}
