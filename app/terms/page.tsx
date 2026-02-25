// app/terms/page.tsx
export default function TermsPage() {
  const effectiveDate = "February 25, 2026";

  return (
    <main
      style={{
        padding: 18,
        maxWidth: 880,
        margin: "0 auto",
        lineHeight: 1.65,
      }}
    >
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Terms of Service</h1>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>Effective date: {effectiveDate}</div>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 12,
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            opacity: 0.9,
            fontSize: 13,
          }}
        >
          ← Back to calendar
        </a>
      </header>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Acceptance</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          By accessing or using Gym Log (the “Service”), you agree to be bound by these Terms of Service (“Terms”). If you do
          not agree, do not use the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>The Service</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Gym Log helps you log workouts on a calendar and track your training. Core functionality is available without an
          account. If you sign in, additional features may be available such as cloud backup/restore, community sharing, and
          media attachments.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Accounts and access</h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>You are responsible for maintaining the confidentiality of your account access (including email access used for magic links).</li>
          <li>You agree to provide accurate information and to use the Service only for lawful purposes.</li>
          <li>You may not misuse the Service, attempt to access it using automated means, or interfere with its operation.</li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Local storage and cloud features</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Your workouts may be stored locally in your browser’s local storage. If you sign in, the Service may also store data
          on our servers to support features like backup/restore, media attachments, and community sharing. Server-stored data
          may overwrite prior backups and is provided as a convenience feature.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Community and sharing</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          The Service may allow you to connect with friends and share workout snapshots with them. Sharing is optional and may
          be off by default. You are responsible for what you choose to share and with whom.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Your content, media, and data rights</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          You are responsible for the content you enter or upload, including workout notes and any photos/videos (“Content”).
          When you upload Content to the Service, you grant us the rights needed to host, store, reproduce, modify (for
          formatting/optimization), and display that Content to operate, maintain, secure, and improve the Service (including
          backup/restore and sharing features you enable). You understand and agree that Content stored on our servers may be
          retained and managed by us as part of operating the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Export and deletion</h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>
            <strong>Export:</strong> You can request a copy of your server-stored data (including media) at any time by emailing{' '}
            <strong>info@gymlogapp.com</strong>.
          </li>
          <li>
            <strong>Deletion:</strong> You can delete your account and server-stored data from within the app (Settings → “Delete
            account &amp; server data”). You may also need to clear your local browser storage to remove workouts stored on your
            device.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Subscriptions (Pro)</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Some features may require a paid subscription (“Pro”) and may include a free trial. Subscription purchases and
          renewals are handled by our payment processor (such as Stripe). Your subscription will renew automatically unless you
          cancel. Prices, trial terms, and included features may change over time.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Marketing communications</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you sign up with an email address, you agree we may send you service-related messages and promotional
          communications. You can opt out of promotional emails at any time using the unsubscribe link (where provided) or by
          contacting us.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Pro features and changes</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We may add, remove, or change features at any time, including “Pro” features. We may also impose limits or restrict
          access to parts of the Service as needed for maintenance, security, compliance, or abuse prevention.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Disclaimers</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          The Service is provided “as is” without warranties of any kind. We do not guarantee the Service will be
          uninterrupted, error-free, or that data will never be lost. You are responsible for maintaining your own backups
          (e.g., exporting or saving your workouts).
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Limitation of liability</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special, consequential,
          or punitive damages, or any loss of data, arising from or related to your use of the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Termination</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          You may stop using the Service at any time. If you have an account, you can delete it in Settings. We may suspend or
          terminate access if we believe you are violating these Terms or if needed to protect the Service.
        </p>
      </section>

      <section style={{ marginTop: 18, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Contact</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Questions about these Terms:
          <br />
          <strong>info@gymlogapp.com</strong>
        </p>
      </section>

      <footer style={{ marginBottom: 18, opacity: 0.85, fontSize: 13 }}>
        <a
          href="/privacy"
          style={{
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            marginRight: 14,
          }}
        >
          Privacy Policy
        </a>
        <a
          href="/"
          style={{
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Back to calendar
        </a>
      </footer>
    </main>
  );
}
