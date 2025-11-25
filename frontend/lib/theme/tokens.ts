export const ancientTechPalette = {
  bronze: {
    deep: "#8B4513",
    medium: "#B87333",
    bright: "#CD7F32",
  },
  verdigris: {
    shadow: "#1A4D4F",
    mid: "#2F5D62",
    glow: "#4A7C7E",
  },
  sandstone: {
    deep: "#A67C52",
    mid: "#C19A6B",
    light: "#D4A574",
  },
  accent: {
    cyan: "#00D9FF",
    teal: "#0097A7",
    amber: "#FFB300",
    amberDeep: "#FF8F00",
    purple: "#9D4EDD",
    purpleDeep: "#6A1B9A",
  },
  status: {
    jadeHigh: "#00E676",
    jadeLow: "#00C853",
    crimsonHigh: "#D32F2F",
    crimsonLow: "#C62828",
    silver: "#E5E4E2",
    platinum: "#C0C0C0",
  },
  neutral: {
    obsidian: "#0D0D0F",
    basalt: "#1A1A1D",
    shadow: "#101010",
  },
} as const;

export const glowPresets = {
  cyan: "0 0 16px rgba(0, 217, 255, 0.75)",
  amber: "0 0 18px rgba(255, 176, 0, 0.65)",
  verdigris: "0 0 14px rgba(74, 124, 126, 0.6)",
  purple: "0 0 20px rgba(157, 78, 221, 0.7)",
};

export const typographySystem = {
  display: {
    font: "var(--font-ancient-display)",
    letterSpacing: "0.08em",
    transform: "uppercase",
  },
  body: {
    font: "var(--font-ancient-sans)",
    letterSpacing: "0.02em",
  },
  stats: {
    font: "var(--font-ancient-mono)",
    letterSpacing: "0.04em",
  },
} as const;

export const surfacePresets = {
  tablet: {
    background:
      "linear-gradient(135deg, rgba(26, 26, 29, 0.95) 0%, rgba(16, 16, 18, 0.85) 100%)",
    border: "1px solid rgba(255, 179, 0, 0.15)",
    shadow:
      "0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
  },
  stone: {
    background:
      "radial-gradient(circle at 20% 20%, rgba(255, 191, 105, 0.05), transparent 40%), #1A1A1D",
    border: "1px solid rgba(74, 124, 126, 0.25)",
    shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
  },
};

export const animationTimings = {
  swift: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  ritual: "320ms cubic-bezier(0.4, 0, 0.2, 1)",
  pulse: "1600ms ease-in-out",
};

