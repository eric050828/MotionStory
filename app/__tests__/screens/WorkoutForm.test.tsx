/**
 * Workout Form Component Tests (T046)
 * 測試表單驗證、運動類型選擇、資料提交
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import WorkoutForm from '@/app/screens/WorkoutForm';
import { useWorkoutStore } from '@/app/stores/workoutStore';

// Mock Zustand store
jest.mock('@/app/stores/workoutStore');

// Mock Date picker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

describe('WorkoutForm Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('應該顯示所有必填欄位', () => {
      const { getByText, getByPlaceholderText } = render(<WorkoutForm />);

      expect(getByText('運動類型')).toBeTruthy();
      expect(getByText('開始時間')).toBeTruthy();
      expect(getByPlaceholderText('運動時長（分鐘）')).toBeTruthy();
    });

    it('應該顯示選填欄位', () => {
      const { getByPlaceholderText } = render(<WorkoutForm />);

      expect(getByPlaceholderText('距離（公里）')).toBeTruthy();
      expect(getByPlaceholderText('配速（分鐘/公里）')).toBeTruthy();
      expect(getByPlaceholderText('平均心率（bpm）')).toBeTruthy();
      expect(getByPlaceholderText('消耗卡路里')).toBeTruthy();
      expect(getByPlaceholderText('備註')).toBeTruthy();
    });

    it('應該顯示儲存和取消按鈕', () => {
      const { getByText } = render(<WorkoutForm />);

      expect(getByText('儲存運動記錄')).toBeTruthy();
      expect(getByText('取消')).toBeTruthy();
    });
  });

  describe('Workout Type Selection', () => {
    it('應該顯示所有運動類型選項', () => {
      const { getByText } = render(<WorkoutForm />);

      // 點擊運動類型選擇器
      fireEvent.press(getByText('運動類型'));

      // 驗證所有選項
      expect(getByText('跑步')).toBeTruthy();
      expect(getByText('騎車')).toBeTruthy();
      expect(getByText('游泳')).toBeTruthy();
      expect(getByText('健身房')).toBeTruthy();
      expect(getByText('瑜珈')).toBeTruthy();
      expect(getByText('其他')).toBeTruthy();
    });

    it('選擇運動類型應該更新表單狀態', () => {
      const { getByText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      expect(getByText('跑步')).toBeTruthy();
    });

    it('選擇「跑步」應該顯示配速欄位', () => {
      const { getByText, getByPlaceholderText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const paceInput = getByPlaceholderText('配速（分鐘/公里）');
      expect(paceInput).toBeTruthy();
      expect(paceInput.props.editable).toBe(true);
    });

    it('選擇「健身房」應該隱藏距離和配速欄位', () => {
      const { getByText, queryByPlaceholderText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('健身房'));

      // 距離和配速欄位應該被禁用或隱藏
      const distanceInput = queryByPlaceholderText('距離（公里）');
      const paceInput = queryByPlaceholderText('配速（分鐘/公里）');

      if (distanceInput) expect(distanceInput.props.editable).toBe(false);
      if (paceInput) expect(paceInput.props.editable).toBe(false);
    });
  });

  describe('Form Validation', () => {
    it('未選擇運動類型應該顯示驗證訊息', async () => {
      const { getByText, findByText } = render(<WorkoutForm />);

      fireEvent.press(getByText('儲存運動記錄'));

      const errorMessage = await findByText(/請選擇運動類型/i);
      expect(errorMessage).toBeTruthy();
    });

    it('運動時長為空應該顯示驗證訊息', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<WorkoutForm />);

      // 選擇運動類型
      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      fireEvent.press(getByText('儲存運動記錄'));

      const errorMessage = await findByText(/請輸入運動時長/i);
      expect(errorMessage).toBeTruthy();
    });

    it('運動時長為負數應該顯示驗證訊息', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      fireEvent.changeText(durationInput, '-10');

      fireEvent.press(getByText('儲存運動記錄'));

      const errorMessage = await findByText(/運動時長必須為正數/i);
      expect(errorMessage).toBeTruthy();
    });

    it('心率超過範圍應該顯示驗證訊息', async () => {
      const { getByText, getByPlaceholderText, findByText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      const heartRateInput = getByPlaceholderText('平均心率（bpm）');

      fireEvent.changeText(durationInput, '30');
      fireEvent.changeText(heartRateInput, '300'); // 超過 250 上限

      fireEvent.press(getByText('儲存運動記錄'));

      const errorMessage = await findByText(/心率範圍應在 30-250 之間/i);
      expect(errorMessage).toBeTruthy();
    });

    it('所有必填欄位填寫完成應該可以提交', async () => {
      const mockCreateWorkout = jest.fn().mockResolvedValue({ success: true });
      (useWorkoutStore as jest.Mock).mockReturnValue({ createWorkout: mockCreateWorkout });

      const { getByText, getByPlaceholderText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      const distanceInput = getByPlaceholderText('距離（公里）');

      fireEvent.changeText(durationInput, '30');
      fireEvent.changeText(distanceInput, '5.0');

      fireEvent.press(getByText('儲存運動記錄'));

      await waitFor(() => {
        expect(mockCreateWorkout).toHaveBeenCalledWith(
          expect.objectContaining({
            workout_type: 'running',
            duration_minutes: 30,
            distance_km: 5.0,
          })
        );
      });
    });
  });

  describe('Date/Time Selection', () => {
    it('點擊開始時間應該開啟日期選擇器', () => {
      const { getByText, queryByTestId } = render(<WorkoutForm />);

      fireEvent.press(getByText('開始時間'));

      const datePicker = queryByTestId('datetime-picker');
      expect(datePicker).toBeTruthy();
    });

    it('選擇日期後應該更新顯示', async () => {
      const { getByText, getByTestId } = render(<WorkoutForm />);

      fireEvent.press(getByText('開始時間'));

      const datePicker = getByTestId('datetime-picker');
      const selectedDate = new Date('2025-01-15T08:30:00Z');

      fireEvent(datePicker, 'onChange', { nativeEvent: { timestamp: selectedDate } });

      await waitFor(() => {
        expect(getByText(/2025-01-15/)).toBeTruthy();
      });
    });

    it('未來時間應該顯示驗證訊息', async () => {
      const { getByText, getByTestId, findByText } = render(<WorkoutForm />);

      fireEvent.press(getByText('開始時間'));

      const datePicker = getByTestId('datetime-picker');
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 明天

      fireEvent(datePicker, 'onChange', { nativeEvent: { timestamp: futureDate } });

      fireEvent.press(getByText('儲存運動記錄'));

      const errorMessage = await findByText(/開始時間不能是未來/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  describe('Workout Submission', () => {
    it('提交成功應該顯示成功訊息並返回', async () => {
      const mockCreateWorkout = jest.fn().mockResolvedValue({ success: true });
      const mockNavigate = jest.fn();
      const mockAlert = jest.spyOn(Alert, 'alert');

      (useWorkoutStore as jest.Mock).mockReturnValue({ createWorkout: mockCreateWorkout });

      const { getByText, getByPlaceholderText } = render(
        <WorkoutForm navigation={{ goBack: mockNavigate }} />
      );

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      fireEvent.changeText(durationInput, '30');

      fireEvent.press(getByText('儲存運動記錄'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('成功', '運動記錄已儲存');
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('提交失敗應該顯示錯誤訊息', async () => {
      const mockCreateWorkout = jest.fn().mockRejectedValue(new Error('儲存失敗'));
      const mockAlert = jest.spyOn(Alert, 'alert');

      (useWorkoutStore as jest.Mock).mockReturnValue({ createWorkout: mockCreateWorkout });

      const { getByText, getByPlaceholderText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      fireEvent.changeText(durationInput, '30');

      fireEvent.press(getByText('儲存運動記錄'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('錯誤', expect.any(String));
      });
    });

    it('提交過程應該顯示 Loading 狀態', async () => {
      const mockCreateWorkout = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      (useWorkoutStore as jest.Mock).mockReturnValue({ createWorkout: mockCreateWorkout });

      const { getByText, getByPlaceholderText, queryByTestId } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      fireEvent.changeText(durationInput, '30');

      fireEvent.press(getByText('儲存運動記錄'));

      const loadingIndicator = queryByTestId('submit-loading');
      expect(loadingIndicator).toBeTruthy();

      await waitFor(() => {
        expect(mockCreateWorkout).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-calculation Features', () => {
    it('輸入距離和時長應該自動計算配速', async () => {
      const { getByText, getByPlaceholderText, findByDisplayValue } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      const distanceInput = getByPlaceholderText('距離（公里）');

      fireEvent.changeText(durationInput, '30');
      fireEvent.changeText(distanceInput, '5.0');

      // 配速應該自動計算為 6.0 分鐘/公里 (30 / 5.0)
      const paceValue = await findByDisplayValue('6.0');
      expect(paceValue).toBeTruthy();
    });

    it('手動修改配速應該覆蓋自動計算值', async () => {
      const { getByText, getByPlaceholderText } = render(<WorkoutForm />);

      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      const distanceInput = getByPlaceholderText('距離（公里）');
      const paceInput = getByPlaceholderText('配速（分鐘/公里）');

      fireEvent.changeText(durationInput, '30');
      fireEvent.changeText(distanceInput, '5.0');

      // 手動修改配速
      fireEvent.changeText(paceInput, '5.5');

      expect(paceInput.props.value).toBe('5.5');
    });
  });

  describe('Navigation', () => {
    it('點擊取消按鈕應該返回上一頁', () => {
      const mockGoBack = jest.fn();

      const { getByText } = render(
        <WorkoutForm navigation={{ goBack: mockGoBack }} />
      );

      fireEvent.press(getByText('取消'));

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('點擊取消前有未儲存變更應該顯示確認對話框', () => {
      const mockGoBack = jest.fn();
      const mockAlert = jest.spyOn(Alert, 'alert');

      const { getByText, getByPlaceholderText } = render(
        <WorkoutForm navigation={{ goBack: mockGoBack }} />
      );

      // 輸入一些資料
      fireEvent.press(getByText('運動類型'));
      fireEvent.press(getByText('跑步'));

      fireEvent.press(getByText('取消'));

      expect(mockAlert).toHaveBeenCalledWith(
        '確認離開',
        '您有未儲存的變更，確定要離開嗎？',
        expect.any(Array)
      );
    });
  });

  describe('Accessibility', () => {
    it('運動類型選擇器應該有正確的 accessibility label', () => {
      const { getByText } = render(<WorkoutForm />);

      const workoutTypeButton = getByText('運動類型');
      expect(workoutTypeButton.props.accessibilityLabel).toBe('選擇運動類型');
      expect(workoutTypeButton.props.accessibilityRole).toBe('button');
    });

    it('數值輸入欄位應該有正確的 keyboard type', () => {
      const { getByPlaceholderText } = render(<WorkoutForm />);

      const durationInput = getByPlaceholderText('運動時長（分鐘）');
      const distanceInput = getByPlaceholderText('距離（公里）');
      const heartRateInput = getByPlaceholderText('平均心率（bpm）');

      expect(durationInput.props.keyboardType).toBe('numeric');
      expect(distanceInput.props.keyboardType).toBe('decimal-pad');
      expect(heartRateInput.props.keyboardType).toBe('numeric');
    });

    it('儲存按鈕應該有正確的 accessibility hint', () => {
      const { getByText } = render(<WorkoutForm />);

      const saveButton = getByText('儲存運動記錄');
      expect(saveButton.props.accessibilityHint).toBe('儲存目前的運動記錄');
    });
  });
});
