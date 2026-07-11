# QuestPay v5 — Google OAuth Setup Guide

## Prerequisites

1. A Google Cloud project with OAuth credentials
2. Supabase project with authentication enabled

## Step 1: Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Navigate to **APIs & Services → OAuth consent screen**
4. Configure branding (app name: QuestPay)
5. Add scopes: `openid`, `email`, `profile`
6. Navigate to **APIs & Services → Credentials**
7. Create **OAuth Client ID** (Web application)
8. Authorized JavaScript origins:
   - `https://kenshi-questpay.vercel.app`
   - `http://localhost:3000`
9. Authorized redirect URI:
   - `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

## Step 2: Supabase Dashboard

1. Go to **Authentication → Sign In / Providers → Google**
2. Set **Google Enabled: ON**
3. Paste Client ID and Client Secret
4. Save

## Step 3: Supabase URL Configuration

1. **Authentication → URL Configuration**
2. Site URL: `https://kenshi-questpay.vercel.app`
3. Redirect allow list:
   - `https://kenshi-questpay.vercel.app/auth/callback`
   - `https://kenshi-questpay.vercel.app/auth/link/google/callback`
   - `http://localhost:3000/auth/callback`

## Step 4: Verify

After configuration, visit:
```
https://kenshi-questpay.vercel.app/api/health/auth
```

Expected:
```json
{
  "ok": true,
  "providers": {
    "googleConfigured": true,
    "magicLinkConfigured": true,
    "walletConfigured": true
  }
}
```

## Testing the flow

1. Visit `/sign-in`
2. Click **Continue with Google**
3. Select `winayaarya@gmail.com`
4. Approve scopes
5. Should redirect to `/admin` (super admin)

## Troubleshooting

### `provider_not_enabled`
Google provider is not enabled in Supabase. Complete Step 2.

### `oauth_callback_failed`
Redirect URI mismatch. Check that the Supabase callback URL matches what's in Google Console.

### `no_verified_email`
The Google account didn't return a verified email. Check scopes include `email`.
