/**
 * Design Tokens - Notion-inspired Design System
 * Configuration centralisée pour cohérence visuelle globale
 */

export const colors = {
  // Brand & Primary
  primary: "#7c3aed", // Purple - Primary CTA
  primaryPressed: "#6d28d9",
  primaryDeep: "#5b21b6",
  
  // Navy Hero Band
  brandNavy: "#1a1f35",
  brandNavyDeep: "#0f1419",
  brandNavyMid: "#2d3142",
  
  // Link & Secondary
  linkBlue: "#0084ff",
  linkBluePressed: "#0066cc",
  
  // Brand Spectrum
  brandPink: "#ec4899",
  brandPinkDeep: "#be185d",
  brandOrange: "#f97316",
  brandOrangeDeep: "#c2410c",
  brandTeal: "#0891b2",
  brandGreen: "#16a34a",
  brandYellow: "#eab308",
  brandBrown: "#92400e",
  
  // Card Tints
  cardTintPeach: "#fde8dc",
  cardTintRose: "#ffe0ec",
  cardTintMint: "#dcfce7",
  cardTintLavender: "#ede9fe",
  cardTintSky: "#e0f2fe",
  cardTintYellow: "#fef08a",
  cardTintYellowBold: "#fef3c7",
  cardTintCream: "#fef5e7",
  cardTintGray: "#f3f4f6",
  
  // Surface & Base
  canvas: "#ffffff",
  surface: "#f9fafb",
  surfaceSoft: "#f3f4f6",
  hairline: "#e5e7eb",
  hairlineStrong: "#d1d5db",
  hairlineSoft: "#f0f0f0",
  
  // Text & Semantic
  inkDeep: "#000000",
  ink: "#1a1a1a",
  charcoal: "#4b5563", // Warm charcoal
  slate: "#6b7280",
  steel: "#9ca3af",
  stone: "#d1d5db",
  muted: "#e5e7eb",
  onDark: "#ffffff",
  onDarkMuted: "rgba(255, 255, 255, 0.7)",
  
  // Semantic
  semanticSuccess: "#10b981",
  semanticWarning: "#f59e0b",
  semanticError: "#ef4444",
};

export const typography = {
  fontFamily: {
    primary: "'Segoe UI', 'Helvetica Neue', system-ui, -apple-system, sans-serif",
  },
  sizes: {
    heroDisplay: {
      fontSize: "80px",
      fontWeight: 600,
      lineHeight: 1.05,
      letterSpacing: "-2px",
    },
    displayLg: {
      fontSize: "56px",
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: "-1px",
    },
    heading1: {
      fontSize: "48px",
      fontWeight: 600,
      lineHeight: 1.15,
      letterSpacing: "-0.5px",
    },
    heading2: {
      fontSize: "36px",
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: "-0.5px",
    },
    heading3: {
      fontSize: "28px",
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: "0",
    },
    heading4: {
      fontSize: "22px",
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: "0",
    },
    heading5: {
      fontSize: "18px",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0",
    },
    subtitle: {
      fontSize: "18px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    bodyMd: {
      fontSize: "16px",
      fontWeight: 400,
      lineHeight: 1.55,
      letterSpacing: "0",
    },
    bodyMdMedium: {
      fontSize: "16px",
      fontWeight: 500,
      lineHeight: 1.55,
      letterSpacing: "0",
    },
    bodySm: {
      fontSize: "14px",
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    bodySmMedium: {
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: "0",
    },
    captionBold: {
      fontSize: "13px",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "0",
    },
    buttonMd: {
      fontSize: "14px",
      fontWeight: 500,
      lineHeight: 1.3,
      letterSpacing: "0",
    },
  },
};

export const spacing = {
  xxs: "4px",
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  sectionSm: "48px",
  section: "64px",
  sectionLg: "96px",
  hero: "120px",
};

export const borderRadius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  xxl: "20px",
  xxxl: "24px",
  full: "9999px",
};

export const shadows = {
  none: "none",
  subtle: "rgba(15, 15, 15, 0.04) 0px 1px 2px 0px",
  card: "rgba(15, 15, 15, 0.08) 0px 4px 12px 0px",
  mockup: "rgba(15, 15, 15, 0.20) 0px 24px 48px -8px",
  modal: "rgba(15, 15, 15, 0.16) 0px 16px 48px -8px",
};

export const lightingPresets = {
  // Éclairage Apple Studio - sophistiqué et propre
  appleStudio: {
    ambient: {
      intensity: 0.4,
      color: "#f0f0f2",
    },
    key: {
      position: [5, 8, 5],
      intensity: 0.75,
      color: "#fffbe8", // Warmth subtile
    },
    fill: {
      position: [-3, 4, -2],
      intensity: 0.5,
      color: "#e8f4f8", // Cool accent
    },
    rim: {
      position: [0, 2, -6],
      intensity: 0.4,
      color: "#b8e0ff", // Blue rim
    },
  },
};

// Utilities
export const getColorVar = (colorName: keyof typeof colors): string => {
  return colors[colorName];
};

export const getCSSVariable = (token: string): string => {
  return `var(--token-${token})`;
};
