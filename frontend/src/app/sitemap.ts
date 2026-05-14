import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://zk-lms.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Fetch published courses for dynamic sitemap entries
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/api/courses?limit=100`, {
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      const courses = data.data?.courses || [];

      const coursePages: MetadataRoute.Sitemap = courses.map((course: { slug: string; updatedAt: string }) => ({
        url: `${baseUrl}/courses/${course.slug}`,
        lastModified: new Date(course.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

      return [...staticPages, ...coursePages];
    }
  } catch (error) {
    console.error('Failed to fetch courses for sitemap:', error);
  }

  return staticPages;
}
