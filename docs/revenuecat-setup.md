# RevenueCat Setup Guide

## Overview

StuhDee uses [RevenueCat](https://www.revenuecat.com) to manage in-app subscriptions.

| Plan | Price | Decks |
|---|---|---|
| Free | $0 | 2 decks max |
| Pro | $4.99/month | Unlimited |

---

## 1. Create a RevenueCat Account

1. Sign up at [app.revenuecat.com](https://app.revenuecat.com)
2. Create a new **Project** → name it `StuhDee`

---

## 2. Create Products in App Store / Play Store

### iOS (App Store Connect)
1. Go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **In-App Purchases**
2. Create a **Auto-Renewable Subscription**:
   - Reference Name: `StuhDee Pro Monthly`
   - Product ID: `com.stuhdee.app.pro_monthly`
   - Price: $4.99/month
   - Subscription Group: `StuhDee Pro`
3. Complete the review information (screenshot, description)

### Android (Google Play Console)
1. Go to [Google Play Console](https://play.google.com/console) → your app → **Monetize → Subscriptions**
2. Create subscription:
   - Product ID: `stuhdee_pro_monthly`
   - Base plan: Monthly at $4.99

---

## 3. Set Up RevenueCat Entitlement

In RevenueCat dashboard:

1. **Products** → Add iOS product ID: `com.stuhdee.app.pro_monthly`
2. **Products** → Add Android product ID: `stuhdee_pro_monthly`
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

- [ ] RevenueCat account created, project named `StuhDee`
- [ ] iOS product created in App Store Connect
- [ ] Android product created in Google Play Console
- [ ] Products added to RevenueCat
- [ ] Entitlement `pro` created, products attached
- [ ] Default offering configured with monthly package
- [ ] iOS & Android API keys copied to `/mobile/.env`
- [ ] App Store shared secret pasted into RevenueCat
- [ ] Test purchase works in simulator/device sandbox
- [ ] Restore purchases tested

---

## 10. Production Launch Checklist

Sandbox success does **not** require code changes — the same RevenueCat public SDK keys work in production. What you do need before App Store release:

### App Store Connect
- [ ] **Paid Apps Agreement** signed (Agreements, Tax, and Banking)
- [ ] Subscription product `com.stuhdee.app.pro_monthly` status is **Ready to Submit**
- [ ] Subscription localization, pricing, and **review screenshot** completed
- [ ] Subscription attached to the app version you submit for review
- [ ] **Privacy Policy URL** set on the app record (required for subscriptions)
- [ ] App description mentions auto-renewing subscription terms (price, duration, cancel in Settings)

### RevenueCat
- [ ] iOS **App Store shared secret** (or App Store Connect API key) configured
- [ ] `default` offering marked **Current**
- [ ] Entitlement `pro` linked to production product IDs
- [ ] (Recommended) **Webhook** → `https://stuhdee-api-897399001508.us-central1.run.app/api/webhooks/revenuecat` for `CANCELLATION` / `EXPIRATION` so the API downgrades users when subs lapse

### Mobile app
- [ ] `EXPO_PUBLIC_API_URL` points to production API (not localhost)
- [ ] Ship a **production build** (EAS Build or `expo run:ios --configuration Release`) — not Expo Go
- [ ] Profile → **Manage or cancel subscription** opens Apple/Google billing (already in app)
- [ ] Paywall shows **Restore Purchases** (already in app)
- [ ] Test one real purchase via **TestFlight** before public release

### Android (when you ship Play Store)
- [ ] Play Console subscription `stuhdee_pro_monthly` published
- [ ] RevenueCat linked to Google Play via **service account**
- [ ] `EXPO_PUBLIC_RC_API_KEY_ANDROID` in `.env`

### What sandbox proved vs. production
| Sandbox | Production |
|---|---|
| Subscriptions renew in minutes | Renews monthly |
| Sandbox Apple ID | Real Apple ID + payment |
| Works in dev build / TestFlight | App Store review + live users |

No toggle to “turn on production” in the app — going live is App Store Connect + submitting a release build.

---

## 11. App Store rejection: Guideline 2.3.2 (duplicate IAP metadata)

Apple rejects when **Promoted In-App Purchase** and/or **Win-Back Offer** use the **same display name or description** as each other (or as the base subscription). This is fixed only in **App Store Connect** — no app rebuild required unless you also change app version notes.

### Option A — You are NOT promoting the subscription on the App Store

1. [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → **StuhDee** → **In-App Purchases**
2. Open `com.stuhdee.app.pro_monthly` (StuhDee Pro Monthly)
3. Find **App Store Promotion** (promotional image / promoted IAP section)
4. **Remove the promotional image** (or turn off promotion)
5. If you created a **Win-Back Offer**, either delete it or give it unique metadata (Option B)
6. Save → reply to App Review in Resolution Center: *"Removed promotional IAP image / updated win-back metadata. Promoted IAP metadata is no longer duplicated."*
7. **Resubmit** the same build (1.0 build 7) — no new binary needed

### Option B — You ARE promoting (or using win-back) — use unique copy

Each field must be **different**. Limits: **display name ≤ 30 chars**, **description ≤ 45 chars**.

| Field | Where | Suggested text |
|---|---|---|
| Subscription name | Subscription → English localization | `StuhDee Pro` |
| Subscription description | Same screen (longer) | `Unlimited decks, AI flashcard generation, study coach, and advanced analytics.` |
| **Promoted display name** | App Store Promotion | `StuhDee Pro Monthly` (22 chars) |
| **Promoted description** | App Store Promotion | `AI decks, unlimited topics & analytics` (40 chars) |
| **Win-back display name** | Win-Back Offer (if any) | `Return to StuhDee Pro` (21 chars) |
| **Win-back description** | Win-Back Offer (if any) | `Unlock AI cards & unlimited study decks` (39 chars) |

Do **not** use `StuhDee Pro` for every promoted/win-back display name **and** the same sentence for every description.

### Steps in App Store Connect

1. **Apps** → **StuhDee** → **Subscriptions** → group **StuhDee Pro** → product **StuhDee Pro Monthly**
2. **App Store Localization** — set the standard subscription name/description (table above)
3. Scroll to **App Store Promotion** → edit **Promotional Image** metadata:
   - Display Name: `StuhDee Pro Monthly`
   - Description: `AI decks, unlimited topics & analytics`
4. If **Win-Back Offers** exists (Subscriptions → offer or separate win-back section):
   - Display Name: `Return to StuhDee Pro`
   - Description: `Unlock AI cards & unlimited study decks`
5. **Save** all localizations
6. **App Store** → your version **1.0** → ensure the subscription is still attached
7. **Reply** to the rejection in Resolution Center (example below)
8. Click **Submit for Review** again (same build is fine)

### Reply to paste in App Store Connect

```
Hello,

We updated the In-App Purchase metadata for com.stuhdee.app.pro_monthly:

- Promoted IAP display name: StuhDee Pro Monthly
- Promoted IAP description: AI decks, unlimited topics & analytics
- [If applicable] Win-back display name: Return to StuhDee Pro
- [If applicable] Win-back description: Unlock AI cards & unlimited study decks

[If you removed promotion instead:]
We removed the App Store promotional image for this subscription since we are not promoting it on the store listing.

Each metadata field is now unique. No app binary changes were required.

Thank you.
```

### After approval

No code changes needed. RevenueCat and the in-app paywall are unchanged.
