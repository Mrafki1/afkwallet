import type { MetadataRoute } from "next";
import { getCardIds } from "./lib/cards-db";
import { getAllPosts } from "./lib/posts";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://churning-site.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,             lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/cards`,  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/deals`,  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/blog`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
  ];

  const cardIds = await getCardIds();
  const cardPages: MetadataRoute.Sitemap = cardIds.map(id => ({
    url: `${BASE}/cards/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = getAllPosts().map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...cardPages, ...blogPages];
}
