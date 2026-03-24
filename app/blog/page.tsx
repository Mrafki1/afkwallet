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
    <div className="min-h-screen bg-[#080d1a]">
      <Navbar activePage="blog" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-base font-pixel text-amber-400 mb-2">✦ Blog</p>
          <h1 className="text-4xl font-black text-white">Guides & Strategy</h1>
          <p className="text-slate-400 mt-3 text-lg">Guides for Canadians maximizing credit card rewards — bonuses, portals, and strategy.</p>
        </div>

        <div className="flex flex-col divide-y divide-slate-800">
          {posts.map(post => (
            <article key={post.slug} className="py-8 group">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-xs text-slate-500 font-medium">{formatDate(post.date)}</time>
                {post.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700">{tag}</span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-snug mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-4">{post.description}</p>
              <Link href={`/blog/${post.slug}`} className="text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Read guide →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
