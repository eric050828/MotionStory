import React, { useMemo } from "react";
import {
  Card,
  YStack,
  XStack,
  Text,
  View,
  Theme,
  Circle
} from "tamagui";
import {
  Clock,
  Zap,
  Target,
  Flag,
  MapPin,
  ChevronRight,
  Calendar
} from "@tamagui/lucide-icons";
import { TimelineEvent, TIMELINE_EVENT_COLORS } from "../../types/timeline";

interface TimelineEventCardProps {
  event: TimelineEvent;
  onPress: () => void;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  onPress,
}) => {
  // 解構顏色設定，如果沒有定義則使用預設值
  const colors = TIMELINE_EVENT_COLORS[event.type] || {
    bg: "$gray5",
    border: "$gray8",
    text: "$gray11"
  };

  // 渲染圖示邏輯
  const renderIcon = () => {
    const IconProps = { size: 18, color: colors.text };
    switch (event.type) {
      case "workout": return <Zap {...IconProps} />;
      case "achievement": return <Target {...IconProps} />;
      case "milestone": return <Flag {...IconProps} />;
      default: return <Calendar {...IconProps} />;
    }
  };

  // 格式化日期/時間顯示
  const dateObj = new Date(event.date);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Card
      // --- 容器樣式 ---
      bordered
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$background" // 使用系統背景色，而非事件顏色
      borderRadius="$4"
      padding={0} // 清除預設 padding，以便自定義佈局
      overflow="hidden" // 確保左側色條圓角正常

      // --- 陰影與立體感 ---
      elevation="$0.5"
      shadowColor="$shadowColor"
      shadowRadius={5}
      shadowOpacity={0.05}

      // --- 互動效果 ---
      animation="quick"
      pressStyle={{ scale: 0.98, backgroundColor: "$gray2", borderColor: "$gray5" }}
      onPress={onPress}
      marginBottom="$3"
    >
      <XStack>
        {/* 1. 左側裝飾色條 (Accent Bar) - 快速識別類型 */}
        <View width={5} backgroundColor={colors.text} opacity={0.8} />

        {/* 2. 主要內容區 */}
        <YStack flex={1} py="$3" px="$3.5" gap="$2">

          {/* 頂部 Header：圖示 + 標題 + 時間 */}
          <XStack alignItems="center" justifyContent="space-between">
            <XStack alignItems="center" gap="$2.5">
              {/* 圖示氣泡 (Icon Bubble) */}
              <Circle size={32} backgroundColor={colors.bg} opacity={0.5}>
                {renderIcon()}
              </Circle>

              <YStack>
                <Text fontSize="$4" fontWeight="800" color="$color" numberOfLines={1}>
                  {event.title}
                </Text>
                <Text fontSize="$1" fontWeight="600" color={colors.text} textTransform="uppercase" opacity={0.8}>
                  {event.type}
                </Text>
              </YStack>
            </XStack>

            {/* 右上角時間 */}
            <XStack alignItems="center" gap="$1" opacity={0.5}>
              <Clock size={12} />
              <Text fontSize="$2" fontWeight="500">
                {timeString}
              </Text>
            </XStack>
          </XStack>

          {/* 描述文字 */}
          {event.description && (
            <Text
              fontSize="$3"
              color="$gray11"
              lineHeight="$4"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {event.description}
            </Text>
          )}

          {/* 底部資訊 (地點或其他 Metadata) */}
          {/* 假設 event 有 location 屬性，這裡示範如何擴充 */}
          {/* @ts-ignore: 假設型別中有 location */}
          {event.location && (
            <XStack alignItems="center" gap="$1" mt="$1" opacity={0.7}>
              <MapPin size={12} color="$gray10" />
              <Text fontSize="$2" color="$gray10">
                {event.location}
              </Text>
            </XStack>
          )}
        </YStack>

        {/* 3. 右側引導箭頭 (Affordance) */}
        <View
          justifyContent="center"
          alignItems="center"
          pr="$3"
          opacity={0.3}
        >
          <ChevronRight size={20} color="$gray10" />
        </View>

      </XStack>
    </Card>
  );
};

export default TimelineEventCard;