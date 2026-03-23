import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDir = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags?: string[];
};

export type Post = PostMeta & {
  contentHtml: string;
};

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
  const posts = files.map(filename => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(postsDir, filename), "utf8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title as string,
      date: data.date as string,
      description: data.description as string,
      tags: data.tags as string[] | undefined,
    };
  });
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPost(slug: string): Promise<Post | null> {
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const processed = await remark().use(html).process(content);
  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    description: data.description as string,
    tags: data.tags as string[] | undefined,
    contentHtml: processed.toString(),
  };
}
