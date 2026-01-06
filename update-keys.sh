#!/bin/bash

# ============================================
# Update Supabase Keys
# ============================================

echo "🔑 Updating Supabase keys..."

# Update frontend .env.local
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODkzMTQsImV4cCI6MjA4Mjc2NTMxNH0.we0TXbxW2wTzEODo5VjyYse-xS-RGCVADU6FX-1jvTo
EOF

echo "✅ Frontend keys updated!"
echo ""
echo "⚠️  IMPORTANT: Vous devez aussi mettre à jour la clé SERVICE_ROLE dans:"
echo "   apps/server/.env"
echo ""
echo "Envoyez-moi la clé service_role (la 2ème clé dans Supabase → Settings → API)"
echo ""

