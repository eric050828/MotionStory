/**
 * Celebration Animation Component Tests (T048)
 * 測試動畫播放、等級切換（basic/fireworks/epic）
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';
import CelebrationAnimation from '@/app/components/CelebrationAnimation';

// Mock Lottie animations
jest.mock('lottie-react-native', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      play: jest.fn(),
      reset: jest.fn(),
      pause: jest.fn(),
    }));
    return React.createElement('LottieView', { ...props, testID: 'lottie-animation' });
  });
});

// Mock react-native-confetti-cannon
jest.mock('react-native-confetti-cannon', () => 'ConfettiCannon');

describe('CelebrationAnimation Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Animation Rendering', () => {
    it('應該根據慶祝等級顯示對應動畫', () => {
      const { rerender, getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      let animation = getByTestId('lottie-animation');
      expect(animation.props.source).toContain('basic');

      // 切換到 fireworks
      rerender(<CelebrationAnimation level="fireworks" visible={true} />);
      animation = getByTestId('lottie-animation');
      expect(animation.props.source).toContain('fireworks');

      // 切換到 epic
      rerender(<CelebrationAnimation level="epic" visible={true} />);
      animation = getByTestId('lottie-animation');
      expect(animation.props.source).toContain('epic');
    });

    it('visible=false 時不應該顯示動畫', () => {
      const { queryByTestId } = render(
        <CelebrationAnimation level="basic" visible={false} />
      );

      const animation = queryByTestId('lottie-animation');
      expect(animation).toBeFalsy();
    });

    it('visible 切換為 true 時應該自動播放動畫', async () => {
      const { rerender, getByTestId } = render(
        <CelebrationAnimation level="basic" visible={false} />
      );

      rerender(<CelebrationAnimation level="basic" visible={true} />);

      const animation = getByTestId('lottie-animation');
      
      await waitFor(() => {
        expect(animation.props.autoPlay).toBe(true);
      });
    });
  });

  describe('Basic Level Animation', () => {
    it('basic 等級應該播放簡單動畫', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.source).toBe(require('@/assets/animations/basic-celebration.json'));
    });

    it('basic 動畫應該循環播放 1 次', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.loop).toBe(false);
    });

    it('basic 動畫播放完成後應該觸發回調', async () => {
      const onComplete = jest.fn();

      const { getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} onComplete={onComplete} />
      );

      const animation = getByTestId('lottie-animation');
      
      // 模擬動畫完成
      animation.props.onAnimationFinish();

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('basic 動畫應該包含簡單的星星效果', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const stars = getByTestId('celebration-stars');
      expect(stars).toBeTruthy();
      expect(stars.props.count).toBeLessThanOrEqual(10);
    });
  });

  describe('Fireworks Level Animation', () => {
    it('fireworks 等級應該播放煙火動畫', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="fireworks" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.source).toBe(require('@/assets/animations/fireworks-celebration.json'));
    });

    it('fireworks 應該顯示彩紙效果', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="fireworks" visible={true} />
      );

      const confetti = getByTestId('confetti-cannon');
      expect(confetti).toBeTruthy();
    });

    it('fireworks 動畫應該循環播放 2 次', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="fireworks" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.loop).toBe(true);
    });

    it('fireworks 應該在 3 秒後自動停止', async () => {
      const onComplete = jest.fn();

      render(
        <CelebrationAnimation level="fireworks" visible={true} onComplete={onComplete} />
      );

      // 快轉 3 秒
      jest.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('fireworks 應該包含音效觸發', () => {
      const onSoundTrigger = jest.fn();

      render(
        <CelebrationAnimation 
          level="fireworks" 
          visible={true} 
          onSoundTrigger={onSoundTrigger}
        />
      );

      expect(onSoundTrigger).toHaveBeenCalledWith('fireworks');
    });
  });

  describe('Epic Level Animation', () => {
    it('epic 等級應該播放史詩動畫', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.source).toBe(require('@/assets/animations/epic-celebration.json'));
    });

    it('epic 應該顯示全螢幕彩紙效果', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      const confetti = getByTestId('confetti-cannon');
      expect(confetti.props.count).toBeGreaterThanOrEqual(100);
      expect(confetti.props.fadeOut).toBe(true);
    });

    it('epic 應該包含震動效果', () => {
      const Vibration = require('react-native').Vibration;
      const vibrateSpy = jest.spyOn(Vibration, 'vibrate');

      render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      expect(vibrateSpy).toHaveBeenCalledWith([0, 200, 100, 200]);
    });

    it('epic 動畫應該循環播放 3 次', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.loop).toBe(true);
    });

    it('epic 應該在 5 秒後自動停止', async () => {
      const onComplete = jest.fn();

      render(
        <CelebrationAnimation level="epic" visible={true} onComplete={onComplete} />
      );

      // 快轉 5 秒
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('epic 應該包含特殊音效觸發', () => {
      const onSoundTrigger = jest.fn();

      render(
        <CelebrationAnimation 
          level="epic" 
          visible={true} 
          onSoundTrigger={onSoundTrigger}
        />
      );

      expect(onSoundTrigger).toHaveBeenCalledWith('epic');
    });

    it('epic 應該顯示成就文字動畫', () => {
      const { getByTestId } = render(
        <CelebrationAnimation 
          level="epic" 
          visible={true} 
          achievementText="完成 100 天連續運動！"
        />
      );

      const achievementText = getByTestId('achievement-text');
      expect(achievementText).toBeTruthy();
      expect(achievementText.props.children).toBe('完成 100 天連續運動！');
    });
  });

  describe('Animation Lifecycle', () => {
    it('組件卸載時應該清理動畫', () => {
      const { unmount, getByTestId } = render(
        <CelebrationAnimation level="fireworks" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      const resetSpy = jest.spyOn(animation, 'reset');

      unmount();

      expect(resetSpy).toHaveBeenCalled();
    });

    it('visible 切換為 false 時應該停止動畫', async () => {
      const { rerender, getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');

      rerender(<CelebrationAnimation level="basic" visible={false} />);

      await waitFor(() => {
        expect(animation.props.autoPlay).toBe(false);
      });
    });

    it('快速切換等級應該重置動畫', async () => {
      const { rerender, getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      const resetSpy = jest.spyOn(animation, 'reset');

      rerender(<CelebrationAnimation level="fireworks" visible={true} />);

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Custom Achievement Data', () => {
    it('應該顯示自定義成就圖示', () => {
      const { getByTestId } = render(
        <CelebrationAnimation 
          level="epic" 
          visible={true}
          achievementIcon="🏆"
        />
      );

      const icon = getByTestId('achievement-icon');
      expect(icon.props.children).toBe('🏆');
    });

    it('應該顯示自定義成就標題', () => {
      const { getByText } = render(
        <CelebrationAnimation 
          level="fireworks" 
          visible={true}
          achievementTitle="連續 7 天運動！"
          achievementText="堅持就是勝利"
        />
      );

      expect(getByText('連續 7 天運動！')).toBeTruthy();
      expect(getByText('堅持就是勝利')).toBeTruthy();
    });

    it('應該顯示成就元數據', () => {
      const metadata = {
        streak_days: 7,
        previous_best: 5,
      };

      const { getByText } = render(
        <CelebrationAnimation 
          level="fireworks" 
          visible={true}
          achievementMetadata={metadata}
        />
      );

      expect(getByText(/打破個人紀錄/i)).toBeTruthy();
    });
  });

  describe('Performance Optimization', () => {
    it('動畫應該使用 useNativeDriver', () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="basic" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      expect(animation.props.useNativeDriver).toBe(true);
    });

    it('應該在低效能裝置上降低動畫品質', () => {
      // Mock 低效能裝置
      const Platform = require('react-native').Platform;
      Platform.isTV = false;
      Platform.isPad = false;
      
      // 模擬低階裝置
      const mockPerformance = { hardwareConcurrency: 2 };
      global.navigator = { hardwareConcurrency: 2 } as any;

      const { getByTestId } = render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      const confetti = getByTestId('confetti-cannon');
      // 低效能裝置應該減少彩紙數量
      expect(confetti.props.count).toBeLessThanOrEqual(50);
    });

    it('背景中的動畫應該暫停', async () => {
      const { getByTestId } = render(
        <CelebrationAnimation level="fireworks" visible={true} />
      );

      const animation = getByTestId('lottie-animation');
      const pauseSpy = jest.spyOn(animation, 'pause');

      // 模擬 app 進入背景
      const AppState = require('react-native').AppState;
      AppState.currentState = 'background';
      AppState.emit('change', 'background');

      await waitFor(() => {
        expect(pauseSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('動畫容器應該有正確的 accessibility label', () => {
      const { getByTestId } = render(
        <CelebrationAnimation 
          level="epic" 
          visible={true}
          achievementText="完成首次運動"
        />
      );

      const container = getByTestId('celebration-container');
      expect(container.props.accessibilityLabel).toBe('慶祝動畫：完成首次運動');
    });

    it('應該支援減少動態效果設定', () => {
      // Mock 系統減少動態效果設定
      const AccessibilityInfo = require('react-native').AccessibilityInfo;
      AccessibilityInfo.isReduceMotionEnabled = jest.fn().mockResolvedValue(true);

      const { queryByTestId } = render(
        <CelebrationAnimation level="epic" visible={true} />
      );

      // 應該顯示靜態版本
      const staticVersion = queryByTestId('celebration-static');
      expect(staticVersion).toBeTruthy();
    });

    it('完成動畫後應該宣告成就', async () => {
      const AccessibilityInfo = require('react-native').AccessibilityInfo;
      const announceSpy = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');

      const { getByTestId } = render(
        <CelebrationAnimation 
          level="basic" 
          visible={true}
          achievementText="完成首次運動"
        />
      );

      const animation = getByTestId('lottie-animation');
      animation.props.onAnimationFinish();

      await waitFor(() => {
        expect(announceSpy).toHaveBeenCalledWith('成就達成：完成首次運動');
      });
    });
  });

  describe('Sound Integration', () => {
    it('應該在動畫開始時播放音效', () => {
      const onSoundTrigger = jest.fn();

      render(
        <CelebrationAnimation 
          level="fireworks" 
          visible={true}
          onSoundTrigger={onSoundTrigger}
        />
      );

      expect(onSoundTrigger).toHaveBeenCalledWith('fireworks');
    });

    it('靜音模式應該跳過音效', () => {
      const onSoundTrigger = jest.fn();

      render(
        <CelebrationAnimation 
          level="epic" 
          visible={true}
          muted={true}
          onSoundTrigger={onSoundTrigger}
        />
      );

      expect(onSoundTrigger).not.toHaveBeenCalled();
    });
  });
});
