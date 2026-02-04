export const dynamic = 'force-dynamic'

export default function MedicalDisclaimerPage() {
  const lastUpdated = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Medical Disclaimer
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-6 text-gray-800 dark:text-gray-200 leading-relaxed">
          <p>
            GuideMeCoach provides general fitness information and does not
            provide medical advice. Always consult a qualified healthcare
            professional before starting any new exercise program, especially if
            you have a medical condition or injury.
          </p>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Red Flags</h2>
            <p>
              Stop exercising and seek medical help if you experience chest pain,
              dizziness, shortness of breath, numbness, severe pain, or any
              concerning symptoms.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Personal Responsibility</h2>
            <p>
              You are responsible for your own health decisions and for using
              safe technique, appropriate loads, and proper supervision when
              needed.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

