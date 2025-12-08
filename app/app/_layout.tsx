/**
 * Root Layout with NavigationContainer
 */
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { TamaguiProvider, Theme } from "tamagui";
import { PaperProvider } from "react-native-paper";
import { Slot, SplashScreen } from "expo-router";

// Correctly import the local Tamagui config
import config from "../tamagui.config";

// Custom Theme Provider for app-wide theme context
import { ThemeProvider } from "../components/theme/ThemeProvider";

// Keep splash screen visible until resources are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load necessary fonts for Tamagui
  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (loaded) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Don't render anything until fonts are loaded
  if (!loaded) {
    return null;
  }

  return (
    // Outermost layer: Tamagui Provider with the correct config
    <TamaguiProvider config={config} defaultTheme="light">
      {/* Second layer: Paper Provider (for coexistence) */}
      <PaperProvider>
        {/* Third layer: Custom Theme Provider */}
        <ThemeProvider>
          {/* Slot renders the active child route */}
          <Slot />
        </ThemeProvider>
      </PaperProvider>
    </TamaguiProvider>
  );
}
