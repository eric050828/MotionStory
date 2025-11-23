
import React, { useEffect } from 'react';
import { FlatList } from 'react-native';
import { YStack, XStack, Text, View } from 'tamagui';
import { useTimelineStore } from '../../store/timelineStore';
import TimelineEventCard from '../../components/Card/TimelineEventCard';
import { TimelineGroup, TimelineEvent } from '../../types/timeline';
import TimelineSkeleton from '../../components/ui/TimelineSkeleton';

const TimelineScreen = () => {
  const { groups, loading, error, fetchTimeline } = useTimelineStore();

  useEffect(() => {
    fetchTimeline({});
  }, [fetchTimeline]);

  const renderTimelineGroup = ({ item: group, index }: { item: TimelineGroup; index: number }) => {
    const isOdd = index % 2 !== 0;

    const DateComponent = () => (
      <YStack width="50%" alignItems={isOdd ? 'flex-start' : 'flex-end'} px="$4" jc="center">
        <Text fontSize="$5" fontWeight="bold" color="$color" textAlign={isOdd ? 'left' : 'right'}>
          {new Date(group.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
      </YStack>
    );

    const EventsComponent = () => (
      <YStack width="50%" px="$4">
        {group.events.map((event: TimelineEvent) => (
          <View key={event.id} mb="$3">
            <TimelineEventCard
              event={event}
              onPress={() => console.log('Pressed event:', event)}
            />
          </View>
        ))}
      </YStack>
    );

    return (
      <XStack width="100%" position="relative" py="$4">
        {/* Central Vertical Line */}
        <View
          position="absolute"
          left="50%"
          width={2}
          height="100%"
          bg="$borderColor"
          ml="-1px"
        />

        {/* Timeline Dot */}
        <View
          position="absolute"
          left="50%"
          top={35} 
          width={14}
          height={14}
          borderRadius={7}
          bg="$brand"
          ml="-7px"
          zIndex={1}
        />

        {isOdd ? (
          <>
            <EventsComponent />
            <DateComponent />
          </>
        ) : (
          <>
            <DateComponent />
            <EventsComponent />
          </>
        )}
      </XStack>
    );
  };

  if (loading) {
    return <TimelineSkeleton />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={groups}
        renderItem={renderTimelineGroup}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </YStack>
  );
};

export default TimelineScreen;
