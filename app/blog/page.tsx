import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "../lib/posts";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Card Guides & Strategy Canada | PointsBinder Blog",
  description: "Guides, comparisons, and strategy for Canadian credit card rewards — welcome bonuses, rebate portals, Aeroplan, and more.",
  keywords: ["credit card Canada guide", "Aeroplan strategy", "rebate portal Canada", "best credit card bonus"],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Credit Card Guides | PointsBinder",
    description: "Guides and strategy for Canadian credit card rewards.",
    url: "/blog",
    type: "website",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Navbar activePage="blog" />

      {/* Header */}
      <div style={{ background: "#0f172a" }}>
        <div className="max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>Blog</p>
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#ffffff", letterSpacing: "-0.03em" }}>
            Guides &amp; Strategy
          </h1>
          <p className="text-base" style={{ color: "#94a3b8" }}>
            Guides for Canadians maximizing credit card rewards — bonuses, portals, and strategy.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Featured post */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="grid md:grid-cols-2">
                {featured.image ? (
                  <div className="relative h-64 md:h-auto">
                    <Image src={featured.image} alt={featured.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-64 md:h-auto flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
                    <span className="text-6xl">📊</span>
                  </div>
                )}
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#eff6ff", color: "#2563eb" }}>Featured</span>
                    <time className="text-xs" style={{ color: "#94a3b8" }}>{formatDate(featured.date)}</time>
                  </div>
                  <h2 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors leading-snug"
                    style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
                    {featured.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#64748b" }}>{featured.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {featured.tags?.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "#f1f5f9", color: "#64748b" }}>{tag}</span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#2563eb" }}>Read guide →</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Rest of posts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`}
              className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-200 hover:shadow-md transition-all">
              {/* Thumbnail */}
              <div className="relative h-44 shrink-0">
                {post.image ? (
                  <Image src={post.image} alt={post.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}>
                    <span className="text-4xl">📝</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-5">
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <time className="text-[11px]" style={{ color: "#94a3b8" }}>{formatDate(post.date)}</time>
                  {post.tags?.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "#f1f5f9", color: "#64748b" }}>{tag}</span>
                  ))}
                </div>
                <h2 className="text-sm font-bold leading-snug mb-2 group-hover:text-blue-600 transition-colors flex-1"
                  style={{ color: "#0f172a" }}>
                  {post.title}
                </h2>
                <p className="text-xs leading-relaxed mb-3 line-clamp-2" style={{ color: "#94a3b8" }}>{post.description}</p>
                <span className="text-xs font-semibold" style={{ color: "#2563eb" }}>Read →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
