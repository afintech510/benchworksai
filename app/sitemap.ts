import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://benchworksai.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/portfolio', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/portfolio/orchestration-framework', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/portfolio/customer-lifecycle-engine', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/portfolio/hamptons-estate', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/portfolio/host-hampton', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/pricing', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/services/websites-platforms', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/seo', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/google-ads', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/email-sms-marketing', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/business-automation', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/booking-scheduling', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/chatbots-ai-assistants', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/ai-education-training', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/services/fractional-cto', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/demos', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/services', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/explore', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  return pages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
