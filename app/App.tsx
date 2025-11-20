/**
 * MotionStory App Entry Point
 * Traditional React Navigation setup with Tamagui
 */

import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { TamaguiProvider, Theme, Text, View } from 'tamagui';
import RootNavigator from './src/navigation/RootNavigator';

// Import the local Tamagui config
import config from './tamagui.config';

export default function App() {
  const colorScheme = useColorScheme();

  // Load necessary fonts for Tamagui
  const [loaded, error] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  });

  // Handle font loading state
  if (error) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Text>Error loading fonts: {error.message}</Text>
      </View>
    );
  }

  if (!loaded) {
    return null; // Or a custom loading component
  }

  return (
    <SafeAreaProvider>
      <TamaguiProvider
        config={config}
        defaultTheme={colorScheme === 'dark' ? 'dark_brand' : 'light_brand'}
      >
        <Theme name={colorScheme === 'dark' ? 'dark_brand' : 'light_brand'}>
          <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </NavigationContainer>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
