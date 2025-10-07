/**
 * Root Layout with NavigationContainer
 * expo-router manages NavigationContainer automatically
 */

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from '../src/navigation/RootNavigator';

export default function RootLayout() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <RootNavigator />
    </NavigationContainer>
  );
}
