import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "../../lib/posts";
import Navbar from "../../components/Navbar";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: `${post.title} — ChurnCA`, description: post.description },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Back link */}
        <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-700 transition-colors inline-flex items-center gap-1 mb-10">
          ← All posts
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <time className="text-xs text-gray-400 font-medium">{formatDate(post.date)}</time>
            {post.tags?.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">{post.title}</h1>
          <p className="text-gray-500 mt-3 text-lg leading-relaxed">{post.description}</p>
        </div>

        <hr className="border-gray-100 mb-10" />

        {/* Body */}
        <div
          className="prose prose-gray prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-red-900 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-li:text-gray-600 prose-p:text-gray-600 prose-p:leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <hr className="border-gray-100 mt-16 mb-10" />

        {/* CTA */}
        <div className="bg-red-50 rounded-2xl p-8 text-center">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Ready to find your next card?</h3>
          <p className="text-gray-500 text-sm mb-5">Browse 24+ Canadian cards with portal comparisons and first-year value calculated.</p>
          <Link
            href="/cards"
            className="inline-block bg-red-900 hover:bg-red-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Browse all cards →
          </Link>
        </div>
      </div>
    </div>
  );
}
