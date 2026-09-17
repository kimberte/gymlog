import { BLOG_POSTS, getBlogPost as getOriginalBlogPost } from "./blogData";
import { ADDITIONAL_BLOG_POSTS } from "./additionalPosts";
import { NEW_BLOG_POSTS } from "./newPosts";

export const ALL_BLOG_POSTS = [...BLOG_POSTS, ...ADDITIONAL_BLOG_POSTS, ...NEW_BLOG_POSTS].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getBlogPost(slug: string) {
  return getOriginalBlogPost(slug) ?? ADDITIONAL_BLOG_POSTS.find(post => post.slug === slug) ?? NEW_BLOG_POSTS.find(post => post.slug === slug);
}
