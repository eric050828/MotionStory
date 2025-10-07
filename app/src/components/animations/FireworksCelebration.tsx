/**
 * T127: Fireworks Celebration Animation
 * 煙火慶祝動畫，用於重大成就慶祝
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface FireworkProps {
  delay: number;
  x: number;
  y: number;
  color: string;
}

const Firework: React.FC<FireworkProps> = ({ delay, x, y, color }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
        withTiming(1.5, { duration: 300 })
      )
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 300 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.firework,
        animatedStyle,
        {
          left: x,
          top: y,
          backgroundColor: color,
        },
      ]}
    />
  );
};

interface FireworksCelebrationProps {
  onComplete?: () => void;
  duration?: number;
}

export const FireworksCelebration: React.FC<FireworksCelebrationProps> = ({
  onComplete,
  duration = 3000,
}) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#A8E6CF'];
  const fireworksCount = 8;

  const fireworks = Array.from({ length: fireworksCount }, (_, i) => ({
    id: i,
    delay: (i * duration) / fireworksCount,
    x: Math.random() * width,
    y: Math.random() * (height * 0.6),
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {fireworks.map((firework) => (
        <Firework key={firework.id} {...firework} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  firework: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});
