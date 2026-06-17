# StuhDee

A full-stack spaced-repetition flashcard study app.

## Structure

```
/api      — Express + Mongoose REST API (MVC)
/mobile   — React Native (Expo) TypeScript app with RTK Query
/ui       — UI design references
```

## Features

- **Topics** — Create study topics with custom emoji, color & language
- **Flashcards** — Add question/answer cards; supports any language/script
- **Quiz Mode** — Flip cards to reveal answers, mark correct/wrong
- **Spaced Repetition** — SM-2 algorithm schedules reviews automatically
- **Analytics** — Accuracy, streaks, weekly activity, weakest cards
- **Dark UI** — Purple/violet primary, neon-green accents

---

## API (`/api`)

### Stack
- Express 4 + TypeScript
- Mongoose 8 (MongoDB)
- JWT auth (bcryptjs)

### Run
```bash
cd api
cp .env.example .env   # set MONGODB_URI + JWT_SECRET
npm install
npm run dev            # port 5000
```

### Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/topics
POST   /api/topics
PUT    /api/topics/:id
DELETE /api/topics/:id

GET    /api/topics/:topicId/cards
GET    /api/topics/:topicId/cards/due
POST   /api/topics/:topicId/cards
PUT    /api/topics/:topicId/cards/:id
DELETE /api/topics/:topicId/cards/:id

POST   /api/topics/:topicId/sessions
POST   /api/sessions/:sessionId/reviews
POST   /api/sessions/:sessionId/complete
GET    /api/topics/:topicId/sessions
GET    /api/analytics?topicId=
```

---

## Mobile (`/mobile`)

### Stack
- Expo SDK 56 + React Native 0.85
- TypeScript
- Redux Toolkit + RTK Query
- React Navigation v7 (native stack + bottom tabs)

### Run
```bash
cd mobile
npm install
# Set EXPO_PUBLIC_API_URL in .env
npx expo start
```

### Screens
- **Home** — Dashboard: streak, accuracy, weekly bar chart, weak cards
- **Topics** — List + create topics (emoji, color, language picker)
- **Topic Detail** — View/add/flip cards
- **Quiz Select** — Pick topic to study
- **Quiz Session** — Flip card → mark correct/wrong (animated)
- **Quiz Result** — Score, grade, stats
- **Analytics** — Per-topic or global: accuracy, activity chart, weak cards, session history
- **Profile** — User stats + sign out
