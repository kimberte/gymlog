import { BLOG_POSTS, getBlogPost as getOriginalBlogPost } from "./blogData";
import { ADDITIONAL_BLOG_POSTS } from "./additionalPosts";
import { NEW_BLOG_POSTS } from "./newPosts";
import { DAILY_BLOG_POSTS } from "./dailyPosts";
import { DAILY_BLOG_POSTS_2 } from "./dailyPosts2";
import { DAILY_BLOG_POSTS_3 } from "./dailyPosts3";
import { DAILY_BLOG_POSTS_4 } from "./dailyPosts4";
import { DAILY_BLOG_POSTS_5 } from "./dailyPosts5";
import { DAILY_BLOG_POSTS_6 } from "./dailyPosts6";
import { FRESH_BLOG_POSTS } from "./freshPosts";
import { OCTOBER9_EVERGREEN_POST } from "./october9EvergreenPost";
import { OCTOBER9_RESEARCH_POST } from "./october9ResearchPost";

export const ALL_BLOG_POSTS = [...BLOG_POSTS, ...ADDITIONAL_BLOG_POSTS, ...NEW_BLOG_POSTS, ...DAILY_BLOG_POSTS, ...DAILY_BLOG_POSTS_2, ...DAILY_BLOG_POSTS_3, ...DAILY_BLOG_POSTS_4, ...DAILY_BLOG_POSTS_5, ...DAILY_BLOG_POSTS_6, ...FRESH_BLOG_POSTS, OCTOBER9_EVERGREEN_POST, OCTOBER9_RESEARCH_POST].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export function getBlogPost(slug: string) {
  return getOriginalBlogPost(slug)
    ?? ADDITIONAL_BLOG_POSTS.find(post => post.slug === slug)
    ?? NEW_BLOG_POSTS.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS_2.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS_3.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS_4.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS_5.find(post => post.slug === slug)
    ?? DAILY_BLOG_POSTS_6.find(post => post.slug === slug)
    ?? FRESH_BLOG_POSTS.find(post => post.slug === slug)
    ?? [OCTOBER9_EVERGREEN_POST, OCTOBER9_RESEARCH_POST].find(post => post.slug === slug);
}
