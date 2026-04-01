import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Credit Card Guides & Strategy",
  description: "Guides, comparisons, and strategy for Canadian credit card rewards — welcome bonuses, rebate portals, Aeroplan, and more.",
  keywords: ["credit card churning Canada guide", "Aeroplan strategy", "rebate portal Canada", "best credit card bonus guide"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Credit Card Guides | PointsBinder",
    description: "Guides and strategy for Canadian credit card rewards.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | PointsBinder",
    description: "Guides and strategy for Canadian credit card rewards.",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <Navbar activePage="blog" />

      {/* Header */}
      <div className="py-16" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="section-label mb-3">Blog</p>
          <h1 className="text-4xl font-bold tracking-tight mb-3" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>
            Guides &amp; Strategy
          </h1>
          <p className="text-lg" style={{ color: "#64748b" }}>
            Guides for Canadians maximizing credit card rewards — bonuses, portals, and strategy.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex flex-col">
          {posts.map(post => (
            <article
              key={post.slug}
              className="py-8"
              style={{ borderBottom: "1px solid #e2e8f0" }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-sm" style={{ color: "#94a3b8" }}>{formatDate(post.date)}</time>
                {post.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="badge badge-blue"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="blog-title text-xl font-semibold leading-snug mb-2" style={{ letterSpacing: "-0.01em" }}>
                  {post.title}
                </h2>
              </Link>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748b" }}>{post.description}</p>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold transition-colors" style={{ color: "#2563eb" }}>
                Read guide →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
