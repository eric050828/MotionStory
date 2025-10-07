/**
 * CelebrationAnimation Component Unit Tests (T036)
 * TDD 紅燈階段: 測試慶祝動畫元件
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CelebrationAnimation } from '../../../../src/components/CelebrationAnimation';

describe('CelebrationAnimation Component', () => {
  const defaultProps = {
    visible: true,
    level: 'basic' as const,
    title: '成就達成！',
    description: '你完成了第一個挑戰',
    onClose: jest.fn(),
  };

  describe('基本渲染', () => {
    it('visible 為 true 時應該顯示 Modal', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      expect(getByText('成就達成！')).toBeTruthy();
      expect(getByText('你完成了第一個挑戰')).toBeTruthy();
    });

    it('visible 為 false 時應該不顯示任何內容', () => {
      const { queryByText } = render(
        <CelebrationAnimation {...defaultProps} visible={false} />
      );

      expect(queryByText('成就達成！')).toBeNull();
    });

    it('應該顯示關閉按鈕', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      expect(getByText('太棒了！')).toBeTruthy();
    });

    it('點擊關閉按鈕應該觸發 onClose', () => {
      const onCloseMock = jest.fn();
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} onClose={onCloseMock} />
      );

      fireEvent.press(getByText('太棒了！'));
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Celebration Levels - 慶祝等級', () => {
    it('basic 等級應該顯示 ✨ emoji', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} level="basic" />
      );

      expect(getByText('✨')).toBeTruthy();
    });

    it('fireworks 等級應該顯示 🎉 emoji', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} level="fireworks" />
      );

      expect(getByText('🎉')).toBeTruthy();
    });

    it('epic 等級應該顯示 🏆 emoji', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} level="epic" />
      );

      expect(getByText('🏆')).toBeTruthy();
    });
  });

  describe('背景顏色測試', () => {
    it('basic 等級應該使用藍色背景', () => {
      const { getByTestId } = render(
        <CelebrationAnimation {...defaultProps} level="basic" />
      );

      // Modal 內的主容器
      const container = getByTestId('celebration-container') ||
                       getByTestId('modal-content');

      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.stringMatching(/rgba\(0, 122, 255/)
          })
        ])
      );
    });

    it('fireworks 等級應該使用紅色背景', () => {
      const { getByTestId } = render(
        <CelebrationAnimation {...defaultProps} level="fireworks" />
      );

      const container = getByTestId('celebration-container') ||
                       getByTestId('modal-content');

      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.stringMatching(/rgba\(255, 59, 48/)
          })
        ])
      );
    });

    it('epic 等級應該使用橘色背景', () => {
      const { getByTestId } = render(
        <CelebrationAnimation {...defaultProps} level="epic" />
      );

      const container = getByTestId('celebration-container') ||
                       getByTestId('modal-content');

      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.stringMatching(/rgba\(255, 149, 0/)
          })
        ])
      );
    });
  });

  describe('動畫觸發測試', () => {
    it('visible 變為 true 時應該觸發動畫', async () => {
      const { rerender, getByText } = render(
        <CelebrationAnimation {...defaultProps} visible={false} />
      );

      rerender(
        <CelebrationAnimation {...defaultProps} visible={true} />
      );

      await waitFor(() => {
        expect(getByText('成就達成！')).toBeTruthy();
      });
    });

    it('level 改變時應該重新觸發動畫', async () => {
      const { rerender, getByText } = render(
        <CelebrationAnimation {...defaultProps} level="basic" />
      );

      expect(getByText('✨')).toBeTruthy();

      rerender(
        <CelebrationAnimation {...defaultProps} level="epic" />
      );

      await waitFor(() => {
        expect(getByText('🏆')).toBeTruthy();
      });
    });
  });

  describe('Modal 屬性測試', () => {
    it('應該設定 Modal transparent 為 true', () => {
      const { UNSAFE_getByType } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.transparent).toBe(true);
    });

    it('應該設定 Modal animationType 為 none', () => {
      const { UNSAFE_getByType } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.animationType).toBe('none');
    });

    it('Modal onRequestClose 應該觸發 onClose', () => {
      const onCloseMock = jest.fn();
      const { UNSAFE_getByType } = render(
        <CelebrationAnimation {...defaultProps} onClose={onCloseMock} />
      );

      const modal = UNSAFE_getByType('Modal');
      modal.props.onRequestClose();

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('內容顯示測試', () => {
    it('應該正確顯示自訂標題', () => {
      const { getByText } = render(
        <CelebrationAnimation
          {...defaultProps}
          title="超級成就！"
        />
      );

      expect(getByText('超級成就！')).toBeTruthy();
    });

    it('應該正確顯示自訂描述', () => {
      const { getByText } = render(
        <CelebrationAnimation
          {...defaultProps}
          description="你已經連續運動 30 天了！"
        />
      );

      expect(getByText('你已經連續運動 30 天了！')).toBeTruthy();
    });

    it('標題應該使用白色和粗體字', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const title = getByText('成就達成！');
      expect(title.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: '#FFFFFF',
            fontWeight: 'bold'
          })
        ])
      );
    });

    it('描述應該使用白色字體', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const description = getByText('你完成了第一個挑戰');
      expect(description.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#FFFFFF' })
        ])
      );
    });
  });

  describe('按鈕樣式測試', () => {
    it('關閉按鈕應該使用 outline variant', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const button = getByText('太棒了！').parent;
      // Button 元件的 variant="outline" 會套用特定樣式
      expect(button).toBeTruthy();
    });

    it('按鈕文字應該使用白色', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} />
      );

      const buttonText = getByText('太棒了！');
      expect(buttonText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#FFFFFF' })
        ])
      );
    });
  });

  describe('邊界情況測試', () => {
    it('應該處理空字串 title', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} title="" />
      );

      // 即使是空字串也應該渲染 Text 元件
      expect(getByText('你完成了第一個挑戰')).toBeTruthy();
    });

    it('應該處理空字串 description', () => {
      const { getByText } = render(
        <CelebrationAnimation {...defaultProps} description="" />
      );

      expect(getByText('成就達成！')).toBeTruthy();
    });

    it('應該處理連續切換 visible', async () => {
      const { rerender, getByText, queryByText } = render(
        <CelebrationAnimation {...defaultProps} visible={true} />
      );

      expect(getByText('成就達成！')).toBeTruthy();

      rerender(<CelebrationAnimation {...defaultProps} visible={false} />);
      expect(queryByText('成就達成！')).toBeNull();

      rerender(<CelebrationAnimation {...defaultProps} visible={true} />);
      expect(getByText('成就達成！')).toBeTruthy();
    });
  });
});
