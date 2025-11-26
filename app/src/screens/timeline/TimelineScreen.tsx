import React, { useEffect, useCallback } from "react";
import { FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { YStack, XStack, Text, View, Circle, Button, Spinner } from "tamagui";
import { Inbox } from "@tamagui/lucide-icons";
import { useTimelineStore } from "../../store/timelineStore";
import TimelineEventCard from "../../components/Card/TimelineEventCard";
import { TimelineGroup, TimelineEvent } from "../../types/timeline";
import TimelineSkeleton from "../../components/ui/TimelineSkeleton";

// --- 子組件：背景中心線 ---
// 獨立出來是為了保證滾動時線條不斷裂
const CentralLine = ({ isMobile }: { isMobile: boolean }) => (
  <View
    position="absolute"
    left={isMobile ? 25 : "50%"}
    top={0}
    bottom={0}
    width={2}
    bg="$borderColor" // 確保你的 tamagui config 有這個顏色，或者用 $gray5
    ml={isMobile ? 0 : -1} // 修正中心點 (width 2 / 2)
    opacity={0.5}
    zIndex={0}
  />
);

// --- 子組件：時間軸節點 ---
const TimelineDot = ({ isMobile }: { isMobile: boolean }) => (
  <YStack
    position="absolute"
    left={isMobile ? 25 : "50%"}
    top={0} // 重要：Top 0 確保與該 Row 的頂部對齊
    x={-10} // 修正水平位置 (Size 20 / 2)
    zIndex={10}
    alignItems="center"
    justifyContent="center"
  >
    {/* <Circle
      size={20}
      bg="$background"
      borderWidth={2}
      borderColor="$brand" // 你的品牌色
      elevation="$1"
      shadowColor="$brand"
      shadowRadius={4}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.2}
    >
      <Circle size={8} bg="$brand" />
    </Circle> */}
  </YStack>
);

// --- 子組件：日期顯示 ---
const DateComponent = ({
  date,
  alignRight,
  isMobile,
}: {
  date: string;
  alignRight: boolean;
  isMobile: boolean;
}) => {
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const year = dateObj.getFullYear();

  return (
    <YStack
      flex={isMobile ? 0 : 1}
      alignItems={alignRight ? "flex-end" : "flex-start"}
      pt="$1" // 微調：視覺上對齊卡片文字的頂部
      px="$4"
      animation="lazy"
      enterStyle={{ opacity: 0, x: alignRight ? -10 : 10 }}
      mb={isMobile ? "$2" : 0}
    >
      <Text
        fontSize={isMobile ? "$7" : "$9"}
        fontWeight="900"
        lineHeight={isMobile ? "$7" : "$9"}
        color="$color"
        style={{ includeFontPadding: false }}
      >
        {day}
      </Text>
      <XStack gap="$1.5" opacity={0.6}>
        <Text
          fontSize="$3"
          fontWeight="700"
          textTransform="uppercase"
          color="$color"
        >
          {month}
        </Text>
        <Text fontSize="$3" fontWeight="400" color="$color">
          {year}
        </Text>
      </XStack>
    </YStack>
  );
};

// --- 子組件：事件列表 ---
const EventsComponent = ({
  events,
  alignRight,
}: {
  events: TimelineEvent[];
  alignRight: boolean;
}) => (
  <YStack
    flex={1}
    px="$3"
    pb="$6" // 組與組之間的垂直間距
    gap="$3" // 卡片之間的間距
    animation="lazy"
    enterStyle={{ opacity: 0, scale: 0.98, y: 10 }}
  >
    {events.map((event) => (
      <View
        key={event.id}
        width="100%"
        alignSelf={alignRight ? "flex-end" : "flex-start"} // 確保卡片靠著中線
      >
        <TimelineEventCard
          event={event}
          onPress={() => console.log("Pressed event:", event.id)}
        />
      </View>
    ))}
  </YStack>
);

const TimelineScreen = () => {
  const { width } = useWindowDimensions();
  const { groups, loading, error, fetchTimeline } = useTimelineStore();

  const handleRefresh = useCallback(() => {
    fetchTimeline({});
  }, [fetchTimeline]);

  useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  // 渲染每一行 (日期 + 卡片)
  const renderTimelineGroup = ({
    item: group,
    index,
  }: {
    item: TimelineGroup;
    index: number;
  }) => {
    const isEven = index % 2 === 0;
    const isMobile = width < 768;

    if (isMobile) {
      // Mobile layout: single column
      return (
        <XStack width="100%" position="relative" minHeight={80} mb="$4">
          <View width={50}>
            <TimelineDot isMobile={isMobile} />
          </View>
          <YStack flex={1}>
            <DateComponent
              date={group.date}
              alignRight={false}
              isMobile={isMobile}
            />
            <EventsComponent events={group.events} alignRight={false} />
          </YStack>
        </XStack>
      );
    }

    // Desktop layout: alternating columns
    return (
      <XStack width="100%" position="relative" minHeight={80}>
        <TimelineDot isMobile={isMobile} />
        {isEven ? (
          // 偶數行：日期在左，事件在右
          <>
            <DateComponent
              date={group.date}
              alignRight={true}
              isMobile={isMobile}
            />
            <View width={30} /> {/* 中間保留空間給 Dot */}
            <EventsComponent events={group.events} alignRight={false} />
          </>
        ) : (
          // 奇數行：事件在左，日期在右
          <>
            <EventsComponent events={group.events} alignRight={true} />
            <View width={30} />
            <DateComponent
              date={group.date}
              alignRight={false}
              isMobile={isMobile}
            />
          </>
        )}
      </XStack>
    );
  };

  // 空狀態顯示
  const renderEmptyComponent = () => (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      py="$10"
      gap="$4"
    >
      <Circle size={80} bg="$backgroundHover">
        <Inbox size={40} color="$color" />
      </Circle>
      <Text color="$color" fontSize="$5" opacity={0.7}>
        No memories found yet.
      </Text>
      <Button
        onPress={handleRefresh}
        size="$3"
        variant="outlined"
        color="$color"
      >
        Refresh
      </Button>
    </YStack>
  );

  // 列表標頭
  const renderHeader = () => (
    <YStack py="$4" px="$4" mb="$2">
      <Text fontSize="$8" fontWeight="bold" color="$color">
        Timeline
      </Text>
      <Text fontSize="$3" color="$color" opacity={0.7}>
        Your journey, step by step.
      </Text>
    </YStack>
  );

  // 初始化 Loading
  if (loading && !groups.length) return <TimelineSkeleton />;

  // 錯誤狀態
  if (error && !groups.length) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
        <Text color="$red9">Error loading data</Text>
        <Text color="$color" fontSize="$3" opacity={0.7}>
          {error.message}
        </Text>
        <Button onPress={handleRefresh} bg="$red9" color="white">
          Retry
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background" position="relative">
      {/* 絕對定位的背景線，貫穿整個畫面 */}
      <CentralLine isMobile={width < 768} />

      <FlatList
        data={groups}
        renderItem={renderTimelineGroup}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{
          paddingBottom: 60,
          paddingTop: 20,
        }}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      />
    </YStack>
  );
};

export default TimelineScreen;
