
import { WorkoutType } from '../types/workout';
import {
  Footprints,
  Bike,
  Waves,
  Mountain,
  PersonStanding,
  Dumbbell,
  Sparkles,
} from '@tamagui/lucide-icons';
import React from 'react';

export const WORKOUT_TYPES: Array<{
  label: string;
  value: WorkoutType;
  icon: React.FC<any>;
}> = [
  { label: '跑步', value: 'running', icon: Footprints },
  { label: '騎車', value: 'cycling', icon: Bike },
  { label: '游泳', value: 'swimming', icon: Waves },
  { label: '登山', value: 'hiking', icon: Mountain },
  { label: '瑜伽', value: 'yoga', icon: PersonStanding },
  { label: '重訓', value: 'strength_training', icon: Dumbbell },
  { label: '其他', value: 'other', icon: Sparkles },
];

export const WORKOUT_TYPE_ICONS: Record<
  WorkoutType,
  React.FC<{ size?: number; color?: string }>
> = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  hiking: Mountain,
  yoga: PersonStanding,
  strength_training: Dumbbell,
  other: Sparkles,
};

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  running: '跑步',
  cycling: '騎車',
  swimming: '游泳',
  hiking: '登山',
  yoga: '瑜伽',
  strength_training: '重訓',
  other: '其他',
};
