#!/bin/bash

# ============================================
# Coin Clash Online - Environment Setup
# ============================================

echo "🎮 Setting up Coin Clash Online environment..."

# Backend .env
echo "📝 Creating apps/server/.env..."
cat > apps/server/.env << 'EOF'
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Supabase
SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
SUPABASE_SERVICE_KEY=7mrcMB7CpW0TnK1YyP8Z5Q_fFuPRU9G
EOF

# Frontend .env.local
echo "📝 Creating apps/web/.env.local..."
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_SERVER_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggiwdkdflwnzeznmogcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YCkoQ8YUinoFEqccZHprag_zwgWcstL
EOF

echo ""
echo "✅ Environment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Supabase database (see SUPABASE_SETUP.md)"
echo "2. Run: pnpm install"
echo "3. Run: pnpm dev"
echo ""
echo "🚀 Your game will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:3001"
echo ""

