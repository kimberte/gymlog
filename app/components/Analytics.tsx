"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { event, pageview } from "../lib/gtag";
import { incrementProgramStat } from "../lib/programStats";

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
        const slug = pathname.split("/").filter(Boolean).pop() || "unknown";
        event("program_download_click", { program_slug: slug });
        if (pathname.startsWith("/workout-programs/") && pathname.split("/").filter(Boolean).length === 2) {
          void incrementProgramStat(slug, "downloads");
        }
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
    const slug = parts[1];
    event("program_view", { program_slug: slug });
    void incrementProgramStat(slug, "views");
  }, [pathname]);

  return null;
}
