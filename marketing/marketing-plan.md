# StuhDee Marketing Plan

**Product:** StuhDee — spaced-repetition flashcard app (iOS/Android)  
**Model:** Freemium — 2 decks free, Pro at $4.99/month (unlimited decks + advanced analytics)  
**Goal:** Grow installs, activate users into first study session, convert to Pro, retain long-term learners

---

## Positioning

**One-liner:** Serious spaced repetition with a modern mobile experience.

**Differentiators to lead with:**
- SM-2 scheduling with Anki-style quality ratings (0–5)
- Multilingual card input (Japanese, Korean, Arabic, and more)
- Clean dark UI — not cluttered like Anki, not shallow like Quizlet
- Analytics that surface weak cards, forecasts, and session history

**Primary audiences (in priority order):**
1. **Language learners** — students, travelers, JLPT/HSK prep
2. **University students** — med school, law, STEM memorization
3. **Anki refugees** — want SRS power without desktop-first UX
4. **Certification prep** — AWS, CPA, bar exam, nursing boards

---

## Funnel Overview

```
Traffic → Install → Sign up → Create deck + 5 cards → Complete 1 quiz → Hit free limit / want analytics → Pro
```

| Stage | Metric | Target (early) |
|---|---|---|
| Install | CPI / organic installs | Baseline in month 1 |
| Activation | % who complete 1 quiz in 24h | ≥ 40% |
| Engagement | D7 retention | ≥ 20% |
| Conversion | Free → Pro (30-day) | 3–8% |
| Revenue | ARPU / LTV | LTV > 3× CAC |

---

## Phase 0: Foundation (Before Spending on Traffic)

Do this once before any paid or scaled organic push.

- [ ] App Store / Play Store listings optimized (screenshots, keywords, preview video)
- [ ] Landing page with email capture (`stuhdee.app` or similar)
- [ ] Analytics: Mixpanel/Amplitude + RevenueCat for subscription events
- [ ] Deep links for campaigns (Branch or Expo linking)
- [ ] Referral hook in-app (even a simple “Share StuhDee” counts early)
- [ ] 2–3 short demo videos (15–30s) for social and ads
- [ ] Press kit: logo, screenshots, founder story, one-pager

**ASO keywords to target:** flashcards, spaced repetition, anki alternative, language flashcards, study app, SM-2, memorization, quiz cards

---

## Free Traffic Sources

### 1. App Store Optimization (ASO)

**Cost:** Free (time only)  
**Impact:** High — compounding over months

| Tactic | Action |
|---|---|
| Title & subtitle | Include “Spaced Repetition” + “Flashcards” |
| Keywords (iOS) | anki, memorize, language, study, srs, quizlet alternative |
| Screenshots | Show quiz flip, analytics, multilingual input, dark UI |
| Ratings | Prompt after 2nd completed quiz (not first launch) |
| Localization | Localize store listing for top 5 languages you support |

Refresh screenshots when AI features ship.

---

### 2. Content Marketing & SEO

**Cost:** Free (time)  
**Impact:** Medium–high (3–6 month lag)

**Blog / landing page topics:**
- “Anki vs StuhDee: which is right for you?”
- “How to memorize Japanese kanji with spaced repetition”
- “SM-2 explained in 5 minutes”
- “Best flashcard apps for med students [2026]”
- “How to import your study notes into flashcards”

**Distribution:** Publish on your site, cross-post summaries to Medium/Dev.to, link from Reddit/Quora answers.

**YouTube (long-term):** 5–10 min tutorials — “I built a flashcard app”, “Study routine with SM-2”, language-specific deck walkthroughs.

---

### 3. Reddit & Communities (Organic)

**Cost:** Free  
**Impact:** High for early adopters if done authentically

| Community | Approach |
|---|---|
| r/languagelearning | Help threads, mention app only when relevant |
| r/Anki | “Anki alternative with mobile-first UX” — expect skepticism, lead with SRS credibility |
| r/medicalschool, r/step1 | Study tool recommendations |
| r/learnjapanese, r/korean | Multilingual input as hook |
| Hacker News (Show HN) | Launch post when App Store live |
| Indie Hackers | Build-in-public updates |

**Rules:** Add value first. No spam. Use personal account, not brand account. Share metrics and lessons learned.

---

### 4. Product Hunt & Launch Platforms

**Cost:** Free  
**Impact:** Spike + backlinks + early users

| Platform | When |
|---|---|
| Product Hunt | Primary launch day (Tuesday–Thursday) |
| BetaList | Pre-launch waitlist |
| AlternativeTo | List as Anki/Quizlet alternative |
| Slant.co | Category: flashcard apps |

Prepare: maker comment, 3 screenshots, 30s GIF, respond to every comment for 24h.

---

### 5. Social Media (Organic)

**Cost:** Free  
**Impact:** Medium for B2C study apps

| Platform | Content type | Frequency |
|---|---|---|
| **TikTok / Reels** | “POV: you finally remember the card”, study aesthetic, 15s flip animation | 3–5×/week |
| **Twitter/X** | Build in public, SM-2 tips, ship logs | Daily |
| **Instagram** | Carousel: “5 cards you should make for JLPT N5” | 2×/week |
| **LinkedIn** | Founder story, edtech angle | 1×/week |

**Hashtags:** #studytok #languagelearning #spacedrepetition #flashcards #anki #studymotivation

---

### 6. Email & Owned Audience

**Cost:** Free tier (Mailchimp, Buttondown, Loops)  
**Impact:** High for retention and launches

- Waitlist before launch
- Onboarding drip: Day 0 welcome → Day 1 “create your first deck” → Day 3 tips → Day 7 upgrade nudge
- Feature launch emails (AI deck generation, etc.)
- Win-back for churned Pro users

---

### 7. Partnerships & Cross-Promotion

**Cost:** Free (rev-share optional)  
**Impact:** Medium

- Language YouTubers / tutors (affiliate or free Pro for review)
- Study influencers on TikTok (micro-influencers, 10k–100k followers)
- University study groups / Discord servers (offer group Pro discount later)
- Complementary apps (not competitors): habit trackers, pomodoro apps

---

### 8. Referral Program

**Cost:** Free decks or 1 month Pro for referrer + referee  
**Impact:** Medium once you have ~500 active users

Example: “Give a friend 1 extra free deck; you get 1 week Pro when they complete a quiz.”

---

## Paid Traffic Sources

Start paid only after activation rate is healthy (users who sign up actually study). Otherwise you pay to fill a leaky bucket.

### Recommended order of paid channels

| Priority | Channel | Best for | Typical CPI (study apps) |
|---|---|---|---|
| 1 | Apple Search Ads | High-intent iOS installs | $1.50–$4.00 |
| 2 | Google App Campaigns (UAC) | Android scale | $0.80–$3.00 |
| 3 | Meta (Instagram/Facebook) | Lookalikes, interest targeting | $1.00–$3.50 |
| 4 | TikTok Ads | Gen Z, language learners | $0.50–$2.50 |
| 5 | YouTube pre-roll | Tutorial adjacency | $2.00–$5.00 |
| 6 | Influencer paid posts | Trust + creative | $50–$500/post micro |

---

### 1. Apple Search Ads (ASA)

**Start here on iOS.**

Target keywords:
- anki, anki mobile, flashcards, spaced repetition
- quizlet, quizlet alternative
- japanese flashcards, language flashcards
- study app, memorize

Use Search Match for discovery, then double down on converters.  
**Goal:** CPI < $3 and 30-day ROAS positive on Pro subs.

---

### 2. Google Universal App Campaigns (UAC)

**Primary Android channel.**

- Upload 5+ creative variants (portrait video performs best)
- Let Google optimize; exclude underperforming placements after 2 weeks
- Target: Education, Language Learning interests

---

### 3. Meta Ads (Facebook / Instagram)

**Audiences:**
- Interests: Anki, Quizlet, Duolingo, Memrise, language learning
- Lookalike 1% from email list or app installers (once you have 1,000+)
- Retargeting: landing page visitors who didn’t install

**Creative angles:**
- Side-by-side: cluttered vs StuhDee UI
- “Hit the 2-deck limit?” → Pro upgrade
- Language learner testimonial (UGC style)

**Budget starter:** $10–20/day, kill ads with CPA > 2× target in 7 days.

---

### 4. TikTok Ads

**Strong for language learning and studytok.**

- Spark Ads on organic-style UGC (not polished corporate)
- Hooks: “The flashcard app Anki users switch to”, “I memorize 50 words/week with this”
- Optimize for app install, then build custom audience for retarget

---

### 5. YouTube Ads

- Target channels: language learning, med school, study with me
- 15s non-skippable or In-Feed video ads
- Higher CPV but good for consideration stage

---

### 6. Paid Influencers

| Tier | Followers | Cost | Use case |
|---|---|---|---|
| Nano | 1k–10k | $50–200 | Authentic TikTok reviews |
| Micro | 10k–100k | $200–1,000 | Dedicated video + link |
| Mid | 100k+ | $1,000+ | Launch only |

Track with unique promo codes or deep links. Require disclosure (#ad).

---

### 7. Sponsorships & Newsletters

- Study/education newsletters (e.g. Lenny’s adjacent, indie dev, language learning substacks)
- Podcast mid-rolls in language learning / productivity shows
- CPM $20–50 for niche newsletters; negotiate flat rate for small lists

---

## Budget Scenarios

### Bootstrap ($0/month paid)

| Channel | Hours/week |
|---|---|
| ASO + store optimization | 2 |
| Reddit + communities | 3 |
| TikTok/Reels organic | 4 |
| SEO blog (1 post/2 weeks) | 2 |
| **Total** | ~11 hrs/week |

**Expected:** 50–200 organic installs/month after month 2–3.

---

### Lean paid ($300/month)

| Allocation | Amount |
|---|---|
| Apple Search Ads | $150 |
| Meta retargeting | $100 |
| Micro-influencer (1/month) | $50 |

**Expected:** 100–300 installs/month + learn which keywords/creatives convert.

---

### Growth ($1,500/month)

| Allocation | Amount |
|---|---|
| Apple Search Ads | $600 |
| Google UAC | $400 |
| Meta prospecting + retarget | $300 |
| TikTok Ads | $150 |
| Influencer | $50 |

**Target:** Scale only when LTV/CAC > 3 on 60-day cohort.

---

## Conversion & Monetization Tactics

Free traffic is wasted without a clear path to Pro.

| Trigger | Message |
|---|---|
| 2nd deck created | “You’re at the free limit — upgrade for unlimited decks” |
| Analytics tab (free) | Locked weak/mastered cards + forecast |
| After 3 quiz sessions | Soft paywall: “Unlock advanced analytics” |
| Annual plan (future) | Offer 2 months free vs monthly |

**Pricing tests:** $4.99/mo vs $39.99/yr. Annual improves LTV and reduces churn.

---

## Metrics Dashboard (Weekly Review)

| Metric | Source |
|---|---|
| Installs by channel | App Store Connect, Play Console, Adjust/AppsFlyer |
| Activation rate | Analytics (first quiz &lt; 24h) |
| D1 / D7 / D30 retention | Mixpanel/Amplitude |
| Free → Pro conversion | RevenueCat |
| MRR / churn | RevenueCat |
| CPI / CPA by channel | Ad platforms |
| LTV (60-day) | RevenueCat cohorts |
| ASO rank for top 10 keywords | AppFollow, Sensor Tower (free tiers) |

**Kill rule:** Any paid channel with CPA > $15 and &lt; 2% Pro conversion after 1,000 clicks — pause and fix funnel first.

---

## 90-Day Launch Calendar

### Days 1–30: Foundation
- Finalize store listings and ASO
- Ship landing page + waitlist/email capture
- Post on 3–5 relevant subreddits (value-first)
- Start TikTok/Reels (3 posts/week)
- Submit to AlternativeTo, BetaList

### Days 31–60: Launch spike
- Product Hunt launch
- Show HN / Indie Hackers post
- Reach out to 10 micro-influencers (free Pro for honest review)
- Turn on Apple Search Ads at $10/day
- Publish 2 SEO blog posts

### Days 61–90: Optimize & scale
- Double ASA budget on winning keywords
- Add Meta retargeting ($5–10/day)
- Launch referral program
- A/B test paywall copy and screenshot set
- First paid influencer if organic CPI data looks good

---

## Messaging Cheat Sheet

| Audience | Hook | CTA |
|---|---|---|
| Language learners | “Flashcards that work with Japanese, Korean, Arabic — not just English” | Download free |
| Anki users | “SM-2 power without the 2005 UI” | Try StuhDee |
| Students | “Remember more, study less — spaced repetition done right” | Start first deck |
| Quizlet users | “Actually remember what you study — not just flip once” | Switch to SRS |

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| High CPI, low conversion | Fix activation before scaling paid |
| Reddit/community backlash | Be transparent, founder-led, no astroturfing |
| Quizlet/Anki brand dominance | Niche down (language + mobile SRS) |
| Churn after month 1 | Streaks, weekly insights, new deck templates |
| Apple/Google rejection | Follow subscription disclosure guidelines |

---

## Next Steps

1. Pick one primary audience for the first 90 days (recommend: **language learners** — matches your multilingual UX).
2. Ship store listing + 3 social creatives before any paid spend.
3. Run bootstrap organic for 30 days; measure activation rate.
4. Turn on Apple Search Ads at $10/day when activation ≥ 35%.
5. Revisit this plan when AI deck generation ships — that becomes the lead message for paid and organic.

---

*Last updated: June 2026*
