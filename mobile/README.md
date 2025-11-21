# Word Battle - Mobile App

React Native mobile app for Word Battle game.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator / Physical device

### Installation

1. **Install dependencies:**
```bash
cd mobile
npm install
```

2. **Install AsyncStorage:**
```bash
npm install @react-native-async-storage/async-storage
```

3. **Copy shared files** (see INTEGRATION_STATUS.md for details):
   - Copy `frontend/lib/aiEngine.ts` → `mobile/src/lib/aiEngine.ts` (fix imports)
   - Copy `frontend/lib/journeyLevels.ts` → `mobile/src/lib/journeyLevels.ts` (fix imports)
   - Copy `frontend/lib/dictionaryLoader.ts` → `mobile/src/lib/dictionaryLoader.ts`
   - Copy `frontend/lib/dictionaryApi.ts` → `mobile/src/lib/dictionaryApi.ts`
   - Copy `frontend/stores/gameStore.ts` → `mobile/src/stores/gameStore.ts` (fix imports)

4. **Fix AsyncStorage** in `mobile/src/lib/dictionaryApi.ts`:
   - Replace `localStorage` with `AsyncStorage`
   - Make functions async where needed

### Running the App

```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

## 📱 Features

- **Game Modes:**
  - Journey Mode (Campaign)
  - PvE Arena
  - Daily Challenges
  - Word Bank

- **Game Features:**
  - 8x8 game board
  - Letter hand management
  - AI opponents with 5 difficulty levels
  - Word validation with comprehensive dictionary
  - Score tracking
  - Turn-based gameplay

## 📁 Project Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── game/
│   │       ├── GameBoard.tsx      # React Native game board
│   │       └── PlayerHand.tsx     # Letter hand display
│   ├── lib/                       # Shared game logic
│   │   ├── gameEngine.ts         # Core game mechanics
│   │   ├── aiEngine.ts           # AI opponent logic
│   │   ├── dictionary.ts         # Word validation
│   │   ├── dictionaryLoader.ts   # Dictionary loading
│   │   ├── dictionaryApi.ts      # Word definitions API
│   │   └── journeyLevels.ts      # Journey mode config
│   ├── screens/                   # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── GameScreen.tsx        # Main game screen
│   │   ├── JourneyScreen.tsx
│   │   ├── ArenaScreen.tsx
│   │   ├── DailyScreen.tsx
│   │   └── WordBankScreen.tsx
│   ├── stores/                    # State management
│   │   └── gameStore.ts          # Game state (Zustand)
│   └── types/                     # TypeScript types
│       └── index.ts
├── App.tsx                        # Main app entry
├── package.json
├── tsconfig.json
└── app.json                       # Expo config
```

## 🔧 Development

### Shared Code

The mobile app shares core game logic with the web frontend:
- Game engine (`lib/gameEngine.ts`)
- AI logic (`lib/aiEngine.ts`)
- Dictionary (`lib/dictionary.ts`)
- Types (`types/index.ts`)
- State management (`stores/gameStore.ts`)

These files are copied from `frontend/` with imports fixed for React Native.

### Adding New Features

1. Add shared logic in `src/lib/`
2. Create React Native components in `src/components/`
3. Wire up screens in `src/screens/`
4. Update navigation in `App.tsx`

## 📝 TODO

See `INTEGRATION_STATUS.md` for current integration status and remaining tasks.

## 🐛 Troubleshooting

### Files not found errors
- Make sure all files from `frontend/` are copied to `mobile/src/`
- Check that imports use relative paths (not `@/` aliases)

### localStorage errors
- Install `@react-native-async-storage/async-storage`
- Replace all `localStorage` calls with `AsyncStorage` in `dictionaryApi.ts`

### Module resolution errors
- Ensure `tsconfig.json` has correct paths
- Restart Expo bundler after file changes

## 📚 Documentation

- `INTEGRATION_STATUS.md` - Current integration progress
- `COPY_FILES.md` - Manual file copy instructions
- `QUICK_SETUP.md` - Quick setup guide
- `../README.md` - Main project README
