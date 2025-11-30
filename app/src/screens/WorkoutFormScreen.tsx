/**
 * Workout Form Screen
 * 運動記錄建立/編輯畫面 (Refactored with Tamagui)
 */
import React, { useState } from "react";
import { Alert, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  YStack,
  ScrollView,
  Button,
  Input,
  Text,
  XStack,
  H4,
  useTheme,
  ToggleGroup,
  Spinner,
} from "tamagui";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Footprints,
  Bike,
  Waves,
  Dumbbell,
  Sparkles,
  Clock,
  HeartPulse,
  Flame,
  ClipboardPen,
  Calendar,
  Ruler,
} from "@tamagui/lucide-icons";
import { api } from "../services/api";
import { WorkoutType } from "../types/workout";

import { WORKOUT_TYPES } from "../constants/workout";

// New component to simplify type inference for ToggleGroup - REMOVED

export const WorkoutFormScreen: React.FC = () => {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("running");

  const [startTime, setStartTime] = useState(new Date());

  const [duration, setDuration] = useState("");

  const [distance, setDistance] = useState("");

  const [avgHeartRate, setAvgHeartRate] = useState("");

  const [calories, setCalories] = useState("");

  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const theme = useTheme();

  const navigation = useNavigation();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      const newStartTime = new Date(startTime);

      newStartTime.setFullYear(selectedDate.getFullYear());

      newStartTime.setMonth(selectedDate.getMonth());

      newStartTime.setDate(selectedDate.getDate());

      setStartTime(newStartTime);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios");

    if (selectedTime) {
      const newStartTime = new Date(startTime);

      newStartTime.setHours(selectedTime.getHours());

      newStartTime.setMinutes(selectedTime.getMinutes());

      setStartTime(newStartTime);
    }
  };

  const handleSubmit = async () => {
    if (!duration) {
      Alert.alert("錯誤", "請輸入運動時長");

      return;
    }

    const durationNum = parseInt(duration);

    if (isNaN(durationNum) || durationNum <= 0 || durationNum > 1440) {
      Alert.alert("錯誤", "運動時長需為 1-1440 之間的有效數字");

      return;
    }

    setIsLoading(true);

    try {
      const workoutData = {
        workout_type: workoutType,

        start_time: startTime.toISOString(),

        duration_minutes: durationNum,

        distance_km: distance ? parseFloat(distance) : undefined,

        avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : undefined,

        calories: calories ? parseInt(calories) : undefined,

        notes: notes || undefined,
      };

      const response = await api.createWorkout(workoutData);

      if (response.achievements_triggered?.length > 0) {
        const achievementTitles = response.achievements_triggered
          .map((a: any) => a.metadata?.title || a.achievement_type)
          .join(", ");

        if (Platform.OS === "web") {
          window.alert(`🎉 成就達成！\n恭喜你達成: ${achievementTitles}`);
          navigation.goBack();
        } else {
          Alert.alert("🎉 成就達成！", `恭喜你達成: ${achievementTitles}`, [
            { text: "太棒了！", onPress: () => navigation.goBack() }
          ]);
        }
      } else {
        if (Platform.OS === "web") {
          window.alert("成功：運動記錄已儲存！");
          navigation.goBack();
        } else {
          Alert.alert("成功", "運動記錄已儲存！", [
            { text: "確定", onPress: () => navigation.goBack() }
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert(
        "儲存失敗",

        error.response?.data?.detail || "請稍後再試"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    icon: React.ReactNode,

    label: string,

    value: string,

    onChangeText: (text: string) => void,

    placeholder: string,

    keyboardType: "numeric" | "decimal-pad" | "default" = "default"
  ) => (
    <XStack alignItems="center" space="$2">
      <YStack p="$2" backgroundColor="$backgroundHover" borderRadius="$3">
        {icon}
      </YStack>

      <Text width={80} color={theme.color.val}>
        {label}
      </Text>

      <Input
        flex={1}
        size="$4"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        borderWidth={1.5}
        borderColor="$borderColor"
      />
    </XStack>
  );

  return (
    <ScrollView backgroundColor="$background">
      <YStack space="$4" padding="$4">
        {/* Workout Type Section */}

        <YStack>
          <H4 marginBottom="$3">運動類型</H4>
          <XStack flexWrap="wrap" margin="$-1" alignItems="center">
            {WORKOUT_TYPES.map((type) => {
              const isActive = workoutType === type.value;
              return (
                <Button
                  key={type.value}
                  margin="$1"
                  variant={isActive ? undefined : "outlined"}
                  theme={isActive ? "brand" : "gray"}
                  onPress={() => setWorkoutType(type.value)}
                  size="$3"
                  paddingHorizontal="$3"
                  icon={
                    <type.icon
                      size={16}
                      color={isActive ? theme.brand.val : theme.color.val}
                    />
                  }
                >
                  <Text fontSize="$2" color={isActive ? "$brand" : "$color"}>
                    {type.label}
                  </Text>
                </Button>
              );
            })}
          </XStack>
        </YStack>

        {/* Workout Time Section */}

        <YStack>
          <H4 marginBottom="$3">運動時間</H4>

          <XStack space="$2">
            <Button
              icon={<Calendar size={20} />}
              onPress={() => setShowDatePicker(true)}
              size="$4"
              justifyContent="flex-start"
              theme="gray"
              variant="outlined"
              flex={1}
            >
              {startTime.toLocaleDateString("zh-TW")}
            </Button>

            <Button
              icon={<Clock size={20} />}
              onPress={() => setShowTimePicker(true)}
              size="$4"
              justifyContent="flex-start"
              theme="gray"
              variant="outlined"
              flex={1}
            >
              {startTime.toLocaleTimeString("zh-TW", {
                hour: "2-digit",

                minute: "2-digit",
              })}
            </Button>
          </XStack>

          {showDatePicker && (
            <DateTimePicker
              value={startTime}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
            />
          )}
        </YStack>

        {/* Workout Data Section */}

        <YStack space="$3">
          <H4 marginBottom="$2">運動資料</H4>

          {renderInput(
            <Clock size={20} color={theme.color.val} />,

            "時長 (分) *",

            duration,

            setDuration,

            "例如: 30",

            "numeric"
          )}

          {renderInput(
            <Ruler size={20} color={theme.color.val} />,

            "距離 (km)",

            distance,

            setDistance,

            "例如: 5.0",

            "decimal-pad"
          )}

          {renderInput(
            <HeartPulse size={20} color={theme.color.val} />,

            "平均心率",

            avgHeartRate,

            setAvgHeartRate,

            "例如: 145",

            "numeric"
          )}

          {renderInput(
            <Flame size={20} color={theme.color.val} />,

            "卡路里",

            calories,

            setCalories,

            "例如: 300",

            "numeric"
          )}

          <YStack
            backgroundColor="$backgroundHover"
            borderRadius="$3"
            padding="$3"
            space="$2"
          >
            <XStack space="$2" alignItems="center">
              <ClipboardPen size={20} color={theme.color.val} />

              <Text color={theme.color.val}>備註</Text>
            </XStack>

            <Input
              multiline
              numberOfLines={4}
              placeholder="今天狀態很好！"
              value={notes}
              onChangeText={setNotes}
              borderWidth={0}
              backgroundColor="$backgroundHover"
            />
          </YStack>
        </YStack>

        {/* Submit Button */}

        <Button
          size="$5"
          onPress={handleSubmit}
          disabled={isLoading}
          icon={isLoading ? <Spinner /> : undefined}
          pressStyle={{ scale: 0.97, opacity: 0.9 }}
          animation="bouncy"
        >
          {isLoading ? "儲存中..." : "儲存運動記錄"}
        </Button>
      </YStack>
    </ScrollView>
  );
};
