import "server-only";
import { Feed } from "feed";
import { markdownToHtml } from "@/lib/markdown-html";
import { getAllPosts, getPost } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

const AUTHOR = {
  name: "emily / dablincx",
  email: "contact@byemily.org",
  link: SITE_URL,
};

export async function buildBlogFeed(): Promise<Feed> {
  const feed = new Feed({
    title: "emily / dablincx, blog",
    description: "writing by emily (dablincx / emilythegaycat)",
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    copyright: `all rights reserved ${new Date().getFullYear()}, emily / dablincx`,
    feedLinks: {
      rss: `${SITE_URL}/blog/rss.xml`,
      atom: `${SITE_URL}/blog/atom.xml`,
      json: `${SITE_URL}/blog/feed.json`,
    },
    author: AUTHOR,
  });
  for (const meta of await getAllPosts()) {
    const post = await getPost(meta.id);
    feed.addItem({
      title: meta.title,
      id: `${SITE_URL}/blog/${meta.id}`,
      link: `${SITE_URL}/blog/${meta.id}`,
      description: meta.excerpt,
      content: post ? await markdownToHtml(post.content) : undefined,
      date: new Date(meta.updated),
      published: new Date(meta.date),
      category: meta.tags?.map((name) => ({ name })),
      author: [AUTHOR],
    });
  }
  return feed;
}
