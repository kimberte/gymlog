import "./globals.css";
import { Poppins } from "next/font/google";
import Script from "next/script";
import Analytics from "./components/Analytics";

export const metadata = {
  title: "Gym Log",
};
export const viewport = { themeColor: "#1f2937" };

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
        <Analytics />
      </body>
    </html>
  );
}
