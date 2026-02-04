"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useSession } from "@/hooks/useSession";
import { useAPIError } from "@/hooks/useAPIError";
import { apiWrapper } from "@/lib/api-wrapper";
import { PricingRegionSelector } from "@/components/PricingRegionSelector";

// Add Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = {
  premium: {
    name: "Premium",
    priceIndia: 299,
    priceInternational: 5,
    currencyIndia: "₹",
    currencyInternational: "$",
    period: "month",
    apiPlanType: "pro",
    features: [
      "All Free features",
      "AI Workout Planner (2/month)",
      "AI Chat Support (25 messages/month)",
      "AI Weekly Insights (1/week)",
      "AI Plan Edits (3/month)",
      "Priority support",
      "Ad-free experience",
    ],
  },
  "premium-yearly": {
    name: "Premium Yearly",
    priceIndia: 2499,
    priceInternational: 49,
    currencyIndia: "₹",
    currencyInternational: "$",
    period: "year",
    apiPlanType: "pro_yearly",
    features: [
      "All Premium features",
      "All AI features",
      "Priority support",
      "Early access to new features",
      "Save 16% vs monthly",
    ],
  },
};

export default function SubscribePage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: isSessionLoading } = useSession({ required: true });
  const { handleError, handleSuccess, handleLoading, dismissToast } = useAPIError();

  const planParam = Array.isArray((params as any).plan) ? (params as any).plan?.[0] : (params as any).plan;
  const planKey = (planParam || "premium") as keyof typeof PLANS;
  const plan = PLANS[planKey] || PLANS.premium;

  const [selectedRegion, setSelectedRegion] = useState<
    "india" | "international"
  >("india");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!user?.id) return;

    const toastId = handleLoading("Creating payment order...");
    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Create Razorpay order
      const { data: orderData, error: orderError } = await apiWrapper.post<any>(
        "/api/v1/subscription/create",
        {
          displayRegion: selectedRegion,
          planType: planKey,
        }
      );

      dismissToast(toastId);

      if (orderError) {
        await handleError(orderError);
        setIsProcessing(false);
        return;
      }

      const data = orderData;

      // Step 2: Open Razorpay checkout
      if (typeof window !== "undefined" && window.Razorpay) {
        const options = {
          key: data.data.keyId,
          amount: data.data.amount,
          currency: data.data.currency,
          name: "GuideMeCoach",
          description: data.data.plan.name,
          order_id: data.data.orderId,
          prefill: {
            name: data.data.userDetails.name,
            email: data.data.userDetails.email,
          },
          theme: {
            color: "#3b82f6", // blue-600
          },
          handler: async function (response: any) {
            // Payment successful - verify on backend
            const verifyToastId = handleLoading("Verifying payment...");
            
            const { data: verifyData, error: verifyError } = await apiWrapper.post<any>(
              "/api/v1/subscription/verify",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planType: planKey,
              }
            );

            dismissToast(verifyToastId);

              if (verifyError) {
                await handleError(verifyError);
                setIsProcessing(false);
                return;
              }

              // Webhook is the canonical source of truth; verification just confirms signature.
              // Poll subscription status briefly so the user doesn't land on Pricing before activation.
              const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
              const waitForPremium = async (timeoutMs = 20000) => {
                const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                  try {
                    const res = await fetch("/api/user/subscription/status", {
                      credentials: "include",
                    });
                    if (res.ok) {
                      const json = await res.json();
                      if (json?.data?.isPremium) return true;
                    }
                  } catch {
                    // ignore transient errors while waiting
                  }
                  await sleep(1500);
                }
                return false;
              };

              handleSuccess("Payment verified. Activating your subscription...");
              setSuccess(true);

              const activated = await waitForPremium();
              if (activated) {
                handleSuccess("Subscription activated! You're now premium.");
              }

              router.push("/pricing?from=payment");
            },
            modal: {
              ondismiss: function () {
                setIsProcessing(false);
                setError("Payment cancelled");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
          setError(`Payment failed: ${response.error.description}`);
          setIsProcessing(false);
        });
        razorpay.open();
      } else {
        throw new Error("Razorpay SDK not loaded");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsProcessing(false);
    }
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Upgrade to {plan.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get access to premium AI features
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200">
              ✓ Subscription successful! Redirecting to dashboard...
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Regional Pricing Selector */}
        <div className="mb-8">
          <PricingRegionSelector
            defaultRegion="india"
            onRegionChange={setSelectedRegion}
          />
        </div>

        {/* Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {plan.name}
            </h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-bold text-gray-900 dark:text-white">
                {selectedRegion === "india"
                  ? plan.currencyIndia
                  : plan.currencyInternational}
                {selectedRegion === "india"
                  ? plan.priceIndia
                  : plan.priceInternational}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                per {plan.period}
              </span>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-8 space-y-3">
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
              Includes:
            </p>
            {plan.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
          >
            {isProcessing ? "Processing..." : "Subscribe Now"}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            7-day free trial, then billed monthly. Cancel anytime.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription anytime from your account
                settings. Your access will continue until the end of your
                billing period.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You get a 7-day free trial. After that, you'll be charged
                monthly unless you cancel.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                We accept all major credit and debit cards through secure
                payment processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Load Razorpay SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
