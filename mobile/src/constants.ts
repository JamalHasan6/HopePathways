export const API_BASE_URL = "http://localhost:3001";

export const DEMO_SESSION_ID = "mobile-demo-session";

export const MIN_CHECKIN_QUESTIONS = 3;
export const MAX_CHECKIN_QUESTIONS = 6;

export const INITIAL_MESSAGE =
  "Hi, I am really glad you are here. I am a support navigator with Hope Pathways from LMNSPN. How have you been feeling today, or what brought you here?";

// Matches frontend CSS variables
export const COLORS = {
  primary: "#3B5B7A",
  secondary: "#5FA8A0",
  accent: "#9BC1A3",
  warmAccent: "#E58C8A",
  background: "#F7F6F3",
  surface: "#EAEFF2",
  cardBackground: "#FFFFFF",
  textPrimary: "#253240",
  textSecondary: "#5B6773",
  success: "#6FAF8F",
  warning: "#D9A85F",
  crisisRed: "#B42318",
  // Legacy aliases used by some components
  primaryGreen: "#5FA8A0",
  darkTeal: "#3B5B7A",
  text: "#253240",
  mutedText: "#5B6773",
} as const;
