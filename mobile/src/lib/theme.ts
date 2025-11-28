// Theme colors matching frontend ancient-tech aesthetic (dark mode default)

export const colors = {
  // Core palette
  ancientBronzeDeep: '#8b4513',
  ancientBronzeMedium: '#b87333',
  ancientBronzeBright: '#cd7f32',
  ancientSandstoneDeep: '#a67c52',
  ancientSandstoneMid: '#c19a6b',
  ancientSandstoneLight: '#d4a574',
  ancientVerdigrisShadow: '#1a4d4f',
  ancientVerdigrisMid: '#2f5d62',
  ancientVerdigrisGlow: '#4a7c7e',
  ancientObsidian: '#0d0d0f',
  ancientBasalt: '#1a1a1d',
  ancientShadow: '#101014',
  
  // Accents
  accentCyan: '#00d9ff',
  accentTeal: '#0097a7',
  accentAmber: '#ffb300',
  accentAmberDeep: '#ff8f00',
  accentPurple: '#9d4edd',
  accentPurpleDeep: '#6a1b9a',
  
  // Status
  statusJade: '#00e676',
  statusJadeLow: '#00c853',
  statusCrimson: '#d32f2f',
  statusCrimsonLow: '#c62828',
  statusSilver: '#e5e4e2',
  statusPlatinum: '#c0c0c0',
  
  // UI (matching frontend dark mode)
  background: '#070708', // Dark mode background
  foreground: '#f7ede2', // Dark mode foreground
  card: '#0f0f12', // Dark mode card
  cardForeground: '#f7ede2',
  popover: '#050506',
  popoverForeground: '#f7ede2',
  border: 'rgba(255, 179, 0, 0.35)', // Dark mode border
  input: 'rgba(0, 217, 255, 0.25)',
  muted: '#0b0c0f', // Dark mode muted
  mutedForeground: '#c0c0c0', // statusPlatinum
  primary: '#00d9ff', // accentCyan (dark mode primary)
  primaryForeground: '#101014', // ancientShadow
  secondary: '#b87333', // ancientBronzeMedium (dark mode secondary)
  secondaryForeground: '#1a1a1d', // ancientBasalt
  accent: '#ffb300', // accentAmber (dark mode accent)
  accentForeground: '#1a1a1d', // ancientBasalt
  destructive: '#d32f2f',
  destructiveForeground: '#f7ede2',
  ring: '#9d4edd', // accentPurple (dark mode ring)
};

// Font families (using system fonts that match the aesthetic)
// Frontend uses: Cinzel (display), Rajdhani (sans), Share Tech Mono (mono)
export const fonts = {
  display: 'System', // Will use serif-like font, closest to Cinzel
  sans: 'System', // Will use sans-serif, closest to Rajdhani
  mono: 'Courier', // Monospace, closest to Share Tech Mono
};

// Text styles matching frontend
export const textStyles = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 0.08,
    textTransform: 'uppercase' as const,
    color: colors.statusSilver,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.08,
    textTransform: 'uppercase' as const,
    color: colors.statusSilver,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.08,
    textTransform: 'uppercase' as const,
    color: colors.statusSilver,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.02,
    color: colors.foreground,
  },
  mono: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.05,
    textTransform: 'uppercase' as const,
    fontFamily: fonts.mono,
    color: colors.foreground,
  },
};

