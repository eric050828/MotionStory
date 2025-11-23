import React from "react";
import { Card, Paragraph, YStack, XStack, Text, useThemeName } from "tamagui";
import { TimelineEvent, TIMELINE_EVENT_COLORS } from "../../types/timeline";
import { Clock, Zap, Target } from "@tamagui/lucide-icons";

interface TimelineEventCardProps {
  event: TimelineEvent;
  onPress: () => void;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  onPress,
}) => {
  const { bg, border, text } = TIMELINE_EVENT_COLORS[event.type];
  const themeName = useThemeName();

  const renderIcon = () => {
    switch (event.type) {
      case "workout":
        return <Zap size={16} color={text} />;
      case "achievement":
        return <Target size={16} color={text} />;
      case "milestone":
        return <Clock size={16} color={text} />;
      default:
        return null;
    }
  };

  return (
    <Card
      elevate
      bordered
      animation="bouncy"
      size="$4"
      onPress={onPress}
      my="$2"
      backgroundColor={bg}
      borderColor={border}
    >
      <Card.Header>
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" space="$2">
            {renderIcon()}
            <Text color={text} fontWeight="bold">
              {event.title}
            </Text>
          </XStack>
          <Text
            fontSize="$2"
            color={themeName === "dark" ? "$light5" : "$light12"}
          >
            {new Date(event.date).toLocaleDateString()}
          </Text>
        </XStack>
      </Card.Header>
      <YStack px="$4" pb="$3">
        <Paragraph color={text}>{event.description}</Paragraph>
      </YStack>
    </Card>
  );
};

export default TimelineEventCard;
