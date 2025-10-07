/**
 * T128: Confetti Animation
 * 紙屑慶祝動畫，用於一般成就慶祝
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ConfettiPieceProps {
  delay: number;
  x: number;
  color: string;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ delay, x, color }) => {
  const translateY = useSharedValue(-20);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(height + 20, {
      duration: 2500 + Math.random() * 1000,
      easing: Easing.linear,
    });

    rotate.value = withRepeat(
      withTiming(360, {
        duration: 1000 + Math.random() * 500,
        easing: Easing.linear,
      }),
      -1
    );

    opacity.value = withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 2000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        animatedStyle,
        {
          left: x,
          backgroundColor: color,
        },
      ]}
    />
  );
};

interface ConfettiAnimationProps {
  onComplete?: () => void;
  duration?: number;
  count?: number;
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  onComplete,
  duration = 3000,
  count = 50,
}) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#A8E6CF', '#95E1D3'];

  const confettiPieces = Array.from({ length: count }, (_, i) => ({
    id: i,
    delay: (i * duration) / count,
    x: Math.random() * width,
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
      {confettiPieces.map((piece) => (
        <ConfettiPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
