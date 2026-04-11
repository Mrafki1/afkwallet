import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllPosts, getPost } from "../../lib/posts";
import Navbar from "../../components/Navbar";
import ShareButtons from "./ShareButtons";
import EmailCapture from "../../components/EmailCapture";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";
  return {
    title: `${post.title} | PointsBinder`,
    description: post.description,
    keywords: post.tags,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${slug}`,
      type: "article",
      publishedTime: post.date,
      ...(post.image ? { images: [{ url: post.image, width: 1200, height: 630, alt: post.title }] } : {}),
    },
    twitter: {
      card: post.image ? "summary_large_image" : "summary",
      title: post.title,
      description: post.description,
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pointsbinder.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.description,
      "datePublished": post.date,
      "dateModified": post.date,
      "url": `${siteUrl}/blog/${slug}`,
      "publisher": {
        "@type": "Organization",
        "name": "PointsBinder",
        "url": siteUrl,
      },
      "author": {
        "@type": "Organization",
        "name": "PointsBinder",
      },
      ...(post.image ? { "image": post.image } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${siteUrl}/blog` },
        { "@type": "ListItem", "position": 3, "name": post.title, "item": `${siteUrl}/blog/${slug}` },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar activePage="blog" />

      {/* Hero image */}
      {post.image && (
        <div className="relative w-full" style={{ height: 420 }}>
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="max-w-3xl mx-auto px-6 pb-10 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <time className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{formatDate(post.date)}</time>
                {post.tags?.map(tag => (
                  <span key={tag} className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(37,99,235,0.85)", color: "#fff" }}>
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight" style={{ letterSpacing: "-0.02em" }}>
                {post.title}
              </h1>
              <p className="mt-3 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                {post.description}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Back link + header (when no hero image) */}
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium mb-8 transition-colors"
          style={{ color: "#64748b" }}>
          ← All guides
        </Link>

        {!post.image && (
          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <time className="text-xs text-gray-400 font-medium">{formatDate(post.date)}</time>
              {post.tags?.map(tag => (
                <span key={tag} className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#eff6ff", color: "#2563eb" }}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "#0f172a", letterSpacing: "-0.02em" }}>{post.title}</h1>
            <p className="mt-3 text-lg leading-relaxed" style={{ color: "#64748b" }}>{post.description}</p>
          </div>
        )}

        {/* Share buttons */}
        <div className="mb-8">
          <ShareButtons title={post.title} url={`${siteUrl}/blog/${slug}`} />
        </div>

        <hr className="border-gray-100 mb-10" />

        {/* Body */}
        <div
          className="prose prose-gray prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-li:text-gray-600 prose-p:text-gray-600 prose-p:leading-relaxed max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <hr className="border-gray-100 mt-16 mb-6" />

        {/* Post-read share */}
        <div className="mb-10">
          <ShareButtons title={post.title} url={`${siteUrl}/blog/${slug}`} />
        </div>

        {/* Email capture */}
        <EmailCapture source="blog" variant="banner" />

        {/* CTA */}
        <div className="mt-6 rounded-2xl p-6" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <h3 className="font-bold text-base mb-1" style={{ color: "#0f172a" }}>Ready to find your next card?</h3>
          <p className="text-sm mb-4" style={{ color: "#64748b" }}>
            Browse 200+ Canadian credit cards with portal comparisons and first-year value calculated.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cards"
              className="inline-block text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ background: "#2563eb" }}>
              Browse all cards →
            </Link>
            <Link href="/dashboard"
              className="inline-block font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              style={{ border: "1px solid #bfdbfe", color: "#2563eb" }}>
              Track your cards
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
