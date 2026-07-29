// Lighthouse CI configuration
// Run: npx @lhci/cli autorun
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/services/ai-solutions-architect',
        'http://localhost:3000/services/ai-automation',
        'http://localhost:3000/demos',
        'http://localhost:3000/contact',
        'http://localhost:3000/pricing',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          // Simulated 4G
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
