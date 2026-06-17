#!/usr/bin/env bash
# Deploy StuhDee API to GCP Cloud Run (project: stuhdee)
# Prerequisites: gcloud CLI, billing enabled on project, api/.env filled in
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-stuhdee}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${GCP_SERVICE_NAME:-stuhdee-api}"
REPO_NAME="stuhdee"
IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/api:latest"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$SCRIPT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example and fill in values."
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

if [[ -z "${MONGODB_URI:-}" || -z "${JWT_SECRET:-}" ]]; then
  echo "MONGODB_URI and JWT_SECRET must be set in api/.env"
  exit 1
fi

# Fix common JWT_SECRET typo (JWT_SECRET=JWT_SECRET=...)
if [[ "$JWT_SECRET" == JWT_SECRET=* ]]; then
  JWT_SECRET="${JWT_SECRET#JWT_SECRET=}"
fi

echo "→ Using project: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

echo "→ Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

echo "→ Ensuring Artifact Registry repo exists..."
if ! gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" &>/dev/null; then
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --description="StuhDee API images"
fi

echo "→ Building and pushing image (this may take a few minutes)..."
gcloud builds submit --tag "$IMAGE" "$SCRIPT_DIR"

upsert_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" &>/dev/null; then
    echo -n "$value" | gcloud secrets versions add "$name" --data-file=-
  else
    echo -n "$value" | gcloud secrets create "$name" --data-file=-
  fi
}

echo "→ Upserting secrets..."
upsert_secret MONGODB_URI "$MONGODB_URI"
upsert_secret JWT_SECRET "$JWT_SECRET"
SECRET_NAMES=(MONGODB_URI JWT_SECRET)
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  upsert_secret OPENAI_API_KEY "$OPENAI_API_KEY"
  SECRET_NAMES+=(OPENAI_API_KEY)
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "→ Granting Cloud Run access to secrets ($RUNTIME_SA)..."
for secret in "${SECRET_NAMES[@]}"; do
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${RUNTIME_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet >/dev/null
done

SECRET_ARGS="MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest"
ENV_ARGS="NODE_ENV=production,OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}"
if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  SECRET_ARGS="$SECRET_ARGS,OPENAI_API_KEY=OPENAI_API_KEY:latest"
fi

echo "→ Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 10 \
  --set-secrets "$SECRET_ARGS" \
  --set-env-vars "$ENV_ARGS"

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
API_URL="${SERVICE_URL}/api"

echo ""
echo "✓ Deployed: $SERVICE_URL"
echo "  Health:   ${SERVICE_URL}/health"
echo "  API base: $API_URL"
echo ""

if curl -sf "${SERVICE_URL}/health" >/dev/null; then
  echo "✓ Health check passed"
else
  echo "⚠ Health check failed — check Cloud Run logs:"
  echo "  gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50"
fi

MOBILE_ENV="$ROOT_DIR/mobile/.env"
if [[ -f "$MOBILE_ENV" ]]; then
  if grep -q '^EXPO_PUBLIC_API_URL=' "$MOBILE_ENV"; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$MOBILE_ENV"
    else
      sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=$API_URL|" "$MOBILE_ENV"
    fi
  else
    echo "EXPO_PUBLIC_API_URL=$API_URL" >> "$MOBILE_ENV"
  fi
  echo "✓ Updated mobile/.env → EXPO_PUBLIC_API_URL=$API_URL"
fi

echo ""
echo "Redeploy after code changes:"
echo "  ./api/deploy.sh"
