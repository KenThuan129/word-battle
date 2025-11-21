# Word Battle 🎮📚

A vocabulary-learning word-building strategy game. Players compete against AI opponents on an 8×8 grid, placing words crossword-style. Features campaign mode, PvE arena, daily challenges, and a progression system with Word Bank collection.

## 🚀 Tech Stack

- **Frontend**: Next.js 16+ (App Router, TypeScript, Tailwind CSS)
- **Backend**: C# .NET 8 Web API
- **Database**: PostgreSQL (player data, progress) + Redis (caching)
- **Mobile**: React Native + Expo (iOS/Android)
- **Containerization**: Docker & Docker Compose
- **Deployment**: GitHub Pages (web, automatic via GitHub Actions) + VPS (API)

## 📋 Features

### Game Modes

- **🎯 Journey Mode (Campaign)**: Story-driven vocabulary learning with increasing difficulty
- **⚔️ PvE Arena**: Fight AI opponents with 5 difficulty levels
- **📅 Daily Challenges**: 3 puzzles daily (Easy → Medium → Hard)
- **🏆 PvP Arena**: Coming soon (requires Keys from Daily Challenges)

### Core Gameplay

- 8×8 grid crossword-style word placement
- Each player starts with 10 random letters
- Letters drawn from weighted English distribution
- After every 2 turns, each player draws 5 new letters
- Win by emptying your hand or having fewer letters at deadlock

### AI Difficulty System

1. **Easy**: Plays short words (2-4 letters), ignores strategy
2. **Medium**: Balances word length and points, basic positioning
3. **Hard**: Strategic placement, blocks player opportunities
4. **Very Hard**: Optimizes for board control, saves high-value letters
5. **Nightmare**: Near-perfect play, unpredictable combos, aggressive blocking

### Power-Ups (Hard+ Only)

- **Letter Swap**: Exchange up to 3 letters from hand
- **Peek**: See opponent's hand for 2 turns
- **Wild Card**: One letter becomes any letter
- **Double Points**: Next word scores 2x
- **Undo**: Take back last move
- **Earthquake**: Remove 3 random letters from board
- **Freeze**: Opponent skips next turn
- **Word Bomb**: Clear entire row or column

### Word Bank System

- Collect words as you play and encounter them
- View definitions, parts of speech, and difficulty
- Track usage statistics
- Flashcard mode for studying
- Mark favorites and mastered words

## 🏗️ Project Structure

```
WordBattle/
├── frontend/              # Next.js 16 application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Game engine & utilities
│   ├── stores/           # State management (Zustand)
│   └── types/            # TypeScript types
├── backend/              # C# .NET 8 Web API
│   └── WordBattle.API/
│       ├── Controllers/  # API endpoints
│       ├── Models/       # Database models
│       ├── Services/     # Business logic
│       └── Data/         # DbContext
└── mobile/               # React Native + Expo (iOS/Android)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- .NET 8 SDK
- Docker & Docker Compose (for database)
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Backend Setup

```bash
cd backend/WordBattle.API
dotnet restore
dotnet run
```

The API will be available at `http://localhost:5000` (or configured port)

### Docker Setup (Database & Redis)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379

### Database Migrations

```bash
cd backend/WordBattle.API
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 🔑 Oxford Dictionary API Setup (Optional)

To use Oxford Dictionary words in the game:

1. **Register for Oxford Dictionary API**:
   - Visit [https://developer.oxforddictionaries.com/](https://developer.oxforddictionaries.com/)
   - Sign up for a free account (3,000 requests/month)
   - Get your App ID and App Key

2. **Configure API Credentials**:
   ```json
   // backend/WordBattle.API/appsettings.json
   {
     "OxfordDictionary": {
       "AppId": "your_app_id_here",
       "AppKey": "your_app_key_here"
     }
   }
   ```

3. **For Production**: Use environment variables:
   ```bash
   export OxfordDictionary__AppId="your_app_id"
   export OxfordDictionary__AppKey="your_app_key"
   ```

**Note**: 
- The game loads 370,000+ English words from comprehensive word lists by default
- Oxford Dictionary API is optional and used for:
  - **Word definitions** when viewing words in Word Bank
  - **Enhanced validation** against Oxford Dictionary standards
- The game works perfectly without Oxford Dictionary API configured

## 📝 Development Roadmap

### Phase 1: Core Game (Week 1-2) ✅
- [x] Game board UI with drag-and-drop
- [x] Letter distribution system
- [x] Word validation (embedded dictionary)
- [x] Basic game flow (turns, scoring, win condition)
- [ ] Easy/Medium AI opponents

### Phase 2: Journey Mode (Week 3-4)
- [ ] Level progression system
- [ ] Star rating calculation
- [ ] Level map UI
- [ ] Save/load progress (local storage → API)
- [ ] First 20 levels designed

### Phase 3: Word Bank (Week 5)
- [ ] Word collection tracking
- [ ] Dictionary API integration
- [ ] Word Bank UI (search, filter, favorites)
- [ ] Flashcard study mode

### Phase 4: Advanced AI & Power-ups (Week 6-7)
- [ ] Hard/Very Hard/Nightmare AI
- [ ] Power-up system implementation
- [ ] Power-up inventory management
- [ ] AI power-up usage logic

### Phase 5: PvE Arena & Daily (Week 8-9)
- [ ] Arena rank system
- [ ] Daily challenge generation
- [ ] Key tracking system
- [ ] Streak rewards

### Phase 6: Backend & Auth (Week 10)
- [x] C# API structure
- [ ] PostgreSQL database implementation
- [ ] Player authentication
- [ ] Cloud save sync

### Phase 7: Mobile Port (Week 11-12)
- [ ] React Native setup
- [ ] Shared code extraction
- [ ] Touch controls optimization
- [ ] App store preparation

### Phase 8: Polish & Launch (Week 13+)
- [ ] Animations & visual effects
- [ ] Sound design
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Launch!

## 🎮 How to Play

1. **Start a Game**: Choose Journey Mode, Arena, or Daily Challenge
2. **Build Your Word**: Click letters from your hand to build a word
3. **Place on Board**: Click cells on the board to place your word (first word must pass through center)
4. **Submit**: Click "Submit" to place your word
5. **Score**: Points are awarded based on letter values
6. **Win**: Empty your hand or have fewer letters remaining than your opponent

## 📚 API Endpoints

### Game
- `POST /api/game/start` - Start new game
- `POST /api/game/{id}/move` - Submit player move
- `GET /api/game/{id}/ai-move` - Get AI's next move
- `POST /api/game/{id}/end` - End/forfeit game

### Journey Mode
- `GET /api/journey/levels` - Get all levels with unlock status
- `GET /api/journey/level/{id}` - Get specific level config
- `POST /api/journey/level/{id}/start` - Start level
- `POST /api/journey/level/{id}/complete` - Complete level

### Daily Challenges
- `GET /api/daily/today` - Get today's 3 puzzles
- `GET /api/daily/puzzle/{id}` - Get specific puzzle
- `POST /api/daily/puzzle/{id}/complete` - Complete puzzle

### Word Bank
- `GET /api/wordbank` - Get player's collected words
- `POST /api/wordbank/{word}/favorite` - Toggle favorite

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 📱 Mobile App Setup

The mobile app is built with React Native and Expo, sharing core game logic with the web app.

### Setup

```bash
cd mobile
npm install
npm start
```

### Structure

- `src/screens/` - Screen components (Home, Journey, Arena, Daily, WordBank, Game)
- `src/components/` - Reusable React Native components
- `src/lib/` - Shared game logic from web app
- `src/stores/` - Shared Zustand state management
- `src/types/` - Shared TypeScript types

The mobile app uses the same game engine, AI logic, and dictionary as the web app for consistency across platforms.

## 🙏 Acknowledgments

- Dictionary sources: SOWPODS, TWL, Oxford Dictionary
- Free Dictionary API: https://api.dictionaryapi.dev/
- Oxford Dictionary API: https://developer.oxforddictionaries.com/

