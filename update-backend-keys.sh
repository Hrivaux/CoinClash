#!/bin/bash

# ============================================
# Update Backend Supabase Keys
# ============================================

echo "🔑 Updating backend Supabase keys..."

# Update backend .env
cat > apps/server/.env << 'EOF'
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Supabase
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxODkzMTQsImV4cCI6MjA4Mjc2NTMxNH0.we0TXbxW2wTzEODo5VjyYse-xS-RGCVADU6FX-1jvTo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnaXdka2RmbHduemV6bm1vZ2NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE4OTMxNCwiZXhwIjoyMDgyNzY1MzE0fQ.1L_wc62QnumxiDBPbWSMGV8pgJYYwlrB9cuHX71w_lA
EOF

echo "✅ Backend keys updated!"
echo ""
echo "🔄 Redémarrage du serveur..."

