# QuestPay Email Flows

## SMTP Configuration
- Server-only module: `src/lib/email.ts`
- Uses nodemailer with configured SMTP env vars
- Never exposes credentials in responses

## Email Types

### Order Created — Creator
- Subject: `New QuestPay brief — <package> — <public_id>`
- Contains: client handle, complete brief, expected payment, studio link

### Order Created — Client
- Subject: `QuestPay order created — payment pending`
- Contains: public order ID, package, network/token/amount, pay link, privacy note

### Payment Verified — Creator
- Subject: `Payment confirmed`
- Contains: tx hash, amount/token, buyer wallet, Polygonscan link, order link

### Payment Verified — Client
- Subject: `Payment verified`
- Contains: verified receipt, tx hash + explorer, public verification link, order status

### Status Updates
- Client emails for: `accepted`, `in_progress`, `delivered`, `completed`

## Failure Handling
- Paid order persisted before SMTP attempt
- SMTP failure does not undo valid payment
- Failure logged to `email_events` table
- Unique logical key: `order_id + email_type + recipient` prevents duplicates
