import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth-helpers'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { withApiTelemetry } from '@/lib/api-telemetry'

/**
 * Verify Razorpay payment and activate subscription
 * Called after successful payment on frontend
 */
async function verifyPayment(req: NextRequest) {
  try {
    const userId = await verifySession(req)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType } = await req.json()

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification parameters' },
        { status: 400 }
      )
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // NOTE:
    // Do NOT grant entitlements based on this client-initiated verification call.
    // The canonical source of truth is the Razorpay webhook, which is server-to-server.
    // This endpoint only verifies the signature so the UI can show "processing".
    return NextResponse.json(
      {
        success: true,
        message:
          'Payment verified. Subscription activation is processing (webhook). Please refresh in a few seconds.',
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          planType: planType === 'premium-yearly' ? 'premium-yearly' : 'premium',
        },
      },
      { status: 202 }
    )
  } catch (error: any) {
    console.error('Payment verification error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify payment',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export const POST = withApiTelemetry(verifyPayment, { name: 'v1.subscription.verify' })
