import type { Metadata } from "next";
import SubscribeClient from "./SubscribeClient";

export const metadata: Metadata = {
  title: "Gym Log Pro — Cloud Backup, CSV Tools & Workout Media",
  description:
    "Upgrade to Gym Log Pro for automatic cloud backups, one‑tap restore, CSV import/export, and workout media. This page also shows your current subscription status.",
  alternates: {
    canonical: "/subscribe",
  },
  openGraph: {
    title: "Gym Log Pro — Upgrade Your Workout Notebook",
    description:
      "Get cloud backups, restore, CSV tools, and workout media. View your subscription status and start a 7‑day trial.",
    type: "website",
    url: "/subscribe",
  },
  twitter: {
    card: "summary",
    title: "Gym Log Pro",
    description:
      "Unlock cloud backups, CSV tools, and workout media. View subscription status and upgrade.",
  },
};

export default function SubscribePage() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Gym Log Pro",
    description: "Subscription upgrade for Gym Log with cloud backups, CSV tools, and workout media.",
    brand: { "@type": "Brand", name: "Gym Log" },
    offers: [
      {
        "@type": "Offer",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        category: "SoftwareApplication",
      },
    ],
  };

  return (
    <main style={{ padding: 18, maxWidth: 980, margin: "0 auto", lineHeight: 1.65 }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.3 }}>
          Gym Log Pro
        </h1>
        <p style={{ margin: "8px 0 0", opacity: 0.88, maxWidth: 760 }}>
          The easiest way to keep your workout notebook safe: <b>cloud backups</b>, one‑tap restore, <b>CSV</b> tools,
          and workout <b>media</b>. This page is also your subscription status page.
        </p>
      </header>

      <div className="subscribe-grid" style={{ alignItems: "start" }}>
        <section
          aria-label="Pro highlights"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 18,
            padding: 16,
            background: "rgba(0,0,0,0.10)",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>What you get with Pro</h2>
          <div className="subscribe-features" style={{ marginTop: 10 }}>
            {[
              {
                t: "Automatic cloud backups",
                d: "Keep your calendar safe across devices — no spreadsheets needed.",
                i: "☁️",
              },
              {
                t: "One‑tap restore",
                d: "Recover your workouts anytime (new phone, new browser, or reinstall).",
                i: "🛟",
              },
              {
                t: "CSV import / export",
                d: "Move your data in and out easily — perfect for power users.",
                i: "📄",
              },
              {
                t: "Workout media",
                d: "Attach photos to workouts and keep a visual training log.",
                i: "📷",
              },
            ].map((c) => (
              <div
                key={c.t}
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 16,
                  padding: 12,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    aria-hidden
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      fontSize: 18,
                    }}
                  >
                    {c.i}
                  </div>
                  <div>
                    <div style={{ fontWeight: 750 }}>{c.t}</div>
                    <div style={{ opacity: 0.82, fontSize: 13, lineHeight: 1.5 }}>{c.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              borderRadius: 16,
              padding: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "linear-gradient(180deg, rgba(255,87,33,0.12), rgba(0,0,0,0.06))",
            }}
          >
            <div style={{ fontWeight: 750 }}>Built for real‑world training</div>
            <div style={{ opacity: 0.86, fontSize: 13, marginTop: 6 }}>
              Log offline. Keep everything fast. Upgrade only when you want cloud convenience and power tools.
            </div>
          </div>
        </section>

        <div>
          <SubscribeClient />
        </div>
      </div>

      <section style={{ marginTop: 14 }} aria-label="FAQ">
        <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>FAQ</h2>
        <div className="subscribe-faq">
          {[
            {
              q: "Do I lose my workouts if I don’t subscribe?",
              a: "No. Lite keeps unlimited local logging. Pro adds cloud backup/restore, CSV tools, and media.",
            },
            {
              q: "When does the 7‑day trial start?",
              a: "Your trial starts on your first sign‑in. Your exact trial end date shows above in your status card.",
            },
            {
              q: "How does restore work?",
              a: "Once Pro is active, you can restore your latest cloud backup from Settings in the app.",
            },
            {
              q: "What if my Pro status doesn’t update right away?",
              a: "Stripe webhooks can take a moment. Refresh this page or reopen Settings to re-check your status.",
            },
          ].map((f) => (
            <div
              key={f.q}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 16,
                padding: 12,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{f.q}</div>
              <div style={{ opacity: 0.82, fontSize: 13, marginTop: 6 }}>{f.a}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 12, opacity: 0.75, fontSize: 12 }}>
          Looking for policies? See <a href="/privacy" style={{ textDecoration: "underline" }}>Privacy Policy</a> and{" "}
          <a href="/terms" style={{ textDecoration: "underline" }}>Terms</a>.
        </p>
      </section>
    </main>
  );
}
