import { MetadataRoute } from 'next';

const API_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const res = await fetch(`${API_SERVER_URL}/api/v1/public/properties?limit=24`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const items = data.data?.items || [];
      const dynamicRoutes: MetadataRoute.Sitemap = items.map((item: any) => ({
        url: `${SITE_URL}/properties/${item.id}`,
        lastModified: item.createdAt ? new Date(item.createdAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }));
      return [...staticRoutes, ...dynamicRoutes];
    }
  } catch {
    // Return static routes if API is unavailable during static generation
  }

  return staticRoutes;
}
