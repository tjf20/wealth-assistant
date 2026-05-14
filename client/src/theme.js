// client/src/theme.js
// Single source of truth for all color tokens.
// DARK and LIGHT are compatible with the C-object keys
// used in all existing components (MyClientsView, ProjectCenterView, etc.)

import { createContext, useContext } from "react";

export const DARK = {
  // Backgrounds
  bg:           "#0a0b0d",
  sidebar:      "#0f1014",
  topbar:       "#0c0d11",
  surface:      "#13151e",
  surface2:     "#181a22",

  // Borders
  border:       "#1e2029",
  border2:      "#2a2d3a",

  // Text
  text:         "#e8e9eb",
  textMid:      "#dde0f0",
  textMuted:    "#aab0c8",
  textDim:      "#8a8fa8",
  textHint:     "#5a5d6a",

  // Blue / accent (aliases for legacy C.blue usage)
  blue:         "#3a7de9",
  blueDark:     "#7db8ff",
  blueBg:       "#152640",
  blueBorder:   "#2a4a8a",
  // also exposed as accent for new code
  accent:       "#3a7de9",
  accentBg:     "#152640",
  accentBorder: "#2a4a8a",
  accentText:   "#7db8ff",

  // Teal
  teal:         "#2dbe8a",
  tealBg:       "#0a2820",
  tealBorder:   "#1a6a50",

  // Amber
  amber:        "#d08020",
  amberText:    "#e09040",
  amberBg:      "#2a1800",
  amberBorder:  "#5a3a10",

  // Purple
  purple:       "#7a5aed",
  purpleBg:     "#180f30",
  purpleBorder: "#4a3080",
  purpleText:   "#a882ff",

  // Coral
  coral:        "#e06030",
  coralBg:      "#221008",
  coralBorder:  "#6a3020",
  coralText:    "#f07850",

  // Danger
  danger:       "#e06030",
  dangerBg:     "#221008",
  dangerBorder: "#6a3020",

  // Nav
  navBg:        "#0f1014",
  navActive:    "#152640",
  navActiveTxt: "#7db8ff",
  navTxt:       "#aab0c8",
  navHover:     "#181a22",
  navSection:   "#5a5d6a",

  // Scope badges
  bookBg:       "#152640", bookText: "#7db8ff", bookBorder: "#2a4a8a",
  indBg:        "#0a2820", indText:  "#2dbe8a", indBorder:  "#1a6a50",

  // Schedule form
  scheduleBg: "#152640", scheduleBorder: "#2a4a8a", scheduleTitle: "#7db8ff",
};

export const LIGHT = {
  // Backgrounds
  bg:           "#F0F4FA",
  sidebar:      "#1B3356",
  topbar:       "#ffffff",
  surface:      "#ffffff",
  surface2:     "#F8FAFC",

  // Borders
  border:       "#E2E8F0",
  border2:      "#CBD5E1",

  // Text
  text:         "#0F172A",
  textMid:      "#1E293B",
  textMuted:    "#475569",
  textDim:      "#64748B",
  textHint:     "#94A3B8",

  // Blue / accent
  blue:         "#2563EB",
  blueDark:     "#1D4ED8",
  blueBg:       "#EFF6FF",
  blueBorder:   "#BFDBFE",
  accent:       "#2563EB",
  accentBg:     "#EFF6FF",
  accentBorder: "#BFDBFE",
  accentText:   "#2563EB",

  // Teal
  teal:         "#0D9488",
  tealBg:       "#F0FDFA",
  tealBorder:   "#99F6E4",

  // Amber
  amber:        "#D97706",
  amberText:    "#C2410C",
  amberBg:      "#FFF7ED",
  amberBorder:  "#FED7AA",

  // Purple
  purple:       "#7C3AED",
  purpleBg:     "#F5F3FF",
  purpleBorder: "#DDD6FE",
  purpleText:   "#6D28D9",

  // Coral
  coral:        "#DC2626",
  coralBg:      "#FEF2F2",
  coralBorder:  "#FECACA",
  coralText:    "#B91C1C",

  // Danger
  danger:       "#DC2626",
  dangerBg:     "#FEF2F2",
  dangerBorder: "#FECACA",

  // Nav (sidebar stays dark)
  navBg:        "#1B3356",
  navActive:    "rgba(255,255,255,0.15)",
  navActiveTxt: "#ffffff",
  navTxt:       "rgba(255,255,255,0.55)",
  navHover:     "rgba(255,255,255,0.08)",
  navSection:   "rgba(255,255,255,0.3)",

  // Scope badges
  bookBg:   "#EFF6FF", bookText: "#1D4ED8", bookBorder: "#BFDBFE",
  indBg:    "#F0FDF4", indText:  "#15803D", indBorder:  "#BBF7D0",

  // Schedule form
  scheduleBg: "#EFF6FF", scheduleBorder: "#BFDBFE", scheduleTitle: "#1E3A8A",
};

export const ThemeContext = createContext(DARK);
export const useTheme = () => useContext(ThemeContext);
