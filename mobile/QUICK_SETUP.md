# Quick Setup Guide for Mobile App

## Step 1: Copy Shared Files

Run the PowerShell script from project root:
```powershell
.\mobile\setup-imports.ps1
```

OR manually copy files as described in `COPY_FILES.md`

## Step 2: Fix Remaining Issues

### Fix dictionaryApi.ts localStorage

Replace `localStorage` with AsyncStorage in `mobile/src/lib/dictionaryApi.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace localStorage.getItem with:
const cachedStr = await AsyncStorage.getItem(CACHE_KEY_PREFIX + word);

// Replace localStorage.setItem with:
await AsyncStorage.setItem(CACHE_KEY_PREFIX + word, JSON.stringify(cached));

// Replace localStorage.removeItem with:
await AsyncStorage.removeItem(CACHE_KEY_PREFIX + word);
```

### Fix dictionaryLoader.ts window check

In `mobile/src/lib/dictionaryLoader.ts`, remove or comment out:
```typescript
// React Native doesn't have window, always load dictionary
loadComprehensiveDictionary().catch(err => {
  console.warn('Failed to load comprehensive dictionary:', err);
});
```

## Step 3: Install Dependencies

```bash
cd mobile
npm install
```

## Step 4: Test

```bash
npm start
```

## Status

✅ **Completed:**
- Types copied
- Game Engine copied with correct imports
- React Native GameBoard component created
- React Native PlayerHand component created
- GameScreen structure created

⚠️ **In Progress:**
- Copy remaining lib files (aiEngine, journeyLevels, dictionaryLoader, dictionaryApi)
- Copy gameStore
- Fix localStorage → AsyncStorage
- Wire up GameScreen with gameStore

❌ **Pending:**
- Test game functionality
- Implement Journey/Arena/Daily screens with shared logic

