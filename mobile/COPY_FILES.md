# Manual File Copy Instructions

Since automatic copying isn't working, please manually copy these files and fix imports:

## Files to Copy:

1. **aiEngine.ts**: `frontend/lib/aiEngine.ts` → `mobile/src/lib/aiEngine.ts`
   - Fix: Change `from '@/types'` to `from '../types'`

2. **journeyLevels.ts**: `frontend/lib/journeyLevels.ts` → `mobile/src/lib/journeyLevels.ts`
   - Fix: Change `from '@/types'` to `from '../types'`

3. **dictionaryLoader.ts**: `frontend/lib/dictionaryLoader.ts` → `mobile/src/lib/dictionaryLoader.ts`
   - No import fixes needed (uses relative imports)

4. **dictionaryApi.ts**: `frontend/lib/dictionaryApi.ts` → `mobile/src/lib/dictionaryApi.ts`
   - No import fixes needed
   - TODO: Replace `localStorage` with AsyncStorage

5. **gameStore.ts**: `frontend/stores/gameStore.ts` → `mobile/src/stores/gameStore.ts`
   - Fix: Change `from '@/types'` to `from '../types'`
   - Fix: Change `from '@/lib/` to `from '../lib/`
   - Remove: `'use client';` directive

## Quick PowerShell Command:

Run this from the project root:

```powershell
cd mobile
New-Item -ItemType Directory -Force -Path src/lib,src/stores | Out-Null

# Copy aiEngine
$content = Get-Content ../frontend/lib/aiEngine.ts -Raw
$content = $content -replace "from '@/types'", "from '../types'"
Set-Content src/lib/aiEngine.ts -Value $content -NoNewline

# Copy journeyLevels
$content = Get-Content ../frontend/lib/journeyLevels.ts -Raw
$content = $content -replace "from '@/types'", "from '../types'"
Set-Content src/lib/journeyLevels.ts -Value $content -NoNewline

# Copy dictionaryLoader
Copy-Item ../frontend/lib/dictionaryLoader.ts src/lib/dictionaryLoader.ts -Force

# Copy dictionaryApi
Copy-Item ../frontend/lib/dictionaryApi.ts src/lib/dictionaryApi.ts -Force

# Copy gameStore
$content = Get-Content ../frontend/stores/gameStore.ts -Raw
$content = $content -replace "from '@/types'", "from '../types'"
$content = $content -replace "from '@/lib/", "from '../lib/"
$content = $content -replace "'use client';", ""
Set-Content src/stores/gameStore.ts -Value $content -NoNewline
```

## After Copying:

1. Fix dictionaryLoader.ts: Remove or adjust `typeof window !== 'undefined'` check for React Native
2. Replace localStorage with AsyncStorage in dictionaryApi.ts
3. Test that all imports work correctly

