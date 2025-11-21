# Script to copy files from frontend to mobile and fix imports
# Run this from the project root: .\mobile\setup-imports.ps1

Write-Host "Copying files and fixing imports..." -ForegroundColor Green

# Create directories
New-Item -ItemType Directory -Force -Path "mobile/src/lib" | Out-Null
New-Item -ItemType Directory -Force -Path "mobile/src/stores" | Out-Null

function Copy-And-Fix-Imports {
    param($source, $dest)
    
    if (-not (Test-Path $source)) {
        Write-Host "Source file not found: $source" -ForegroundColor Red
        return
    }
    
    Write-Host "Copying $source to $dest..." -ForegroundColor Yellow
    
    $content = Get-Content $source -Raw
    # Fix imports
    $content = $content -replace "from '@/types'", "from '../types'"
    $content = $content -replace "from '@/lib/", "from '../lib/"
    $content = $content -replace "from '@/stores'", "from '../stores'"
    # Remove Next.js directives
    $content = $content -replace "'use client';`r?`n", ""
    $content = $content -replace "'use client';`n", ""
    $content = $content -replace "'use client';", ""
    
    Set-Content $dest -Value $content -NoNewline
    Write-Host "✓ Fixed imports in $dest" -ForegroundColor Green
}

# Copy and fix files
Copy-And-Fix-Imports "frontend/lib/aiEngine.ts" "mobile/src/lib/aiEngine.ts"
Copy-And-Fix-Imports "frontend/lib/dictionaryLoader.ts" "mobile/src/lib/dictionaryLoader.ts"
Copy-And-Fix-Imports "frontend/lib/dictionaryApi.ts" "mobile/src/lib/dictionaryApi.ts"
Copy-And-Fix-Imports "frontend/lib/journeyLevels.ts" "mobile/src/lib/journeyLevels.ts"
Copy-And-Fix-Imports "frontend/stores/gameStore.ts" "mobile/src/stores/gameStore.ts"

# Fix dictionaryLoader - remove window check for React Native
$loaderPath = "mobile/src/lib/dictionaryLoader.ts"
if (Test-Path $loaderPath) {
    $content = Get-Content $loaderPath -Raw
    $content = $content -replace "if \(typeof window !== 'undefined'\)", "// React Native - always load"
    $content = $content -replace "loadComprehensiveDictionary\(\)\.catch", "loadComprehensiveDictionary().catch"
    Set-Content $loaderPath -Value $content -NoNewline
    Write-Host "✓ Fixed dictionaryLoader for React Native" -ForegroundColor Green
}

# Fix dictionaryApi - replace localStorage with AsyncStorage placeholder
$apiPath = "mobile/src/lib/dictionaryApi.ts"
if (Test-Path $apiPath) {
    $content = Get-Content $apiPath -Raw
    # Add comment about AsyncStorage - will need to implement
    $content = $content -replace "localStorage\.", "// TODO: Replace with AsyncStorage - "
    Set-Content $apiPath -Value $content -NoNewline
    Write-Host "✓ Added AsyncStorage notes to dictionaryApi" -ForegroundColor Green
}

Write-Host "`nDone! Files copied and imports fixed." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install dependencies: cd mobile && npm install" -ForegroundColor White
Write-Host "2. Replace localStorage with AsyncStorage in dictionaryApi.ts" -ForegroundColor White
Write-Host "3. Create React Native game components" -ForegroundColor White

