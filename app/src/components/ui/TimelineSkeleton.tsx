
import React from 'react';
import { YStack, XStack, View } from 'tamagui';

const SkeletonCard = () => (
  <View
    backgroundColor="$backgroundHover"
    borderRadius="$4"
    height={100}
    width="100%"
    mb="$3"
    opacity={0.5}
  />
);

const SkeletonGroup = ({ isOdd }: { isOdd: boolean }) => {
  const DateComponent = () => (
    <YStack width="50%" alignItems={isOdd ? 'flex-start' : 'flex-end'} px="$4" jc="center">
      <View backgroundColor="$backgroundHover" width={100} height={20} borderRadius="$2" />
    </YStack>
  );

  const EventsComponent = () => (
    <YStack width="50%" px="$4">
      <SkeletonCard />
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
        bg="$borderColor"
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

const TimelineSkeleton = () => {
  return (
    <YStack flex={1} space="$4" p="$4">
      {[...Array(4)].map((_, index) => (
        <SkeletonGroup key={index} isOdd={index % 2 !== 0} />
      ))}
    </YStack>
  );
};

export default TimelineSkeleton;
