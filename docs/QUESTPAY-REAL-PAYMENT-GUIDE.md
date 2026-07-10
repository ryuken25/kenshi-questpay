# QuestPay Real Payment Guide

## Prerequisites
- Receiver address confirmed: `0xA111a8C806b1FAc9D27650455344F5C2f144a743` (owner-controlled)
- Production deployed: https://kenshi-questpay.vercel.app
- Supabase + SMTP configured and verified via `/api/health`

## Owner Steps

1. Open https://kenshi-questpay.vercel.app/services/micro-review
2. Click "Order this service"
3. Fill the brief form:
   - Name/handle
   - Email (owner can read)
   - Contact method
   - Brief description
4. Submit → redirects to `/pay/<public-order-id>`
5. On the pay page, select **USDT — Polygon**
6. From Wallet A (buyer), send exactly **1 USDT** to the displayed Wallet B address on Polygon
7. Keep enough POL in Wallet A for gas
8. Paste the Polygon transaction hash into the verification field
9. Click verify → redirect to `/orders/<public-order-id>/success`
10. Open `/verify/<tx-hash>` to confirm public payment proof
11. Check Supabase for: one order row + one unique payment + order events
12. Confirm creator and client emails arrived

## Important
- Never send to any address other than the one displayed on `/pay/<order>`
- The displayed address should match: `0xA111a8C806b1FAc9D27650455344F5C2f144a743`
- Both wallets may belong to the owner for technical verification
- Document as "owner-executed real Polygon mainnet payment"
