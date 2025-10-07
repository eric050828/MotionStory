/**
 * T141: DraggableWidget
 * 可拖拉的 Widget 容器，支援長按拖拉重新排序
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { WidgetContainer } from './WidgetContainer';

interface DraggableWidgetProps {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onSettingsPress?: () => void;
  style?: ViewStyle;
  draggable?: boolean;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
  id,
  title,
  icon,
  children,
  onDragStart,
  onDragEnd,
  onSettingsPress,
  style,
  draggable = true,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const handleLongPress = (event: any) => {
    if (!draggable) return;

    if (event.nativeEvent.state === State.ACTIVE) {
      isDragging.value = true;
      scale.value = withSpring(1.05);
      if (onDragStart) {
        runOnJS(onDragStart)(id);
      }
    }
  };

  const panGestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      if (!isDragging.value) return;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      if (!isDragging.value) return;
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event) => {
      if (!isDragging.value) return;

      const finalX = translateX.value;
      const finalY = translateY.value;

      // 重置位置
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      isDragging.value = false;

      if (onDragEnd) {
        runOnJS(onDragEnd)(id, finalX, finalY);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 999 : 1,
    opacity: isDragging.value ? 0.9 : 1,
  }));

  return (
    <LongPressGestureHandler
      onHandlerStateChange={handleLongPress}
      minDurationMs={500}
      enabled={draggable}
    >
      <Animated.View>
        <PanGestureHandler
          onGestureEvent={panGestureHandler}
          enabled={draggable}
        >
          <Animated.View style={[animatedStyle, style]}>
            <WidgetContainer
              title={title}
              icon={icon}
              onSettings={onSettingsPress}
            >
              {children}
            </WidgetContainer>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </LongPressGestureHandler>
  );
};

const styles = StyleSheet.create({
  // 暫時不需要額外樣式，因為大部分樣式在 WidgetContainer 中
});
