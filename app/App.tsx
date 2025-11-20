/**
 * MotionStory App Entry Point
 * Traditional React Navigation setup with Tamagui
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { TamaguiProvider, Text, View } from 'tamagui';
import RootNavigator from './src/navigation/RootNavigator';

// Import the local Tamagui config
import config from './tamagui.config';

export default function App() {
  // Load necessary fonts for Tamagui
  const [loaded, error] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  // Handle font loading state
  if (error) {
    // You can render a more specific error message here
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading fonts.</Text>
      </View>
    )
  }

  if (!loaded) {
    // Returning null or a loading indicator while fonts are loading
    return null;
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme="light">
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
