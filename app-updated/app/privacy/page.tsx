// app/privacy/page.tsx
export default function PrivacyPolicyPage() {
  const effectiveDate = "January 4, 2026";

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
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
          Privacy Policy
        </h1>
        <div style={{ marginTop: 6, opacity: 0.8, fontSize: 13 }}>
          Effective date: {effectiveDate}
        </div>

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
          This Privacy Policy explains how Gym Log (“we”, “us”, “our”) collects,
          uses, stores, and shares information when you use our app (the
          “Service”). By using Gym Log and/or creating an account, you agree to
          the practices described below.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          What information we collect
        </h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>
            <strong>Workout data you enter</strong> (e.g., workout title and
            notes).
          </li>
          <li>
            <strong>Account information</strong> (your email address) if you sign
            in.
          </li>
          <li>
            <strong>Basic app data</strong> (e.g., timestamps related to backups,
            and minimal technical information required to operate the Service).
          </li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Local-first storage (on your device)
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Gym Log is designed to work without an account for core functionality.
          Your workouts are stored locally on your device using your browser’s
          local storage. If you clear your browser storage, your locally-stored
          workouts may be removed.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Cloud backup (on our servers)
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you sign in, Gym Log may automatically back up your workout calendar
          to our server so you can restore it later. At this time, we keep only a
          single “latest” backup per user (i.e., we overwrite the previous backup
          with the most recent backup).
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          How we use your information
        </h2>
        <ul style={{ marginTop: 0, opacity: 0.95 }}>
          <li>To operate and improve the Service.</li>
          <li>To provide cloud backup and restore features (when enabled).</li>
          <li>
            To communicate with you about your account, the Service, and updates.
          </li>
          <li>To enforce our terms and protect the Service from abuse.</li>
        </ul>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Marketing and promotional messaging
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          If you sign up with an email address, we may use your contact email to
          send relevant information and/or promotional messaging about Gym Log.
          By using the app and signing up, you consent to receiving marketing
          communications from us. You can unsubscribe from promotional emails at
          any time using the unsubscribe link in the email (where provided) or
          by contacting us.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Data ownership and rights while stored on our servers
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          Your workout entries may be stored on our servers when cloud backup is
          enabled. While your data is stored on our servers, we own rights to the
          data for the purpose of operating, maintaining, securing, and improving
          the Service, including providing backup and restore functionality.
        </p>
    
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Deleting your account and data
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          You can delete your account and server-stored backup at any time from
          within the app (Settings → “Delete account &amp; server data”). Deleting
          your account removes your server-stored backup and associated account
          data we maintain for the Service. You may also need to clear your local
          browser storage to remove workouts stored on your device.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Third parties</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We use third-party service providers to help run the Service. For
          example, we may use Supabase for authentication and database/storage
          infrastructure. These providers process data on our behalf to provide
          the Service.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>Security</h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We take reasonable measures to protect your information. However, no
          method of transmission or storage is 100% secure, and we cannot
          guarantee absolute security.
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, margin: "18px 0 8px" }}>
          Changes to this policy
        </h2>
        <p style={{ margin: 0, opacity: 0.95 }}>
          We may update this Privacy Policy from time to time. If we make
          changes, we will update the effective date above.
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
