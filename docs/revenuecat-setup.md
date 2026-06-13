# RevenueCat Setup Guide

## Overview

FlashStudy uses [RevenueCat](https://www.revenuecat.com) to manage in-app subscriptions.

| Plan | Price | Decks |
|---|---|---|
| Free | $0 | 2 decks max |
| Pro | $4.99/month | Unlimited |

---

## 1. Create a RevenueCat Account

1. Sign up at [app.revenuecat.com](https://app.revenuecat.com)
2. Create a new **Project** → name it `FlashStudy`

---

## 2. Create Products in App Store / Play Store

### iOS (App Store Connect)
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **In-App Purchases**
2. Create a **Auto-Renewable Subscription**:
   - Reference Name: `FlashStudy Pro Monthly`
   - Product ID: `com.flashstudy.app.pro_monthly`
   - Price: $4.99/month
   - Subscription Group: `FlashStudy Pro`
3. Complete the review information (screenshot, description)

### Android (Google Play Console)
1. Go to [Google Play Console](https://play.google.com/console) → your app → **Monetize → Subscriptions**
2. Create subscription:
   - Product ID: `flashstudy_pro_monthly`
   - Base plan: Monthly at $4.99

---

## 3. Set Up RevenueCat Entitlement

In RevenueCat dashboard:

1. **Products** → Add iOS product ID: `com.flashstudy.app.pro_monthly`
2. **Products** → Add Android product ID: `flashstudy_pro_monthly`
3. **Entitlements** → Create entitlement:
   - Identifier: **`pro`** ← must match `RC_ENTITLEMENT` in `src/services/revenueCat.ts`
   - Attach both products to this entitlement
4. **Offerings** → Create offering:
   - Identifier: `default`
   - Add a package: `$rc_monthly` → attach your monthly products

---

## 4. Get API Keys

In RevenueCat dashboard → **Project Settings → API Keys**:

- Copy your **iOS public SDK key** (starts with `appl_`)
- Copy your **Android public SDK key** (starts with `goog_`)

---

## 5. Add Keys to Mobile Environment

Create `/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://your-gcp-api-url.run.app/api
EXPO_PUBLIC_RC_API_KEY_IOS=appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_RC_API_KEY_ANDROID=goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

These are read in `src/services/revenueCat.ts`.

---

## 6. Configure App Store Shared Secret (iOS)

For RevenueCat to validate receipts:

1. App Store Connect → **Users and Access → Shared Secret**
2. Copy the shared secret
3. In RevenueCat → iOS App Settings → paste the shared secret

---

## 7. Webhook (Optional — Keeps Server in Sync)

To keep the API's `subscriptionTier` in sync when subscriptions expire or renew:

1. RevenueCat dashboard → **Integrations → Webhooks**
2. Add endpoint: `https://your-api.run.app/api/webhooks/revenuecat`
3. Select events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`

Then add the webhook handler in `/api/src/routes/` (verify `Authorization` header from RevenueCat).

For now the client calls `POST /api/auth/subscription` after every purchase/restore which is sufficient for a v1.

---

## 8. Testing

### iOS Sandbox
- Use a Sandbox Apple ID (create in App Store Connect → Users)
- In Expo dev build, sandbox purchases auto-expire in minutes (not months)

### Android Test Tracks
- Upload to internal test track
- Add test accounts in Play Console → License Testing

### RevenueCat Debug
Set `LOG_LEVEL.DEBUG` in `initRevenueCat()` (already done in `__DEV__` mode) to see all RC events in Metro logs.

---

## 9. Checklist

- [ ] RevenueCat account created, project named `FlashStudy`
- [ ] iOS product created in App Store Connect
- [ ] Android product created in Google Play Console
- [ ] Products added to RevenueCat
- [ ] Entitlement `pro` created, products attached
- [ ] Default offering configured with monthly package
- [ ] iOS & Android API keys copied to `/mobile/.env`
- [ ] App Store shared secret pasted into RevenueCat
- [ ] Test purchase works in simulator/device sandbox
- [ ] Restore purchases tested
