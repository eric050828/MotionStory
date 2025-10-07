/**
 * T129: Epic Celebration Animation
 * 史詩級慶祝動畫，結合煙火、閃光、最高等級慶祝效果
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { FireworksCelebration } from './FireworksCelebration';
import { ConfettiAnimation } from './ConfettiAnimation';

const { width, height } = Dimensions.get('window');

interface FlashProps {
  delay: number;
}

const Flash: React.FC<FlashProps> = ({ delay }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: delay }),
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 100 }),
          withTiming(0, { duration: 100 })
        ),
        3
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.flash, animatedStyle]} />;
};

interface StarBurstProps {
  delay: number;
  x: number;
  y: number;
}

const StarBurst: React.FC<StarBurstProps> = ({ delay, x, y }) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0, { duration: delay }),
      withTiming(2, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 200 })
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1
    );

    opacity.value = withSequence(
      withTiming(1, { duration: delay }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 200 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.starBurst,
        animatedStyle,
        {
          left: x,
          top: y,
        },
      ]}
    />
  );
};

interface EpicCelebrationProps {
  onComplete?: () => void;
  duration?: number;
}

export const EpicCelebration: React.FC<EpicCelebrationProps> = ({
  onComplete,
  duration = 5000,
}) => {
  const starBursts = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    delay: i * 400,
    x: Math.random() * width,
    y: Math.random() * height * 0.5,
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* 閃光效果 */}
      <Flash delay={0} />
      <Flash delay={800} />
      <Flash delay={1600} />

      {/* 星爆效果 */}
      {starBursts.map((burst) => (
        <StarBurst key={burst.id} {...burst} />
      ))}

      {/* 煙火效果 */}
      <FireworksCelebration duration={duration} />

      {/* 紙屑效果 */}
      <ConfettiAnimation duration={duration} count={80} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFD700',
  },
  starBurst: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
});
