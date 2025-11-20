import { createTamagui, createTheme } from "tamagui";
import { config as defaultConfig } from "@tamagui/config/v3";

// --- 1. Active Sporty Color Palette ---
const colors = {
  // Light mode base
  light1: "#f9fafb",
  light2: "#f1f5f9",
  light3: "#e2e8f0",
  light4: "#cbd5e1",
  light5: "#94a3b8",
  light12: "#0f172a",

  // Dark mode base (Sporty Midnight)
  night1: "#0b1220",
  night2: "#121a2b",
  night3: "#1c2738",
  night4: "#273446",
  night5: "#354457",
  nightText: "#f1f5f9",

  // Active Blue (Brand)
  activeBlue1: "#f0f8ff",
  activeBlue2: "#e6f0ff",
  activeBlue3: "#c7daff",
  activeBlue4: "#a8c4ff",
  activeBlue5: "#7eaaff",
  activeBlue6: "#4d8bff",
  activeBlue7: "#1f6aff",
  activeBlue8: "#0055ff",
  activeBlue9: "#0048db",
  activeBlue10: "#003bb7",

  // Energy Green
  energyGreen1: "#f0fff4",
  energyGreen6: "#21c860",
  energyGreen7: "#16b452",

  // Energy Orange
  energyOrange6: "#ff7e00",
};

// --- 2. Themes --- //

// Light Mode
const light_brand = createTheme({
  background: colors.light1,
  backgroundHover: colors.light2,
  backgroundPress: colors.light3,

  borderColor: colors.light4,
  color: colors.light12,

  shadowColor: colors.light5,

  // Active brand
  brand: colors.activeBlue8,
  brandHover: colors.activeBlue7,
  brandPress: colors.activeBlue9,

  success: colors.energyGreen6,
  highlight: colors.energyOrange6,
});

// Dark Mode
const dark_brand = createTheme({
  background: colors.night1,
  backgroundHover: colors.night2,
  backgroundPress: colors.night3,

  borderColor: colors.night4,
  color: colors.nightText,

  shadowColor: "#000",

  brand: colors.activeBlue5,
  brandHover: colors.activeBlue6,
  brandPress: colors.activeBlue7,

  success: colors.energyGreen6,
  highlight: colors.energyOrange6,
});

// --- 3. Create Config ---
const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens: {
    ...defaultConfig.tokens,
    color: {
      ...defaultConfig.tokens.color,
      ...colors,
    },
  },
  themes: {
    ...defaultConfig.themes,
    light_brand,
    dark_brand,
    light: light_brand,
    dark: dark_brand,
  },
});

export default tamaguiConfig;
export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}
