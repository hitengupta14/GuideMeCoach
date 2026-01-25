# Regional Pricing Rules (Authoritative)

## Rule 1: Pricing Authority
- Final price is determined by billing country from the payment method (card issuing country / gateway metadata), not by UI selection.
- Backend decides currency and amount; frontend display is informational only.

## Rule 2: Manual Region Selection (Display Only)
- Users can manually switch displayed region on the pricing page for transparency.
- This selection affects UI only and never the final amount charged.

## Rule 3: Transparency
- Users are clearly informed why a specific price was applied.
- If card country != selected region, show a friendly message: "International pricing has been applied based on your payment method."

## Pricing Tiers
- India tier: ₹299 / month (INR)
- International tier: $5 / €5 / month (USD or EUR depending on country)

## Enforcement Flow
1. Frontend shows detected region and allows manual change (UI only).
2. User clicks Pay → Backend creates order with server-decided currency/amount.
3. Payment completes → Webhook verifies billing country and currency; tier is stored.
4. Confirmation email shows price, currency, and reason.
5. On renewals, prior tier applies unless card/payment method changes.

## Data & Audit
- Store on user: `billing_country`, `pricing_tier`.
- Log per payment attempt: `detected_country`, `charged_currency`, `charged_amount`, `pricing_mismatch_attempt`.

## Do Not
- Do not hard-lock region selection.
- Do not switch prices silently.
- Do not block VPN users.
- Do not argue with users; apply rules and be transparent.
