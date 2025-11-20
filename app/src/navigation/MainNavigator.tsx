/**
 * T163: MainNavigator
 * Main app navigation with tab and stack navigation
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "tamagui";
import {
  LayoutDashboard,
  Footprints,
  CalendarDays,
  User,
} from "@tamagui/lucide-icons";

// Dashboard Stack
import DashboardStudioScreen from "../screens/dashboard/DashboardStudioScreen";
import WidgetPickerScreen from "../screens/dashboard/WidgetPickerScreen";
import DragDropEditorScreen from "../screens/dashboard/DragDropEditorScreen";

// Workout Stack
import WorkoutListScreen from "../screens/workouts/WorkoutListScreen";
import WorkoutDetailScreen from "../screens/workouts/WorkoutDetailScreen";
import { WorkoutFormScreen } from "../screens/WorkoutFormScreen";
import WorkoutImportScreen from "../screens/workouts/WorkoutImportScreen";

// Timeline Stack
import TimelineScreen from "../screens/timeline/TimelineScreen";

// Profile Stack
import SettingsScreen from "../screens/profile/SettingsScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const WorkoutStack = createNativeStackNavigator();
const TimelineStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Dashboard Stack Navigator
const DashboardNavigator = () => (
  <DashboardStack.Navigator>
    <DashboardStack.Screen
      name="DashboardStudio"
      component={DashboardStudioScreen}
      options={{ title: "儀表板" }}
    />
    <DashboardStack.Screen
      name="WidgetPicker"
      component={WidgetPickerScreen}
      options={{ title: "Widget 選擇" }}
    />
    <DashboardStack.Screen
      name="DragDropEditor"
      component={DragDropEditorScreen}
      options={{ title: "佈局編輯" }}
    />
  </DashboardStack.Navigator>
);

// Workout Stack Navigator
const WorkoutNavigator = () => (
  <WorkoutStack.Navigator>
    <WorkoutStack.Screen
      name="WorkoutList"
      component={WorkoutListScreen}
      options={{ title: "運動記錄" }}
    />
    <WorkoutStack.Screen
      name="WorkoutDetail"
      component={WorkoutDetailScreen}
      options={{ title: "運動詳情" }}
    />
    <WorkoutStack.Screen
      name="WorkoutForm"
      component={WorkoutFormScreen}
      options={{ title: "新增運動" }}
    />
    <WorkoutStack.Screen
      name="WorkoutImport"
      component={WorkoutImportScreen}
      options={{ title: "匯入運動" }}
    />
  </WorkoutStack.Navigator>
);

// Timeline Stack Navigator
const TimelineNavigator = () => (
  <TimelineStack.Navigator>
    <TimelineStack.Screen
      name="Timeline"
      component={TimelineScreen}
      options={{ title: "時間軸" }}
    />
  </TimelineStack.Navigator>
);

// Profile Stack Navigator
const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: "設定" }}
    />
  </ProfileStack.Navigator>
);

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.brand.val,
        tabBarInactiveTintColor: theme.color10?.val,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopWidth: 1,
          borderTopColor: theme.borderColor.val,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardNavigator}
        options={{
          // title: "儀表板",
          title: "",
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size * 0.9} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutNavigator}
        options={{
          // title: "運動",
          title: "",
          tabBarIcon: ({ color, size }) => (
            <Footprints color={color} size={size * 0.9} />
          ),
        }}
      />
      <Tab.Screen
        name="TimelineTab"
        component={TimelineNavigator}
        options={{
          // title: "時間軸",
          title: "",
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size * 0.9} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          // title: "個人",
          title: "",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size * 0.9} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
