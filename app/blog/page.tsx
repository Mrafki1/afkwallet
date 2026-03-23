import Link from "next/link";
import { getAllPosts } from "../lib/posts";
import Navbar from "../components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, tips, and news for Canadian credit card churners — welcome bonuses, rebate portals, and more.",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs font-semibold text-red-900 uppercase tracking-widest mb-2">ChurnCA Blog</p>
          <h1 className="text-4xl font-bold text-gray-900">Guides & News</h1>
          <p className="text-gray-500 mt-3 text-lg">Tips for Canadian credit card churners — bonuses, portals, and strategy.</p>
        </div>

        <div className="flex flex-col divide-y divide-gray-100">
          {posts.map(post => (
            <article key={post.slug} className="py-8 group">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-xs text-gray-400 font-medium">{formatDate(post.date)}</time>
                {post.tags?.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-red-900 transition-colors leading-snug mb-2">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">{post.description}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm font-semibold text-red-900 hover:underline"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
