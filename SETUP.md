# 🚀 Coin Clash Online - Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0

## Installation

```bash
# Install pnpm globally (if not already installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

## Configuration

### Backend Server

Create `apps/server/.env`:

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend Web App

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
```

## Running the Project

### Development Mode (All apps)

```bash
# Run both frontend and backend in watch mode
pnpm dev
```

This will start:
- **Backend Server** on `http://localhost:3001`
- **Frontend Web** on `http://localhost:3000`

### Individual Apps

```bash
# Run only the server
cd apps/server
pnpm dev

# Run only the web app
cd apps/web
pnpm dev
```

## Build for Production

```bash
# Build all apps
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
coin-clash-online/
├── apps/
│   ├── server/          # Backend Express + Socket.io
│   │   ├── src/
│   │   │   ├── game/    # Game logic manager
│   │   │   ├── room/    # Room management
│   │   │   ├── social/  # Friends & invites
│   │   │   ├── progression/  # XP, levels, badges
│   │   │   └── socket/  # Socket.io handlers
│   │   └── package.json
│   │
│   └── web/             # Frontend Next.js + Framer Motion
│       ├── src/
│       │   ├── app/     # Next.js pages
│       │   ├── components/  # React components
│       │   ├── lib/     # Socket manager
│       │   └── stores/  # Zustand state management
│       └── package.json
│
└── packages/
    └── shared/          # Shared types & game logic
        ├── src/
        │   ├── types/   # TypeScript types
        │   └── game/    # Rules, cards, events, roles, bots
        └── package.json
```

## Tech Stack

### Backend
- **Express** - HTTP server
- **Socket.io** - Real-time WebSocket communication
- **TypeScript** - Type safety
- **nanoid** - Room code generation

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Framer Motion** - Animations
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Socket.io-client** - WebSocket client

### Shared
- **TypeScript** - Shared types and interfaces
- **Game Logic** - Rules, economy, cards, events, roles
- **Bot AI** - 4 difficulty levels with different strategies

## Game Features

### Core Gameplay
- ✅ 2-6 players (including bots)
- ✅ Unique highest bet wins system
- ✅ 25-40 turn games with stable economy
- ✅ 60 starting coins, 120 coin cap

### Modules (All Optional)
- ✅ **Dynamic Economy** - Comeback mechanics, recovery mode
- ✅ **Special Cards** - 9 card types with strategic depth
- ✅ **Random Events** - 10+ events that modify rules
- ✅ **Hidden Roles** - Secret objectives for long-term strategy
- ✅ **Chat/Emotes** - Social interaction
- ✅ **Leaderboards** - Global and friend rankings

### Social Features
- ✅ Friends system
- ✅ Private rooms with codes
- ✅ Room invitations
- ✅ Bot fill for solo practice

### Progression
- ✅ XP and level system
- ✅ Badges and achievements
- ✅ Unlockable cosmetics (skins, titles, animations)
- ✅ Global statistics tracking

### Bot AI
- 🤖 **Rookie** - Random weighted bets
- 🤖 **Analyst** - History tracking and probability analysis
- 🤖 **Trickster** - Bluffs with small unique bets
- 🤖 **Shark** - Meta-game and pattern recognition

## Development Tips

### Hot Reload
Both frontend and backend support hot reload in development mode.

### TypeScript Strict Mode
All packages use strict TypeScript for type safety.

### Debugging
- Backend logs appear in the terminal running the server
- Frontend uses React DevTools
- Socket events are logged in browser console

### Adding New Features

1. **New Game Logic**: Add to `packages/shared/src/game/`
2. **New API Endpoint**: Add to `apps/server/src/`
3. **New UI Component**: Add to `apps/web/src/components/`
4. **New Game Rule**: Update `GameRules` class in shared package

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is in use, change the port in the `.env` files.

### Socket Connection Failed
Make sure the backend server is running and `NEXT_PUBLIC_SERVER_URL` is correct.

### TypeScript Errors
Run `pnpm build` in the shared package first:
```bash
cd packages/shared
pnpm build
```

### Clean Install
If you encounter dependency issues:
```bash
# Clean everything
pnpm clean
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules

# Reinstall
pnpm install
```

## Testing the Game

1. Start both apps: `pnpm dev`
2. Open `http://localhost:3000` in your browser
3. Click "Create Room"
4. Configure game options
5. Add bots or open another browser tab to join with the room code
6. Start the game and enjoy!

## Next Steps

- [ ] Add database integration (PostgreSQL/MongoDB)
- [ ] Add authentication (JWT/OAuth)
- [ ] Deploy to production (Vercel + Railway/Heroku)
- [ ] Add sound effects and music
- [ ] Mobile responsive improvements
- [ ] Spectator mode
- [ ] Replay system
- [ ] Tournament system
- [ ] Seasonal rankings

## Support

For issues or questions, check the README.md or create an issue on GitHub.

---

**Have fun playing Coin Clash Online!** 🎮💰🎲

