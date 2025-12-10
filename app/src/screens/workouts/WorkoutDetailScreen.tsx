/**
 * T150: WorkoutDetailScreen
 * 單一運動記錄詳細資訊畫面 - 使用 Tamagui 主題系統
 */

import React, { useEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { YStack, XStack, Text, Card, Button, Spinner } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  Activity, Timer, Flame, Heart, Mountain, MapPin,
  Cloud, FileText, Share2, Edit3, Trash2, Upload, Clock
} from '@tamagui/lucide-icons';
import useWorkoutStore from '../../store/workoutStore';
import { WorkoutType } from '../../types/workout';
import { socialService } from '../../services/socialService';
import { ShareActivityModal } from '../../components/social/ShareActivityModal';
import { useTheme } from '../../../components/theme/useTheme';

type RouteParams = {
  WorkoutDetail: {
    workoutId: string;
  };
};

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  running: '跑步',
  cycling: '騎車',
  swimming: '游泳',
  walking: '步行',
  hiking: '登山',
  yoga: '瑜伽',
  strength_training: '重訓',
  other: '其他',
};

const WORKOUT_TYPE_COLORS: Record<WorkoutType, [string, string]> = {
  running: ['#667eea', '#764ba2'],
  cycling: ['#f093fb', '#f5576c'],
  swimming: ['#4facfe', '#00f2fe'],
  walking: ['#43e97b', '#38f9d7'],
  hiking: ['#fa709a', '#fee140'],
  yoga: ['#a18cd1', '#fbc2eb'],
  strength_training: ['#ff0844', '#ffb199'],
  other: ['#667eea', '#764ba2'],
};

// Stat Card Component
const StatCard: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  unit: string;
  colors: [string, string];
}> = ({ icon: Icon, label, value, unit, colors }) => {
  const { theme } = useTheme();

  return (
    <Card
      flex={1}
      minWidth="45%"
      backgroundColor={theme.tokens.colors.card}
      borderRadius="$4"
      padding="$4"
      borderWidth={1}
      borderColor={theme.tokens.colors.border}
    >
      <XStack alignItems="center" gap="$3">
        <LinearGradient
          colors={colors}
          start={[0, 0]}
          end={[1, 1]}
          width={44}
          height={44}
          borderRadius={22}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={22} color="white" />
        </LinearGradient>
        <YStack flex={1}>
          <Text fontSize="$2" color={theme.tokens.colors.mutedForeground}>
            {label}
          </Text>
          <XStack alignItems="baseline" gap="$1">
            <Text fontSize="$6" fontWeight="900" color={theme.tokens.colors.foreground}>
              {value}
            </Text>
            <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
              {unit}
            </Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
};

// Info Section Component
const InfoSection: React.FC<{
  title: string;
  icon: any;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => {
  const { theme } = useTheme();

  return (
    <YStack marginBottom="$4">
      <XStack alignItems="center" gap="$2" marginBottom="$2">
        <Icon size={18} color={theme.tokens.colors.primary} />
        <Text fontSize="$4" fontWeight="700" color={theme.tokens.colors.foreground}>
          {title}
        </Text>
      </XStack>
      <Card
        backgroundColor={theme.tokens.colors.card}
        borderRadius="$4"
        padding="$4"
        borderWidth={1}
        borderColor={theme.tokens.colors.border}
      >
        {children}
      </Card>
    </YStack>
  );
};

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'WorkoutDetail'>>();
  const { workoutId } = route.params;
  const { theme } = useTheme();

  const { currentWorkout, loading, fetchWorkout, deleteWorkout } = useWorkoutStore();
  const [deleting, setDeleting] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  useEffect(() => {
    if (workoutId) {
      fetchWorkout(workoutId);
    }
  }, [workoutId]);

  const handleEdit = () => {
    navigation.navigate('WorkoutForm' as never, { workoutId } as never);
  };

  const handleDelete = () => {
    Alert.alert(
      '刪除運動記錄',
      '確定要刪除這筆運動記錄嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteWorkout(workoutId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('刪除失敗', '請稍後再試');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSharePress = () => {
    setShareModalVisible(true);
  };

  const handleShare = async (caption: string, imageUri?: string) => {
    if (!currentWorkout) return;

    await socialService.shareWorkout(
      workoutId,
      {
        workout_type: WORKOUT_TYPE_LABELS[currentWorkout.workout_type] || currentWorkout.workout_type,
        duration_minutes: currentWorkout.duration_minutes,
        distance_km: currentWorkout.distance_km,
        calories: currentWorkout.calories,
      },
      caption
    );
    Alert.alert('分享成功', '你的運動記錄已分享到社群動態！');
  };

  if (loading || !currentWorkout) {
    return (
      <YStack flex={1} backgroundColor={theme.tokens.colors.background} alignItems="center" justifyContent="center">
        <Spinner size="large" color={theme.tokens.colors.primary} />
        <Text marginTop="$3" color={theme.tokens.colors.mutedForeground}>載入中...</Text>
      </YStack>
    );
  }

  const workout = currentWorkout;
  const date = new Date(workout.start_time);
  const formattedDate = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const gradientColors = WORKOUT_TYPE_COLORS[workout.workout_type] || WORKOUT_TYPE_COLORS.other;

  return (
    <YStack flex={1} backgroundColor={theme.tokens.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Header Card with Gradient */}
          <LinearGradient
            colors={gradientColors}
            start={[0, 0]}
            end={[1, 1]}
            borderRadius="$4"
            padding="$5"
          >
            <YStack>
              <XStack alignItems="center" gap="$2" marginBottom="$2">
                <Activity size={28} color="white" />
                <Text fontSize="$8" fontWeight="900" color="white">
                  {WORKOUT_TYPE_LABELS[workout.workout_type] || workout.workout_type}
                </Text>
              </XStack>
              <XStack alignItems="center" gap="$2">
                <Clock size={16} color="white" opacity={0.9} />
                <Text fontSize="$4" color="white" opacity={0.9}>
                  {formattedDate} {formattedTime}
                </Text>
              </XStack>
              {workout.sync_status === 'pending' && (
                <XStack
                  alignSelf="flex-start"
                  backgroundColor="rgba(255,255,255,0.2)"
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$2"
                  marginTop="$3"
                  alignItems="center"
                  gap="$1"
                >
                  <Upload size={14} color="white" />
                  <Text fontSize="$2" color="white" fontWeight="600">待同步</Text>
                </XStack>
              )}
            </YStack>
          </LinearGradient>

          {/* Stats Grid */}
          <XStack flexWrap="wrap" gap="$3">
            {workout.distance_km && (
              <StatCard
                icon={Activity}
                label="距離"
                value={workout.distance_km.toFixed(2)}
                unit="公里"
                colors={['#4facfe', '#00f2fe']}
              />
            )}

            <StatCard
              icon={Timer}
              label="時長"
              value={workout.duration_minutes}
              unit="分鐘"
              colors={['#667eea', '#764ba2']}
            />

            {workout.calories && (
              <StatCard
                icon={Flame}
                label="卡路里"
                value={workout.calories}
                unit="卡"
                colors={['#f093fb', '#f5576c']}
              />
            )}

            {workout.avg_heart_rate && (
              <StatCard
                icon={Heart}
                label="平均心率"
                value={workout.avg_heart_rate}
                unit="bpm"
                colors={['#ff0844', '#ffb199']}
              />
            )}

            {workout.max_heart_rate && (
              <StatCard
                icon={Heart}
                label="最大心率"
                value={workout.max_heart_rate}
                unit="bpm"
                colors={['#fa709a', '#fee140']}
              />
            )}

            {workout.elevation_gain && (
              <StatCard
                icon={Mountain}
                label="爬升"
                value={workout.elevation_gain}
                unit="公尺"
                colors={['#43e97b', '#38f9d7']}
              />
            )}
          </XStack>

          {/* Location */}
          {workout.location && (
            <InfoSection title="地點" icon={MapPin}>
              <YStack>
                <Text fontSize="$4" fontWeight="600" color={theme.tokens.colors.foreground}>
                  {workout.location.place_name || '未命名地點'}
                </Text>
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground} marginTop="$1">
                  {workout.location.latitude.toFixed(6)}, {workout.location.longitude.toFixed(6)}
                </Text>
              </YStack>
            </InfoSection>
          )}

          {/* Weather */}
          {workout.metadata?.weather && (
            <InfoSection title="天氣" icon={Cloud}>
              <XStack alignItems="center" gap="$4">
                <Text fontSize="$7" fontWeight="900" color={theme.tokens.colors.primary}>
                  {workout.metadata.weather.temperature}°C
                </Text>
                <YStack>
                  <Text fontSize="$4" color={theme.tokens.colors.foreground}>
                    {workout.metadata.weather.condition}
                  </Text>
                  {workout.metadata.weather.humidity && (
                    <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                      濕度 {workout.metadata.weather.humidity}%
                    </Text>
                  )}
                </YStack>
              </XStack>
            </InfoSection>
          )}

          {/* Notes */}
          {workout.notes && (
            <InfoSection title="備註" icon={FileText}>
              <Text fontSize="$4" color={theme.tokens.colors.foreground} lineHeight={24}>
                {workout.notes}
              </Text>
            </InfoSection>
          )}

          {/* Import Info */}
          {workout.metadata?.imported_from && (
            <Card
              backgroundColor={theme.tokens.colors.primary + '15'}
              borderRadius="$4"
              padding="$4"
              borderWidth={1}
              borderColor={theme.tokens.colors.primary + '30'}
            >
              <XStack alignItems="center" gap="$2">
                <Upload size={18} color={theme.tokens.colors.primary} />
                <YStack>
                  <Text fontSize="$4" fontWeight="600" color={theme.tokens.colors.primary}>
                    來自 {workout.metadata.imported_from.toUpperCase()}
                  </Text>
                  {workout.metadata.import_id && (
                    <Text fontSize="$2" color={theme.tokens.colors.primary} opacity={0.8}>
                      ID: {workout.metadata.import_id}
                    </Text>
                  )}
                </YStack>
              </XStack>
            </Card>
          )}

          {/* Action Buttons */}
          <YStack gap="$3" marginTop="$2">
            <Button
              size="$4"
              backgroundColor="#4CAF50"
              pressStyle={{ backgroundColor: '#43A047' }}
              onPress={handleSharePress}
            >
              <Share2 size={18} color="white" />
              <Text color="white" fontWeight="600" marginLeft="$2">分享到社群</Text>
            </Button>

            <XStack gap="$3">
              <Button
                flex={1}
                size="$4"
                backgroundColor={theme.tokens.colors.muted}
                pressStyle={{ opacity: 0.8 }}
                onPress={handleEdit}
              >
                <Edit3 size={18} color={theme.tokens.colors.foreground} />
                <Text color={theme.tokens.colors.foreground} fontWeight="600" marginLeft="$2">編輯</Text>
              </Button>

              <Button
                flex={1}
                size="$4"
                backgroundColor={theme.tokens.colors.error + '15'}
                borderWidth={1}
                borderColor={theme.tokens.colors.error + '30'}
                pressStyle={{ opacity: 0.8 }}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Spinner size="small" color={theme.tokens.colors.error} />
                ) : (
                  <>
                    <Trash2 size={18} color={theme.tokens.colors.error} />
                    <Text color={theme.tokens.colors.error} fontWeight="600" marginLeft="$2">刪除</Text>
                  </>
                )}
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Share Modal */}
      <ShareActivityModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        onShare={handleShare}
        activityType="workout"
        activitySummary={`${WORKOUT_TYPE_LABELS[workout.workout_type]} - ${workout.duration_minutes} 分鐘${workout.distance_km ? ` | ${workout.distance_km.toFixed(2)} 公里` : ''}${workout.calories ? ` | ${workout.calories} 卡` : ''}`}
      />
    </YStack>
  );
};

export default WorkoutDetailScreen;
