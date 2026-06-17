# StuhDee — Environment & Deployment Guide

## Overview

| Layer | Tech | Host |
|---|---|---|
| API | Express + TypeScript + Mongoose | Google Cloud Platform |
| Database | MongoDB | MongoDB Atlas (recommended) or GCP VM |
| Mobile | Expo React Native | Local dev / EAS Build for distribution |

---

## 1. MongoDB Setup

### Option A — MongoDB Atlas (Recommended with GCP)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster
2. Under **Network Access** → add IP `0.0.0.0/0` (or restrict to your GCP instance's external IP)
3. Under **Database Access** → create a user with `readWrite` on your database
4. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/stuhdee?retryWrites=true&w=majority
   ```
5. Paste this as `MONGODB_URI` in your API environment (see section 3)

### Option B — MongoDB on GCP VM

```bash
# On your GCP VM (Ubuntu)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

Then use `MONGODB_URI=mongodb://localhost:27017/stuhdee`

---

## 2. GCP — API Deployment

### Recommended: Cloud Run (serverless, auto-scales, no VM management)

#### Prerequisites

- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) installed and authenticated
- A GCP project created with billing enabled
- Enable APIs:
  ```bash
  gcloud services enable run.googleapis.com
  gcloud services enable artifactregistry.googleapis.com
  gcloud services enable cloudbuild.googleapis.com
  ```

#### Step 1 — Add a Dockerfile to `/api`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

#### Step 2 — Build & Push to Artifact Registry

```bash
# Set your project ID
export PROJECT_ID=your-gcp-project-id
export REGION=us-central1

# Create repository
gcloud artifacts repositories create stuhdee \
  --repository-format=docker \
  --location=$REGION

# Build and push
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/stuhdee/api:latest ./api
```

#### Step 3 — Deploy to Cloud Run

```bash
gcloud run deploy stuhdee-api \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/stuhdee/api:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=mongodb+srv://...,JWT_SECRET=your_secret_here,NODE_ENV=production" \
  --port 5000 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10
```

After deploy you'll get a public URL like:
```
https://stuhdee-api-xxxxxxxxxx-uc.a.run.app
```

> **Copy this URL** — you'll need it for the mobile app env variable.

#### Alternative: GCP Compute Engine (VM)

If you prefer a traditional VM:

```bash
# SSH into your VM, then:
git clone https://github.com/jmfp/studyapp
cd studyapp/api
cp .env.example .env
nano .env   # fill in values

npm install
npm run build

# Install PM2 to keep it running
npm install -g pm2
pm2 start dist/server.js --name stuhdee-api
pm2 startup    # auto-start on reboot
pm2 save
```

Open port 5000 in your GCP firewall:
```bash
gcloud compute firewall-rules create allow-stuhdee \
  --allow tcp:5000 \
  --target-tags=stuhdee-api \
  --description="StuhDee API"
```

---

## 3. API Environment Variables

Create `/api/.env` (never commit this):

```env
# Required
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/stuhdee
JWT_SECRET=change_this_to_a_long_random_string_min_32_chars

# Optional
PORT=5000
NODE_ENV=production
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 4. Mobile App — Point to your API

### Development (local testing)

Create `/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

For a physical device on the same network replace `localhost` with your machine's local IP:
```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000/api
```

### Production (after GCP deploy)

```env
EXPO_PUBLIC_API_URL=https://stuhdee-api-xxxxxxxxxx-uc.a.run.app/api
```

> Expo reads `EXPO_PUBLIC_*` variables at build time. You must rebuild the app after changing this.

---

## 5. Running Locally (Development)

### API

```bash
cd api
cp .env.example .env    # fill in MONGODB_URI and JWT_SECRET
npm install
npm run dev             # starts on http://localhost:5000
```

### Mobile

```bash
cd mobile
npm install
npx expo start          # opens Expo dev tools
# Press 'i' for iOS simulator, 'a' for Android emulator
# Or scan QR code with Expo Go app on your phone
```

---

## 6. Production Build — Mobile

To publish a standalone app build (no Expo Go required):

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

cd mobile

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production
```

Add an `eas.json` at `/mobile/eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://stuhdee-api-xxxxxxxxxx-uc.a.run.app/api"
      }
    }
  }
}
```

---

## 7. GCP Secret Manager (Best Practice)

Instead of setting env vars directly in Cloud Run flags, use Secret Manager:

```bash
# Create secrets
echo -n "your_mongodb_uri" | gcloud secrets create MONGODB_URI --data-file=-
echo -n "your_jwt_secret"  | gcloud secrets create JWT_SECRET --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding MONGODB_URI \
  --member="serviceAccount:$(gcloud run services describe stuhdee-api --format='value(spec.template.spec.serviceAccountName)')" \
  --role="roles/secretmanager.secretAccessor"

# Re-deploy referencing secrets
gcloud run deploy stuhdee-api \
  --set-secrets "MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest"
```

---

## 8. CORS

The API currently allows all origins (`cors({ origin: '*' })`). For production, lock it down to your known origins inside `/api/src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'https://your-web-client.com',  // if you add a web client
  ],
  credentials: true,
}));
```

For a mobile-only app, `*` is acceptable since there's no browser cookie risk.

---

## 9. Checklist

- [ ] MongoDB cluster created and connection string copied
- [ ] `/api/.env` file created with `MONGODB_URI` and `JWT_SECRET`
- [ ] GCP project created, billing enabled
- [ ] Cloud Run / Compute Engine API deployed and healthy (`GET /health` returns `200`)
- [ ] `/mobile/.env` updated with the live GCP API URL
- [ ] Mobile app rebuilt with production env var
- [ ] GCP firewall / Cloud Run ingress configured to allow public traffic
- [ ] (Optional) Custom domain mapped to Cloud Run service
- [ ] (Optional) Secrets moved to GCP Secret Manager
