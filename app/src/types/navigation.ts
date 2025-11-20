export type WorkoutStackParamList = {
  WorkoutList: undefined; // No parameters expected
  WorkoutDetail: { workoutId: string }; // Expects a workoutId parameter
  WorkoutForm: undefined; // No parameters expected
  WorkoutImport: undefined; // No parameters expected
};

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
