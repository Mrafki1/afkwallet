import type { MetadataRoute } from "next";
import { getCardIds, getCards } from "./lib/cards-db";
import { getAllPosts } from "./lib/posts";
import { slugify } from "./lib/slug";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";

const BEST_OF_SLUGS = [
  "travel-cards",
  "no-fee-cards",
  "cash-back-cards",
  "lounge-access",
  "no-fx-fee",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,               lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/cards`,    lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/deals`,    lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
    { url: `${BASE}/blog`,     lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/best`,     lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/compare`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/issuers`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/programs`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Best-Of category pages
  const bestOfPages: MetadataRoute.Sitemap = BEST_OF_SLUGS.map(slug => ({
    url: `${BASE}/best/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Card detail pages
  const [cardIds, allCards] = await Promise.all([getCardIds(), getCards()]);

  const cardPages: MetadataRoute.Sitemap = cardIds.map(id => ({
    url: `${BASE}/cards/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Issuer hub pages
  const issuers = [...new Set(allCards.map(c => c.issuer))];
  const issuerPages: MetadataRoute.Sitemap = issuers.map(issuer => ({
    url: `${BASE}/issuers/${slugify(issuer)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Program hub pages
  const programs = [...new Set(allCards.map(c => c.program))];
  const programPages: MetadataRoute.Sitemap = programs.map(program => ({
    url: `${BASE}/programs/${slugify(program)}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map(post => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...bestOfPages,
    ...cardPages,
    ...issuerPages,
    ...programPages,
    ...blogPages,
  ];
}
