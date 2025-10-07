/**
 * T139: WidgetContainer
 * Widget 包裝容器，提供統一的樣式和佈局
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Card } from '../Card';

interface WidgetContainerProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
  onPress?: () => void;
  onSettings?: () => void;
  style?: ViewStyle;
}

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  children,
  icon,
  onPress,
  onSettings,
  style,
}) => {
  return (
    <Card onPress={onPress} style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {onSettings && (
          <TouchableOpacity onPress={onSettings} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.content}>{children}</View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingsIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
});
