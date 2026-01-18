import React from 'react'
import { Sparkles, Brain, Zap, Apple, TrendingUp, MessageSquare } from 'lucide-react'

export default function AIFeaturesHub() {
  const features = [
    {
      id: 'progress-insights',
      title: 'Progress Insights & Analytics',
      phase: '3',
      icon: TrendingUp,
      color: 'from-indigo-600 to-blue-600',
      description: 'AI analyzes your workout history and provides personalized insights',
      capabilities: [
        'Weekly performance summaries',
        'Strength & weakness analysis',
        'Plateau prediction',
        'Trend detection',
        'Email summaries',
        'Recovery recommendations',
      ],
      route: '/ai-insights',
    },
    {
      id: 'exercise-recommendations',
      title: 'Smart Exercise Recommendations',
      phase: '4',
      icon: Zap,
      color: 'from-yellow-600 to-orange-600',
      description: 'AI suggests next exercises based on your workout context',
      capabilities: [
        'Real-time "What next?" suggestions',
        'Muscle balance detection',
        'Equipment-based alternatives',
        'Progressive overload guidance',
        'Exercise variety optimization',
        'Performance-based modifications',
      ],
      route: '/workouts',
    },
    {
      id: 'form-feedback',
      title: 'Form Feedback Assistant',
      phase: '5',
      icon: MessageSquare,
      color: 'from-pink-600 to-rose-600',
      description: 'Get detailed form corrections from an AI coaching expert',
      capabilities: [
        'Text-based form analysis',
        'Diagnostic questions',
        'Specific form corrections',
        'Common mistake detection',
        'Injury risk warnings',
        'Live coaching conversation',
        'Progression suggestions',
      ],
      route: '/form-feedback',
    },
    {
      id: 'nutrition-guidance',
      title: 'Nutrition Guidance',
      phase: '6',
      icon: Apple,
      color: 'from-green-600 to-emerald-600',
      description: 'Personalized nutrition strategy aligned with your fitness goals',
      capabilities: [
        'TDEE estimation',
        'Macro recommendations',
        'Meal timing strategies',
        'Supplement guidance',
        'Hydration recommendations',
        'Goal-specific nutrition',
        'Evidence-based advice',
      ],
      route: '/nutrition',
    },
    {
      id: 'adaptive-workouts',
      title: 'Adaptive Workout Coaching',
      phase: '7',
      icon: Brain,
      color: 'from-purple-600 to-violet-600',
      description: 'AI automatically adjusts your training based on performance & recovery',
      capabilities: [
        'Auto-adjusted volume & intensity',
        'Deload week recommendations',
        'Recovery-based adjustments',
        'Performance tracking',
        'Fatigue monitoring',
        'Exercise substitutions',
        'Motivational feedback',
      ],
      route: '/progress',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">AI-Powered Features</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Meet Your AI Fitness Coach
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Advanced AI capabilities working together to create your personalized fitness experience
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <a
                key={feature.id}
                href={feature.route}
                className="group h-full"
              >
                <div className="h-full bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all duration-300 cursor-pointer transform hover:scale-105">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`bg-gradient-to-br ${feature.color} rounded-lg p-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                      Phase {feature.phase}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>

                  {/* Capabilities */}
                  <div className="space-y-2 mb-4">
                    {feature.capabilities.slice(0, 3).map((capability, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        {capability}
                      </div>
                    ))}
                    {feature.capabilities.length > 3 && (
                      <div className="text-xs text-indigo-600 font-semibold">
                        +{feature.capabilities.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    Explore Feature
                    <span>→</span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {/* Integration Diagram */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How They Work Together</h2>

          <div className="space-y-6">
            {/* Flow */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="flex-1">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
                  <Zap className="w-8 h-8 mx-auto md:mx-0 mb-3" />
                  <h3 className="font-bold mb-2">Log Workouts</h3>
                  <p className="text-sm">Track exercises, sets, reps, RPE, and recovery</p>
                </div>
              </div>

              <div className="hidden md:block text-3xl text-gray-400 font-light">→</div>

              <div className="flex-1">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
                  <Brain className="w-8 h-8 mx-auto md:mx-0 mb-3" />
                  <h3 className="font-bold mb-2">AI Analysis</h3>
                  <p className="text-sm">System analyzes patterns and performance</p>
                </div>
              </div>

              <div className="hidden md:block text-3xl text-gray-400 font-light">→</div>

              <div className="flex-1">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
                  <Sparkles className="w-8 h-8 mx-auto md:mx-0 mb-3" />
                  <h3 className="font-bold mb-2">Personalized Coaching</h3>
                  <p className="text-sm">Recommendations adapt to your progress</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Real-Time Assistance
                </h4>
                <p className="text-sm text-gray-600">
                  During workouts, AI suggests next exercises and form corrections on-demand
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Progressive Adaptation
                </h4>
                <p className="text-sm text-gray-600">
                  System learns from your performance and continuously optimizes recommendations
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Holistic Approach
                </h4>
                <p className="text-sm text-gray-600">
                  Considers training, nutrition, recovery, and form for complete fitness optimization
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-indigo-600">✓</span> Data-Driven Insights
                </h4>
                <p className="text-sm text-gray-600">
                  All recommendations are based on your personal workout data and science-backed principles
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <span className="text-2xl">✅</span>
            <span className="font-semibold">All Phases Complete</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Your AI Coach is Ready</h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            All 7 AI phases have been implemented and are live. Start using these features today to accelerate your
            fitness progress!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Go to Dashboard
            </a>
            <a
              href="/chat"
              className="px-6 py-3 bg-white text-indigo-600 border border-indigo-300 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Start Chatting
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
