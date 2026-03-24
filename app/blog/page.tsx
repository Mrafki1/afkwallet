import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import Navbar from "../components/Navbar";
import VineDivider from "../components/VineDivider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Credit Card Guides & Strategy",
  description: "Guides, comparisons, and strategy for Canadian credit card rewards — welcome bonuses, rebate portals, Aeroplan, and more.",
  keywords: ["credit card churning Canada guide", "Aeroplan strategy", "rebate portal Canada", "best credit card bonus guide"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Credit Card Guides | AFK Wallet",
    description: "Guides and strategy for Canadian credit card rewards.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | AFK Wallet",
    description: "Guides and strategy for Canadian credit card rewards.",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen" style={{ background: "#f9f0d9", color: "#3d2b1f" }}>
      <Navbar activePage="blog" />

      {/* Header */}
      <div className="pt-16 pb-10" style={{ background: "#f9f0d9", borderBottom: "3px solid #c4a06a" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="sdv-sign inline-block text-xs px-3 py-1.5 mb-4">✦ Blog</div>
          <h1 className="text-4xl font-black" style={{ color: "#3d2b1f" }}>Guides & Strategy</h1>
          <p className="mt-3 text-lg" style={{ color: "#7a6048" }}>
            Guides for Canadians maximizing credit card rewards — bonuses, portals, and strategy.
          </p>
        </div>
      </div>

      <VineDivider />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-0">
          {posts.map(post => (
            <article
              key={post.slug}
              className="py-8 group"
              style={{ borderBottom: "2px solid #c4a06a" }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-xs font-medium" style={{ color: "#9a7858" }}>{formatDate(post.date)}</time>
                {post.tags?.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-pixel px-2 py-0.5"
                    style={{ background: "#ede0c0", color: "#7a5c3a", border: "2px solid #7a5c3a" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="sdv-blog-title text-xl font-bold leading-snug mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#7a6048" }}>{post.description}</p>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold transition-colors" style={{ color: "#4a7c59" }}>
                Read guide →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
