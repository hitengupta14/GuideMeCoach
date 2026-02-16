import Link from 'next/link'

export const metadata = {
  title: 'Email Verified - GuideMeCoach',
  description: 'Email verification status',
}

export default function VerifiedPage({
  searchParams,
}: {
  searchParams: { success?: string; reason?: string }
}) {
  const success = searchParams.success === 'true'
  const reason = searchParams.reason

  const title = success ? 'Email verified' : 'Verification failed'
  const message = success
    ? 'Your email is verified. You can log in now.'
    : reason === 'expired'
      ? 'This verification link has expired. Please request a new one.'
      : reason === 'invalid'
        ? 'This verification link is invalid. Please request a new one.'
        : 'We could not verify your email. Please request a new verification link.'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">{success ? '' : ''}</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{title}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        {success ? (
          <Link
            href="/auth/login?verify=1"
            className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
          >
            Go to Login
          </Link>
        ) : (
          <div className="space-y-3">
            <Link
              href="/auth/resend-verification"
              className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Resend Verification Email
            </Link>
            <Link
              href="/auth/login"
              className="w-full inline-flex items-center justify-center bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

