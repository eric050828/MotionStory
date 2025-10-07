/**
 * T130: ProgressWidget
 * 進度環 Widget，顯示目標完成進度
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { WidgetContainer } from './WidgetContainer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressWidgetProps {
  title?: string;
  metric: 'distance' | 'duration' | 'calories' | 'workouts';
  currentValue: number;
  goalValue: number;
  unit?: string;
  icon?: string;
}

const METRIC_CONFIG = {
  distance: { label: '距離', unit: 'km', icon: '🏃' },
  duration: { label: '時長', unit: 'min', icon: '⏱️' },
  calories: { label: '卡路里', unit: 'kcal', icon: '🔥' },
  workouts: { label: '運動次數', unit: '次', icon: '💪' },
};

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  title,
  metric,
  currentValue,
  goalValue,
  unit,
  icon,
}) => {
  const progress = useSharedValue(0);
  const percentage = Math.min((currentValue / goalValue) * 100, 100);

  const config = METRIC_CONFIG[metric];
  const displayUnit = unit || config.unit;
  const displayIcon = icon || config.icon;
  const displayTitle = title || `${config.label}進度`;

  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    progress.value = withTiming(percentage / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <WidgetContainer title={displayTitle} icon={displayIcon}>
      <View style={styles.container}>
        <View style={styles.progressRing}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E5EA"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#007AFF"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              animatedProps={animatedProps}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.progressText}>
            <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
            <Text style={styles.values}>
              {currentValue.toFixed(1)} / {goalValue.toFixed(1)}
            </Text>
            <Text style={styles.unit}>{displayUnit}</Text>
          </View>
        </View>
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  progressRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  values: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  unit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
