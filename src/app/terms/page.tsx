const LAST_UPDATED = '2026-02-04'

export default function TermsPage() {
  const lastUpdated = LAST_UPDATED

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
          <p>
            These Terms govern your use of GuideMeCoach. This page is a starter
            template and should be reviewed by qualified legal counsel before
            production use.
          </p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">1. Use of Service</h2>
            <p>
              You agree to use the service lawfully and not to abuse, reverse
              engineer, or disrupt the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">2. Subscriptions</h2>
            <p>
              Paid plans provide premium access subject to billing and renewal
              terms displayed at checkout.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">3. Disclaimer</h2>
            <p>
              The service provides general fitness information and is not a
              substitute for professional medical advice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">4. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GuideMeCoach is not liable
              for indirect or consequential damages arising from use of the
              service.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
