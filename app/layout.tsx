import "./globals.css";
import "./light-theme.css";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import Analytics from "./components/Analytics";
import ExerciseLibraryModal from "./components/ExerciseLibraryModal";
import ThemeControl from "./components/ThemeControl";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://gymlogapp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Gym Log – Workout Calendar & Gym Tracker",
    template: "%s | Gym Log",
  },
  description:
    "A simple, fast workout calendar to log workouts, import free workout templates, track progress, and back up your training.",
  applicationName: "Gym Log",
  keywords: [
    "workout log",
    "gym log",
    "workout calendar",
    "gym tracker",
    "strength training",
    "fitness journal",
    "PWA workout tracker",
    "workout templates",
    "push pull legs workout",
    "5x5 workout",
    "upper lower split",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Gym Log",
    title: "Gym Log – Workout Calendar & Gym Tracker",
    description: "Log workouts on a calendar, import free workout templates, track progress, and back up your training.",
  },
  twitter: {
    card: "summary",
    title: "Gym Log – Workout Calendar & Gym Tracker",
    description: "Log workouts on a calendar, import free workout templates, track progress, and back up your training.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f5f7fa" };

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-ZH7HXDVP1X";

  return (
    <html lang="en">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('gym-log-theme')==='dark'?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}`}
        </Script>
        <Script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3165991934235457" crossOrigin="anonymous" />
        {GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){window.dataLayer.push(arguments)};window.gtag=window.gtag||gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
            </Script>
          </>
        ) : null}
      </head>
      <body className={poppins.className}>
        {children}
        <ExerciseLibraryModal />
        <ThemeControl />
        <Suspense fallback={null}><Analytics /></Suspense>
      </body>
    </html>
  );
}
