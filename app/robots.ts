import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/auth", "/settings", "/admin", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
