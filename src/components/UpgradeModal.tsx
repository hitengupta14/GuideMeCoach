'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: 'planner' | 'chat' | 'insights' | 'edits'
  title?: string
  message?: string
}

const FEATURE_MESSAGES = {
  planner: {
    title: 'Unlock AI Workout Planner',
    message:
      'Create personalized workout plans tailored to your goals, experience level, and equipment.',
  },
  chat: {
    title: 'Unlock AI Chat Support',
    message:
      'Get instant answers about exercise form, alternatives, and fitness guidance.',
  },
  insights: {
    title: 'Unlock AI Weekly Insights',
    message: 'Receive personalized progress reports and actionable recommendations every week.',
  },
  edits: {
    title: 'Unlock AI Plan Edits',
    message:
      'Modify your workout plans with AI assistance based on your progress and feedback.',
  },
}

export default function UpgradeModal({
  isOpen,
  onClose,
  feature,
  title,
  message,
}: UpgradeModalProps) {
  if (!isOpen) return null

  const featureInfo = FEATURE_MESSAGES[feature]
  const displayTitle = title || featureInfo.title
  const displayMessage = message || featureInfo.message

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Close Button */}
        <div className="flex justify-end p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="mb-4 flex justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
              <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Title & Message */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {displayTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">{displayMessage}</p>

          {/* Premium Benefits */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="font-semibold text-gray-900 dark:text-white mb-3">With Premium:</p>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>✓ AI Workout Planner (2/month)</li>
              <li>✓ AI Chat Support (25 messages/month)</li>
              <li>✓ Weekly AI Insights</li>
              <li>✓ Plan Edits (3/month)</li>
            </ul>
          </div>

          {/* Pricing */}
          <div className="mb-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">Starting at</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹299<span className="text-lg text-gray-600 dark:text-gray-400">/month</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              7 days free trial • Cancel anytime
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              onClick={onClose}
              className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Upgrade to Premium
            </Link>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Continue as Free User
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>💳 Secure payment • 🔒 Privacy protected • ✅ 30-day money-back guarantee</p>
          </div>
        </div>
      </div>
    </div>
  )
}
