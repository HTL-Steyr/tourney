#!/usr/bin/env bash
set -euo pipefail

echo "1) Installing dependencies..."
bun install

echo
echo "2) Start Supabase in another terminal:"
echo
echo "     bun run start:supabase"
echo
read -rp "   Press ENTER once you have SUPABASE_URL and KEYS..."

echo
echo "3) Copying .env.example → .env in each package..."
find . -type f -name ".env.example" -print0 | while IFS= read -r -d '' ex; do
  dst="$(dirname "$ex")/.env"
  cp "$ex" "$dst"
  echo "  → $dst"
done

echo
echo "4) Enter your Supabase credentials and other vars:"
read -rp "   SUPABASE_URL: " SUPABASE_URL
read -rp "   SUPABASE_KEY: " SUPABASE_KEY
read -rp "   SUPABASE_SECRET_KEY: " SUPABASE_SECRET_KEY
read -rp "   NUXT_PUBLIC_CLIENT_URL [http://localhost:3001]: " NUXT_PUBLIC_CLIENT_URL
NUXT_PUBLIC_CLIENT_URL=${NUXT_PUBLIC_CLIENT_URL:-http://localhost:3001}
# TODO: enhance DX
read -rp "   USERS_TO_CREATE (guide in /apps/user-creator/.env.example): " USERS_TO_CREATE

echo
echo "5) Writing values into .env files..."
for envf in $(find . -type f -name ".env"); do
  if [[ "$(uname)" == "Darwin" ]]; then
    sed -i '' \
      -e "s|^SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" \
      -e "s|^SUPABASE_KEY=.*|SUPABASE_KEY=$SUPABASE_KEY|" \
      -e "s|^SUPABASE_SECRET_KEY=.*|SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY|" \
      -e "s|^SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SECRET_KEY|" \
      -e "s|^NUXT_PUBLIC_CLIENT_URL=.*|NUXT_PUBLIC_CLIENT_URL=$NUXT_PUBLIC_CLIENT_URL|" \
      -e "s|^USERS_TO_CREATE=.*|USERS_TO_CREATE=$USERS_TO_CREATE|" \
      "$envf"
  else
    sed -i \
      -e "s|^SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|" \
      -e "s|^SUPABASE_KEY=.*|SUPABASE_KEY=$SUPABASE_KEY|" \
      -e "s|^SUPABASE_SECRET_KEY=.*|SUPABASE_SECRET_KEY=$SUPABASE_SECRET_KEY|" \
      -e "s|^SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SECRET_KEY|" \
      -e "s|^NUXT_PUBLIC_CLIENT_URL=.*|NUXT_PUBLIC_CLIENT_URL=$NUXT_PUBLIC_CLIENT_URL|" \
      -e "s|^USERS_TO_CREATE=.*|USERS_TO_CREATE=$USERS_TO_CREATE|" \
      "$envf"
  fi
  echo "  ✔ $envf"
done

echo
echo "Done! Next step:"
echo
echo "   bun run dev"
