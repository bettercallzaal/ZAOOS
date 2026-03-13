import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/chat', '/admin', '/respect', '/api/'],
      },
    ],
    sitemap: 'https://zaoos.com/sitemap.xml',
  };
}
