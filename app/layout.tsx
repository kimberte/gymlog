import "./globals.css";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import Analytics from "./components/Analytics";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gymlogapp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gym Log – Workout Calendar & Gym Tracker",
    template: "%s | Gym Log",
  },
  description:
    "A simple, fast workout calendar to log workouts, track progress, and back up your training. Optional Pro unlocks media, sharing, and more.",
  applicationName: "Gym Log",
  keywords: [
    "workout log",
    "gym log",
    "workout calendar",
    "gym tracker",
    "strength training",
    "fitness journal",
    "PWA workout tracker",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Gym Log",
    title: "Gym Log – Workout Calendar & Gym Tracker",
    description:
      "Log workouts on a calendar, track progress, and back up your training. Optional Pro unlocks media, sharing, and more.",
  },
  twitter: {
    card: "summary",
    title: "Gym Log – Workout Calendar & Gym Tracker",
    description:
      "Log workouts on a calendar, track progress, and back up your training. Optional Pro unlocks media, sharing, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = { themeColor: "#1f2937" };

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-ZH7HXDVP1X";

  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = window.gtag || gtag;
                gtag('js', new Date());
                // Disable automatic page_view so we can send it on route changes (Next.js App Router)
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body className={poppins.className}>
        {children}
        {/* Track client-side route changes */}
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
      </body>
    </html>
  );
}
