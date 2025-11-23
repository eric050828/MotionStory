import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type WorkoutStackParamList = {
  WorkoutList: undefined; // No parameters expected
  WorkoutDetail: { workoutId: string }; // Expects a workoutId parameter
  WorkoutForm: undefined; // No parameters expected
  WorkoutImport: undefined; // No parameters expected
};

export type ProfileStackParamList = {
  Settings: undefined;
  Export: undefined;
  Privacy: undefined;
  Profile: undefined;
  Notifications: undefined;
  Appearance: undefined;
  SyncStatus: undefined;
  Terms: undefined;
};

export type SettingsNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Settings'
>;

// You can add other navigator param lists here as needed
// export type AuthStackParamList = {
//   Login: undefined;
//   Register: undefined;
// };

// export type MainTabParamList = {
//   DashboardTab: undefined;
//   WorkoutTab: undefined;
//   TimelineTab: undefined;
//   ProfileTab: undefined;
// };
