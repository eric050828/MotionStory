/**
 * T163: MainNavigator
 * Main app navigation with tab and stack navigation
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Dashboard Stack
import DashboardStudioScreen from '../screens/dashboard/DashboardStudioScreen';
import WidgetPickerScreen from '../screens/dashboard/WidgetPickerScreen';
import DragDropEditorScreen from '../screens/dashboard/DragDropEditorScreen';

// Workout Stack
import WorkoutListScreen from '../screens/workouts/WorkoutListScreen';
import WorkoutDetailScreen from '../screens/workouts/WorkoutDetailScreen';
import { WorkoutFormScreen } from '../screens/WorkoutFormScreen';
import WorkoutImportScreen from '../screens/workouts/WorkoutImportScreen';

// Timeline Stack
import TimelineScreen from '../screens/timeline/TimelineScreen';

// Profile Stack
import SettingsScreen from '../screens/profile/SettingsScreen';

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
      options={{ title: '儀表板' }}
    />
    <DashboardStack.Screen
      name="WidgetPicker"
      component={WidgetPickerScreen}
      options={{ title: 'Widget 選擇' }}
    />
    <DashboardStack.Screen
      name="DragDropEditor"
      component={DragDropEditorScreen}
      options={{ title: '佈局編輯' }}
    />
  </DashboardStack.Navigator>
);

// Workout Stack Navigator
const WorkoutNavigator = () => (
  <WorkoutStack.Navigator>
    <WorkoutStack.Screen
      name="WorkoutList"
      component={WorkoutListScreen}
      options={{ title: '運動記錄' }}
    />
    <WorkoutStack.Screen
      name="WorkoutDetail"
      component={WorkoutDetailScreen}
      options={{ title: '運動詳情' }}
    />
    <WorkoutStack.Screen
      name="WorkoutForm"
      component={WorkoutFormScreen}
      options={{ title: '新增運動' }}
    />
    <WorkoutStack.Screen
      name="WorkoutImport"
      component={WorkoutImportScreen}
      options={{ title: '匯入運動' }}
    />
  </WorkoutStack.Navigator>
);

// Timeline Stack Navigator
const TimelineNavigator = () => (
  <TimelineStack.Navigator>
    <TimelineStack.Screen
      name="Timeline"
      component={TimelineScreen}
      options={{ title: '時間軸' }}
    />
  </TimelineStack.Navigator>
);

// Profile Stack Navigator
const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: '設定' }}
    />
  </ProfileStack.Navigator>
);

// Tab Icon Component
const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
);

// Main Tab Navigator
const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
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
          title: '儀表板',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="WorkoutTab"
        component={WorkoutNavigator}
        options={{
          title: '運動',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏃" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TimelineTab"
        component={TimelineNavigator}
        options={{
          title: '時間軸',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          title: '個人',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
