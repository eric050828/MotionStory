/**
 * Celebration Animation Component
 * 成就達成慶祝動畫 (基礎、煙火、史詩級)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { Button } from './Button';

const { width, height } = Dimensions.get('window');

type CelebrationLevel = 'basic' | 'fireworks' | 'epic';

interface CelebrationAnimationProps {
  visible: boolean;
  level: CelebrationLevel;
  title: string;
  description: string;
  onClose: () => void;
}

export const CelebrationAnimation: React.FC<CelebrationAnimationProps> = ({
  visible,
  level,
  title,
  description,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      rotateAnim.setValue(0);

      // Start animations based on level
      if (level === 'basic') {
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (level === 'fireworks') {
        Animated.parallel([
          Animated.sequence([
            Animated.spring(scaleAnim, {
              toValue: 1.2,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start();
      } else if (level === 'epic') {
        Animated.parallel([
          Animated.sequence([
            Animated.spring(scaleAnim, {
              toValue: 1.5,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.loop(
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            })
          ).start(),
        ]).start();
      }
    }
  }, [visible, level]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getEmoji = (): string => {
    switch (level) {
      case 'basic':
        return '✨';
      case 'fireworks':
        return '🎉';
      case 'epic':
        return '🏆';
      default:
        return '🎊';
    }
  };

  const getBackgroundColor = (): string => {
    switch (level) {
      case 'basic':
        return 'rgba(0, 122, 255, 0.95)';
      case 'fireworks':
        return 'rgba(255, 59, 48, 0.95)';
      case 'epic':
        return 'rgba(255, 149, 0, 0.95)';
      default:
        return 'rgba(0, 0, 0, 0.95)';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: level === 'epic' ? spin : '0deg' },
              ],
            },
          ]}
        >
          <Text style={styles.emoji}>{getEmoji()}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </Animated.View>

        <View style={styles.buttonContainer}>
          <Button
            title="太棒了！"
            onPress={onClose}
            variant="outline"
            style={styles.button}
            textStyle={styles.buttonText}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 80,
  },
  emoji: {
    fontSize: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 32,
    opacity: 0.9,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
  },
  button: {
    borderColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
