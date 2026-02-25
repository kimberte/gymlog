// app/privacy/page.tsx
export default function PrivacyPolicyPage() {
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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Privacy Policy</h1>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>Effective date: {effectiveDate}</div>

        <div style={{ marginTop: 12, display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              opacity: 0.9,
              fontSize: 13,
            }}
          >
            ← Back to calendar
          </a>

          <a
            href="/terms"
            style={{
              color: "var(--text)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              opacity: 0.9,
              fontSize: 13,
            }}
          >
            Terms of Service
          </a>
        </div>
      </header>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Overview</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          This Privacy Policy explains how Gym Log (“we”, “us”, “our”) collects, uses, stores, and shares information when you
          use our app (the “Service”). By using Gym Log, you agree to the practices described below.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Local-first by default</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Gym Log is designed to work without an account for core functionality. Your workouts are stored locally on your device
          using your browser’s local storage. If you clear your browser storage, your locally-stored workouts may be removed.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>What information we collect</h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>
            <strong>Workout data you enter</strong> (e.g., workout title, exercises, sets, reps, weight, PR/PB flags, and notes).
          </li>
          <li>
            <strong>Media you upload</strong> (photos/videos attached to workouts or entries) when you choose to add media.
          </li>
          <li>
            <strong>Account information</strong> (such as your email address) if you sign in.
          </li>
          <li>
            <strong>Community data</strong> (such as friends, friend requests, and shared workout snapshots) when you use the
            Community features.
          </li>
          <li>
            <strong>Subscription status</strong> (e.g., whether Pro is active/trialing) when you subscribe.
          </li>
          <li>
            <strong>Basic app and usage data</strong> (e.g., timestamps related to backups, diagnostics, and analytics events)
            required to operate and improve the Service.
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Cloud backup and restore (on our servers)</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you sign in and enable/benefit from cloud features, Gym Log may back up your workout calendar to our servers so you
          can restore it later. We may keep only a limited number of backups per user (for example, a single “latest” backup).
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Media storage</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you upload photos/videos, the media files are stored on our servers to make them available across devices and for
          sharing features you enable. You control whether you attach media and whether you share workouts to your friends.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>How we use your information</h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>To operate the Service and provide core workout logging functionality.</li>
          <li>To provide cloud backup and restore features (when available/enabled).</li>
          <li>To store and deliver media you upload (photos/videos) and support sharing you enable.</li>
          <li>To provide Community features (friends, requests, and friend-only feed of shared workouts).</li>
          <li>To manage subscriptions and entitlements (Lite vs Pro).</li>
          <li>To communicate with you about your account, the Service, and updates.</li>
          <li>To enforce our terms and protect the Service from abuse.</li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Analytics</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We may use analytics tools (for example, Google Analytics) to understand how the Service is used and to improve
          performance and features. Analytics may collect information such as page views, events, and device/browser details.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Payments</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you purchase Pro, payments are processed by third-party payment processors (such as Stripe). We do not store your
          full payment card details; however, we may store subscription status and related identifiers needed to provide access
          to Pro features.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Marketing and promotional messaging</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you sign up with an email address, we may use your contact email to send service-related messages and/or
          promotional messaging about Gym Log. You can unsubscribe from promotional emails at any time using the unsubscribe
          link in the email (where provided) or by contacting us.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Server-stored data and media rights</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          When you upload content to our servers (including photos/videos), you grant us the rights needed to host, store,
          reproduce, and display that content to operate, maintain, secure, and improve the Service (including backup/restore
          and sharing features you enable). You understand and agree that content stored on our servers may be retained and
          managed by us as part of operating the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Access, export, and deletion</h2>
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
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Third parties</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We use third-party service providers to help run the Service. For example, we may use Supabase for authentication and
          database/storage infrastructure, Stripe for payments, and analytics providers for product insights. These providers
          process data on our behalf to provide the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Security</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We take reasonable measures to protect your information. However, no method of transmission or storage is 100%
          secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Changes to this policy</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We may update this Privacy Policy from time to time. If we make changes, we will update the effective date above.
        </p>
      </section>

      <section style={{ marginTop: 18, marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Contact</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you have questions about this Privacy Policy, contact us at:
          <br />
          <strong>info@gymlogapp.com</strong>
        </p>
      </section>

      <footer style={{ marginBottom: 18, opacity: 0.85, fontSize: 13 }}>
        <a
          href="/terms"
          style={{
            color: "var(--text)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            marginRight: 14,
          }}
        >
          Terms of Service
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
