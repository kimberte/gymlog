import { BLOG_POSTS, getBlogPost as getOriginalBlogPost } from "./blogData";
import { ADDITIONAL_BLOG_POSTS } from "./additionalPosts";

export const ALL_BLOG_POSTS = [...BLOG_POSTS, ...ADDITIONAL_BLOG_POSTS];

export function getBlogPost(slug: string) {
  return getOriginalBlogPost(slug) ?? ADDITIONAL_BLOG_POSTS.find(post => post.slug === slug);
}
