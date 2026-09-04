"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { event, pageview } from "../lib/gtag";

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    pageview(window.location.origin + pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;
      const button = target?.closest("button") as HTMLButtonElement | null;

      if (link?.matches(".program-cta-button")) {
        event("program_import_click", { program_slug: pathname.split("/").filter(Boolean).pop() || "unknown" });
        return;
      }
      if (button?.matches(".program-download-button")) {
        event("program_download_click", { program_slug: pathname.split("/").filter(Boolean).pop() || "unknown" });
        return;
      }
      if (button?.matches(".finder-submit")) {
        event("workout_finder_submit");
        return;
      }
      if (link?.matches(".finder-result")) {
        event("workout_finder_result_click", { program_slug: link.getAttribute("href")?.split("/").pop() || "unknown" });
        return;
      }
      if (link?.matches(".program-pro-upsell")) {
        event("pro_upsell_click", { source: pathname });
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith("/workout-programs/")) return;
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length !== 2 || parts[0] !== "workout-programs") return;
    event("program_view", { program_slug: parts[1] });
  }, [pathname]);

  return null;
}
