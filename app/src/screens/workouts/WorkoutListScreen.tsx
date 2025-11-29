/**
 * T149: WorkoutListScreen
 * 運動記錄列表畫面 (Refactored with Tamagui)
 */

import React, { useEffect, useState, useCallback } from "react";
import { Alert, RefreshControl } from "react-native";
import {
  YStack,
  Text,
  Button,
  XStack,
  ScrollView,
  useTheme,
  H4,
  Paragraph,
} from "tamagui";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import {
  Plus,
  ListFilter,
  Footprints,
  Bike,
  Waves,
  Mountain,
  PersonStanding,
  Dumbbell,
  Sparkles,
  ClipboardList,
  Pencil,
} from "@tamagui/lucide-icons";
import useWorkoutStore from "../../store/workoutStore";
import { Workout, WorkoutType } from "../../types/workout";
import { Loading } from "../../components/ui/Loading";
import { WorkoutStackParamList } from "../../types/navigation";
import {
  WORKOUT_TYPE_ICONS,
  WORKOUT_TYPE_LABELS,
  WORKOUT_TYPES,
} from "../../constants/workout";

type WorkoutListScreenNavigationProp = NavigationProp<
  WorkoutStackParamList,
  "WorkoutList"
>;

const WorkoutListScreen: React.FC = () => {
  const navigation = useNavigation<WorkoutListScreenNavigationProp>();
  const theme = useTheme();
  const {
    workouts,
    loading,
    error,
    filters,
    syncStatus,
    fetchWorkouts,
    syncWorkouts,
    setFilters,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  }, [fetchWorkouts]);

  const handleSync = async () => {
    try {
      await syncWorkouts();
      Alert.alert("同步成功", "運動記錄已同步");
    } catch (err) {
      Alert.alert("同步失敗", "請稍後再試");
    }
  };

  const handleFilterByType = (type: WorkoutType | null) => {
    setSelectedType(type);
    if (type) {
      setFilters({ ...filters, workout_type: type });
    } else {
      const { workout_type, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleWorkoutPress = (workout: Workout) => {
    navigation.navigate("WorkoutDetail", { workoutId: workout.id });
  };

  const handleAddWorkout = () => {
    navigation.navigate("WorkoutForm");
  };

  const renderWorkoutItem = (item: Workout) => {
    const date = new Date(item.start_time);
    const formattedDate = `${
      date.getMonth() + 1
    }/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(
      2,
      "0"
    )}`;
    const Icon = WORKOUT_TYPE_ICONS[item.workout_type] || Sparkles;

    return (
      <YStack
        key={item.id}
        backgroundColor="$background"
        borderRadius="$4"
        padding="$4"
        marginBottom="$3"
        onPress={() => handleWorkoutPress(item)}
        shadowColor="$shadowColor"
        shadowRadius={3}
        shadowOffset={{ width: 0, height: 2 }}
        elevation="$1"
        animation="bouncy"
        enterStyle={{ opacity: 0, y: 10 }}
      >
        <XStack alignItems="center" space="$3">
          <YStack
            width={48}
            height={48}
            borderRadius={24}
            backgroundColor="$blue3"
            justifyContent="center"
            alignItems="center"
          >
            <Icon size={24} color={theme.activeBlue10.val} />
          </YStack>

          <YStack flex={1}>
            <XStack justifyContent="space-between" alignItems="center">
              <H4 color="$color" margin={0}>
                {WORKOUT_TYPE_LABELS[item.workout_type] || item.workout_type}
              </H4>
              {item.sync_status === "pending" && (
                <YStack
                  backgroundColor="$orange9"
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize="$1" color="$color" fontWeight="bold">
                    待同步
                  </Text>
                </YStack>
              )}
            </XStack>
            <Paragraph theme="alt2">{formattedDate}</Paragraph>
          </YStack>
        </XStack>

        <XStack marginTop="$3" space="$4" flexWrap="wrap">
          {item.distance_km != null && (
            <Paragraph theme="alt1">
              距離: {item.distance_km.toFixed(2)} km
            </Paragraph>
          )}
          {item.duration_minutes != null && (
            <Paragraph theme="alt1">
              時長: {item.duration_minutes} min
            </Paragraph>
          )}
          {item.calories != null && (
            <Paragraph theme="alt1">卡路里: {item.calories} kcal</Paragraph>
          )}
        </XStack>
      </YStack>
    );
  };

  const renderTypeFilter = () => {
    const types: Array<WorkoutType | null> = [
      null,
      ...WORKOUT_TYPES.map((t) => t.value),
    ];

    return (
      <YStack
        paddingVertical="$3"
        paddingHorizontal="$4"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack space="$2" alignItems="center">
            {types.map((item) => {
              const isActive = selectedType === item;
              const Icon = item ? WORKOUT_TYPE_ICONS[item] : ListFilter;
              return (
                <Button
                  key={item || "all"}
                  size="$4" // Slightly larger for icons
                  circular // Make buttons circular
                  onPress={() => handleFilterByType(item)}
                  theme={isActive ? "blue" : "gray"}
                  variant={isActive ? undefined : "outlined"}
                  pressStyle={{
                    scale: 0.95,
                    opacity: 0.9,
                  }}
                  animation="bouncy"
                  icon={
                    <Icon
                      size={20}
                      color={isActive ? theme.activeBlue10.val : theme.color.val}
                    />
                  }
                />
              );
            })}
          </XStack>
        </ScrollView>
      </YStack>
    );
  };

  if (loading && !refreshing && workouts.length === 0) {
    return <Loading />;
  }

  return (
    <YStack flex={1} backgroundColor="$backgroundFocus">
      {renderTypeFilter()}

      {syncStatus.pending_count > 0 && (
        <XStack
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="$yellow5"
          padding="$3"
          margin="$3"
          borderRadius="$3"
        >
          <Text color="$yellow11" fontWeight="bold">
            {syncStatus.pending_count} 筆記錄待同步
          </Text>
          <Button size="$3" onPress={handleSync} theme="yellow_active">
            立即同步
          </Button>
        </XStack>
      )}

      {workouts.length > 0 ? (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.color.val}
            />
          }
        >
          {workouts.map(renderWorkoutItem)}
        </ScrollView>
      ) : (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          space="$4" // Increased space for better visual separation
          padding="$4" // Added padding for overall layout
        >
          <ClipboardList size={80} color={theme.color.val} marginBottom="$3" />{" "}
          {/* Icon added */}
          <Text fontSize="$6" color="$color" marginBottom="$2">
            尚無運動記錄
          </Text>
          <Paragraph theme="alt2" textAlign="center" marginBottom="$5">
            點擊下方按鈕開始您的第一次運動記錄吧！
          </Paragraph>
          <Button
            size="$5" // Larger button
            onPress={handleAddWorkout}
            theme="blue_active" // More prominent theme
            icon={<Pencil size={20} />} // Added icon to button
            pressStyle={{ scale: 0.95, opacity: 0.9 }}
            animation="bouncy"
            borderRadius="$6"
            paddingHorizontal="$6"
          >
            新增第一次運動
          </Button>
        </YStack>
      )}

      <YStack
        position="absolute"
        right={24}
        bottom={24}
        alignItems="center"
        justifyContent="center"
      >
        {/* Sonar Effect */}
        {[...Array(2)].map((_, i) => (
          <YStack
            key={i}
            position="absolute"
            width={56}
            height={56}
            borderRadius={28}
            backgroundColor="$blue8"
            Animation="sonar"
            animateOnly={["transform", "opacity"]}
            opacity={0.4}
            scale={1}
            {...{
              transform: [{ scale: 1 }],
            }}
            // Custom animation properties
            // @ts-ignore
            animationConfig={{
              delay: i * 1000, // Stagger the animations
              loop: true,
              duration: 2000,
              scale: {
                from: 1,
                to: 2.5,
              },
              opacity: {
                from: 0.5,
                to: 0,
              },
            }}
          />
        ))}

        {/* Main FAB Button */}
        <Button
          size="$6"
          circular
          onPress={handleAddWorkout}
          theme="blue_active"
          elevation="$4"
          shadowColor="$shadowColor"
          shadowRadius={8}
          shadowOffset={{ width: 0, height: 4 }}
          pressStyle={{ scale: 0.9, opacity: 0.9 }}
          animation="bouncy"
          icon={<Plus color="white" size={28} />}
        />
      </YStack>
    </YStack>
  );
};

export default WorkoutListScreen;
