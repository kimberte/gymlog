/* eslint-disable @typescript-eslint/no-explicit-any */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-ZH7HXDVP1X";

type GtagEventParams = Record<string, any>;

export function pageview(url: string) {
  if (typeof window === "undefined") return;
  if (!GA_ID) return;
  const gtag = (window as any).gtag as undefined | ((...args: any[]) => void);
  if (!gtag) return;
  gtag("event", "page_view", { page_location: url });
}

export function event(action: string, params: GtagEventParams = {}) {
  if (typeof window === "undefined") return;
  if (!GA_ID) return;
  const gtag = (window as any).gtag as undefined | ((...args: any[]) => void);
  if (!gtag) return;
  gtag("event", action, params);
}
