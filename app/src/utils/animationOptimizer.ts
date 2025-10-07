/**
 * Animation performance optimizer
 * Implements best practices for React Native Reanimated and native animations
 */
import { useEffect, useRef } from 'react';
import { Animated, InteractionManager, Platform } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';

/**
 * Animation performance configuration
 */
export const AnimationConfig = {
  // Use native driver whenever possible
  useNativeDriver: true,

  // Spring animations (natural feel)
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Timing animations (precise control)
  timing: {
    duration: 300,
    useNativeDriver: true,
  },

  // Reduce motion for accessibility
  reduceMotion: false,
};

/**
 * Check if device should use reduced motion
 */
export function shouldReduceMotion(): boolean {
  // This should be tied to system accessibility settings
  // For now, use a simple check
  return AnimationConfig.reduceMotion;
}

/**
 * Optimized animated value hook with native driver
 */
export function useOptimizedAnimatedValue(initialValue: number = 0) {
  const animatedValue = useRef(new Animated.Value(initialValue)).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      animatedValue.stopAnimation();
    };
  }, []);

  return animatedValue;
}

/**
 * Optimized spring animation with native driver
 */
export function animateSpring(
  animatedValue: Animated.Value,
  toValue: number,
  config?: Partial<typeof AnimationConfig.spring>,
  onComplete?: () => void
) {
  if (shouldReduceMotion()) {
    animatedValue.setValue(toValue);
    onComplete?.();
    return;
  }

  Animated.spring(animatedValue, {
    toValue,
    ...AnimationConfig.spring,
    ...config,
    useNativeDriver: AnimationConfig.useNativeDriver,
  }).start(onComplete);
}

/**
 * Optimized timing animation with native driver
 */
export function animateTiming(
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = AnimationConfig.timing.duration,
  onComplete?: () => void
) {
  if (shouldReduceMotion()) {
    animatedValue.setValue(toValue);
    onComplete?.();
    return;
  }

  Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: AnimationConfig.useNativeDriver,
  }).start(onComplete);
}

/**
 * Reanimated worklet optimizer
 * Use for complex animations that need to run on UI thread
 */
export function useWorkletAnimation(initialValue: number = 0) {
  const progress = useSharedValue(initialValue);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: progress.value }],
    };
  });

  const animate = (toValue: number, onComplete?: () => void) => {
    'worklet';

    if (shouldReduceMotion()) {
      progress.value = toValue;
      if (onComplete) {
        runOnJS(onComplete)();
      }
      return;
    }

    progress.value = withSpring(toValue, AnimationConfig.spring, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  };

  const animateWithTiming = (toValue: number, duration?: number, onComplete?: () => void) => {
    'worklet';

    if (shouldReduceMotion()) {
      progress.value = toValue;
      if (onComplete) {
        runOnJS(onComplete)();
      }
      return;
    }

    progress.value = withTiming(
      toValue,
      { duration: duration || AnimationConfig.timing.duration },
      (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }
    );
  };

  const cancel = () => {
    'worklet';
    cancelAnimation(progress);
  };

  return {
    progress,
    animatedStyle,
    animate,
    animateWithTiming,
    cancel,
  };
}

/**
 * Delay animations until after interactions complete
 * Prevents janky animations during navigation or user interactions
 */
export function useInteractionAnimation(
  animationFn: () => void,
  dependencies: any[] = []
) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      animationFn();
    });

    return () => task.cancel();
  }, dependencies);
}

/**
 * FPS Monitor for debugging animation performance
 */
export class FPSMonitor {
  private frameCount = 0;
  private lastTime = Date.now();
  private fps = 60;
  private rafId: number | null = null;
  private onFPSUpdate?: (fps: number) => void;

  start(onFPSUpdate?: (fps: number) => void) {
    this.onFPSUpdate = onFPSUpdate;
    this.lastTime = Date.now();
    this.frameCount = 0;
    this.tick();
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = () => {
    this.frameCount++;
    const now = Date.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.onFPSUpdate?.(this.fps);

      this.frameCount = 0;
      this.lastTime = now;
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  getCurrentFPS(): number {
    return this.fps;
  }
}

/**
 * Component update optimizer
 * Use with React.memo and custom comparison
 */
export function shouldComponentUpdate<T extends Record<string, any>>(
  prevProps: T,
  nextProps: T,
  keysToCompare?: (keyof T)[]
): boolean {
  if (keysToCompare) {
    return keysToCompare.some(key => prevProps[key] !== nextProps[key]);
  }

  // Shallow comparison of all props
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return true;
  }

  return prevKeys.some(key => prevProps[key] !== nextProps[key]);
}

/**
 * Gesture handler optimizer
 * Debounce rapid gesture events
 */
export function useGestureDebounce(
  handler: (...args: any[]) => void,
  delay: number = 16 // ~60fps
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  const debouncedHandler = (...args: any[]) => {
    const now = Date.now();

    if (now - lastCallRef.current >= delay) {
      handler(...args);
      lastCallRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        handler(...args);
        lastCallRef.current = Date.now();
      }, delay);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedHandler;
}

/**
 * Layout animation optimizer
 * Use for list insertions/deletions
 */
export const LayoutAnimationConfig = {
  duration: 300,
  create: {
    type: 'linear' as const,
    property: 'opacity' as const,
  },
  update: {
    type: 'spring' as const,
    springDamping: 0.7,
  },
  delete: {
    type: 'linear' as const,
    property: 'opacity' as const,
  },
};

/**
 * Animation performance guidelines
 */
export const PerformanceGuidelines = {
  /**
   * 1. ALWAYS use useNativeDriver when animating transform and opacity
   */
  useNativeDriver: true,

  /**
   * 2. Avoid animating layout properties (width, height, padding, margin)
   * These force layout recalculation on every frame
   */
  avoidLayoutAnimations: [
    'width',
    'height',
    'padding',
    'margin',
    'top',
    'left',
    'right',
    'bottom',
  ],

  /**
   * 3. Use transform instead of absolute positioning
   */
  preferTransform: true,

  /**
   * 4. Run complex calculations in worklets (Reanimated)
   */
  useWorklets: true,

  /**
   * 5. Delay animations until after interactions
   */
  delayAfterInteractions: true,

  /**
   * 6. Cancel animations on component unmount
   */
  cancelOnUnmount: true,

  /**
   * 7. Use shouldComponentUpdate/React.memo to prevent unnecessary re-renders
   */
  optimizeRenders: true,

  /**
   * 8. Monitor FPS in development
   */
  monitorFPS: __DEV__,
};

/**
 * Celebration animation optimizer
 * Optimized for achievement celebrations
 */
export function useCelebrationAnimation() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  const celebrate = (onComplete?: () => void) => {
    'worklet';

    if (shouldReduceMotion()) {
      scale.value = 1;
      opacity.value = 1;
      if (onComplete) {
        runOnJS(onComplete)();
      }
      return;
    }

    // Sequence: scale up -> rotate -> fade out
    scale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, AnimationConfig.spring)
    );

    rotation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );

    opacity.value = withTiming(1, { duration: 200 }, (finished) => {
      if (finished) {
        // Hold for a moment, then fade out
        opacity.value = withTiming(
          0,
          { duration: 300 },
          (fadeFinished) => {
            if (fadeFinished && onComplete) {
              runOnJS(onComplete)();
            }
          }
        );
      }
    });
  };

  const reset = () => {
    'worklet';
    scale.value = 0;
    opacity.value = 0;
    rotation.value = 0;
  };

  return {
    animatedStyle,
    celebrate,
    reset,
  };
}

/**
 * Performance monitoring utilities
 */
export const PerformanceMonitor = {
  fpsMonitor: new FPSMonitor(),

  startMonitoring(onFPSUpdate?: (fps: number) => void) {
    if (__DEV__) {
      this.fpsMonitor.start(onFPSUpdate);
    }
  },

  stopMonitoring() {
    this.fpsMonitor.stop();
  },

  getCurrentFPS() {
    return this.fpsMonitor.getCurrentFPS();
  },

  logPerformanceWarning(component: string, fps: number) {
    if (fps < 50) {
      console.warn(
        `Performance warning in ${component}: FPS dropped to ${fps}`
      );
    }
  },
};

/**
 * Best practices summary:
 *
 * 1. Use useNativeDriver for transform/opacity animations
 * 2. Avoid animating layout properties (width, height, etc.)
 * 3. Use Reanimated worklets for complex animations
 * 4. Delay animations with InteractionManager
 * 5. Cancel animations on unmount
 * 6. Use React.memo and shouldComponentUpdate
 * 7. Monitor FPS in development
 * 8. Respect reduced motion accessibility setting
 * 9. Debounce rapid gesture events
 * 10. Use LayoutAnimation for list changes
 */
