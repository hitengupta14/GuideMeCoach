const LAST_UPDATED = '2026-02-04'

export default function PrivacyPage() {
  const lastUpdated = LAST_UPDATED

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
          <p>
            This Privacy Policy describes how GuideMeCoach collects, uses, and
            shares information. This page is a starter template and should be
            reviewed by qualified legal counsel before production use.
          </p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              Account data (email, name), fitness profile data (goals, experience,
              equipment), and health-related inputs you choose to provide
              (medical conditions, pain areas).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p>
              To provide the service, personalize training guidance, operate
              subscriptions, prevent abuse, and improve product quality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Sharing</h2>
            <p>
              We may share data with service providers (payments, email, error
              monitoring) only as needed to operate the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Security</h2>
            <p>
              We use reasonable security measures. No method of transmission or
              storage is 100% secure.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">5. Your Choices</h2>
            <p>
              You can request export or deletion of your account data from within
              the app settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
