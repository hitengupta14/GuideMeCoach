# 🎯 Regional Pricing — Quick Reference

## At a Glance

**Status**: ✅ Production Ready  
**Migration**: ✅ Applied (0008_add_pricing_fields)  
**Compilation**: ✅ No blocking errors in pricing files  

---

## Pricing Tiers

| Tier          | Monthly | Yearly  | Currency |
|---------------|---------|---------|----------|
| India         | ₹299    | ₹3,588  | INR      |
| International | ₹415    | ₹4,980  | INR      |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/pricing.ts` | Pricing decision logic |
| `src/lib/razorpay.ts` | Order creation (with pricing) |
| `src/app/api/v1/subscription/create/route.ts` | Order endpoint |
| `src/app/api/webhooks/razorpay/route.ts` | Payment webhook |
| `src/components/PricingRegionSelector.tsx` | Frontend selector |
| `PRICING_RULES.md` | Business rules |
| `REGIONAL_PRICING_COMPLETE.md` | Full implementation guide |
| `PRICING_INTEGRATION_GUIDE.md` | Frontend integration |

---

## How Pricing Works

1. **User selects region** (display-only)
2. **User clicks "Pay"**
3. **Backend decides final price** based on:
   - Locked `pricing_tier` (if user paid before)
   - Or `billing_country` (if set)
   - Or default to 'international'
4. **Order created** with server-decided amount
5. **Payment completes** → Tier locked
6. **Email sent** with transparent pricing reason

---

## API Usage

### Create Order
```bash
POST /api/v1/subscription/create
Authorization: Bearer {token}

{
  "planType": "premium",
  "displayRegion": "india"  // optional, analytics only
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz",
    "amount": 29900,
    "currency": "INR",
    "pricing": {
      "tier": "india",
      "reason": "India pricing applied based on your payment method."
    }
  }
}
```

---

## Database Schema

### Users Table
- `billing_country`: TEXT (e.g., 'IN', 'US')
- `pricing_tier`: ENUM ('india' | 'international')

### Payments Table
- `detected_country`: TEXT
- `charged_currency`: VARCHAR(3)
- `charged_amount`: DECIMAL(10,2)

---

## Frontend Integration

```tsx
import { PricingRegionSelector } from '@/components/PricingRegionSelector'

const [selectedRegion, setSelectedRegion] = useState<'india' | 'international'>('india')

<PricingRegionSelector
  defaultRegion="india"
  onRegionChange={setSelectedRegion}
/>
```

---

## Testing

### Test Order Creation
```bash
curl -X POST http://localhost:3000/api/v1/subscription/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planType":"premium","displayRegion":"india"}'
```

### Check User Tier
```sql
SELECT email, billing_country, pricing_tier FROM users WHERE email = 'user@example.com';
```

### View Payment Logs
```sql
SELECT detected_country, charged_currency, charged_amount FROM payments ORDER BY created_at DESC LIMIT 10;
```

---

## Deployment Checklist

- [x] Migration applied
- [ ] Code pushed to production
- [ ] Razorpay webhook configured: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Test with Indian card (verify ₹299)
- [ ] Test with international card (verify ₹415)
- [ ] Verify confirmation emails

---

## Support Scenarios

### User asks: "Why was I charged $5 instead of ₹299?"
**Answer**: "Pricing is based on your card issuing country. Your card was issued internationally, so international pricing (₹415 / ~$5) was applied."

### User wants to change tier
**Action**: Cannot change after first payment. Tier is locked based on card country for consistency.

### Need to manually override tier
```sql
UPDATE users SET pricing_tier = 'india', billing_country = 'IN' WHERE email = 'user@example.com';
```

---

## Monitoring Queries

### Tier distribution
```sql
SELECT pricing_tier, COUNT(*) FROM users WHERE pricing_tier IS NOT NULL GROUP BY pricing_tier;
```

### Mismatch attempts
```sql
SELECT COUNT(*) FROM payments WHERE (metadata->>'pricingMismatchAttempt')::boolean = true;
```

### Revenue by tier
```sql
SELECT 
  u.pricing_tier,
  COUNT(*) as payments,
  SUM(p.charged_amount) as total_revenue
FROM payments p
JOIN users u ON p.user_id = u.id
GROUP BY u.pricing_tier;
```

---

## Emergency Actions

### Reset all pricing (dev/test only)
```sql
UPDATE users SET pricing_tier = NULL, billing_country = NULL WHERE email LIKE '%@test.com';
```

### Force India pricing for user
```sql
UPDATE users SET pricing_tier = 'india', billing_country = 'IN' WHERE email = 'user@example.com';
```

---

**✅ Ready to Deploy**
