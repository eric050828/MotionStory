/**
 * Tabs Layout
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Bottom tab navigation with shadcn-style theming, animations, and haptic feedback.
 */

import { Tabs } from 'expo-router'
import { Text, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../../components/theme/useTheme'
import { TabBarIcon } from '../../components/ui/TabBarIcon'

export default function TabLayout() {
  const { theme } = useTheme()

  // Trigger haptic feedback on tab press
  const handleTabPress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else if (Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tokens.colors.primary,
        tabBarInactiveTintColor: theme.tokens.colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.tokens.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.tokens.colors.border,
          paddingBottom: theme.tokens.spacing.sm,
          paddingTop: theme.tokens.spacing.sm,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: theme.tokens.typography.fontSize.xs,
          fontWeight: theme.tokens.typography.fontWeight.medium as any,
          fontFamily: theme.tokens.typography.fontFamily.regular,
        },
        tabBarItemStyle: {
          paddingVertical: theme.tokens.spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '儀表板',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={<Text style={{ fontSize: 24 }}>📊</Text>}
              focused={focused}
              accessibilityLabel="儀表板"
              testID="tab-icon-dashboard"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: '運動',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={<Text style={{ fontSize: 24 }}>🏃</Text>}
              focused={focused}
              accessibilityLabel="運動"
              testID="tab-icon-workout"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: '時間軸',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={<Text style={{ fontSize: 24 }}>📅</Text>}
              focused={focused}
              accessibilityLabel="時間軸"
              testID="tab-icon-timeline"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: '社群',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={<Text style={{ fontSize: 24 }}>👥</Text>}
              focused={focused}
              accessibilityLabel="社群"
              testID="tab-icon-social"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '個人',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={<Text style={{ fontSize: 24 }}>👤</Text>}
              focused={focused}
              accessibilityLabel="個人"
              testID="tab-icon-profile"
            />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  )
}
