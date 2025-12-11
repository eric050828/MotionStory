/**
 * User Profile Route
 * Expo Router dynamic route for user profiles
 */

import { useLocalSearchParams } from 'expo-router';
import UserProfileScreen from '../../src/screens/social/UserProfileScreen';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Pass userId to the screen via route params
  // The screen will use useRoute to get the userId
  return <UserProfileScreen />;
}
