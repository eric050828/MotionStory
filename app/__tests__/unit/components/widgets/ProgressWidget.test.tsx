/**
 * ProgressWidget Component Unit Tests (T037)
 * TDD 紅燈階段: 測試進度 Widget 元件
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ProgressWidget } from '../../../../src/components/widgets/ProgressWidget';

describe('ProgressWidget Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染進度條', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      expect(getByTestId('progress-widget')).toBeTruthy();
    });

    it('應該顯示標籤文字', () => {
      const { getByText } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('每週目標')).toBeTruthy();
    });

    it('應該顯示進度數字', () => {
      const { getByText } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('5 / 10')).toBeTruthy();
    });
  });

  describe('百分比計算', () => {
    it('應該正確計算 50% 進度', () => {
      const { getByText } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('50%')).toBeTruthy();
    });

    it('應該正確計算 0% 進度', () => {
      const { getByText } = render(
        <ProgressWidget
          current={0}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('0%')).toBeTruthy();
    });

    it('應該正確計算 100% 進度', () => {
      const { getByText } = render(
        <ProgressWidget
          current={10}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('100%')).toBeTruthy();
    });

    it('應該正確計算超過 100% 的進度', () => {
      const { getByText } = render(
        <ProgressWidget
          current={15}
          total={10}
          label="每週目標"
        />
      );

      expect(getByText('150%')).toBeTruthy();
    });

    it('應該處理小數百分比並四捨五入', () => {
      const { getByText } = render(
        <ProgressWidget
          current={1}
          total={3}
          label="每週目標"
        />
      );

      // 1/3 = 33.333... 應該顯示為 33%
      expect(getByText('33%')).toBeTruthy();
    });
  });

  describe('進度條寬度', () => {
    it('50% 進度應該顯示 50% 寬度', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '50%' })
        ])
      );
    });

    it('0% 進度應該顯示 0% 寬度', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={0}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '0%' })
        ])
      );
    });

    it('100% 進度應該顯示 100% 寬度', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={10}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '100%' })
        ])
      );
    });

    it('超過 100% 應該最多顯示 100% 寬度', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={15}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ width: '100%' })
        ])
      );
    });
  });

  describe('顏色變化測試', () => {
    it('進度 < 30% 應該使用紅色', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={2}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FF3B30' }) // 紅色
        ])
      );
    });

    it('進度 30-70% 應該使用橘色', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FF9500' }) // 橘色
        ])
      );
    });

    it('進度 > 70% 應該使用綠色', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={8}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#34C759' }) // 綠色
        ])
      );
    });

    it('進度 100% 應該使用綠色', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={10}
          total={10}
          label="每週目標"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#34C759' })
        ])
      );
    });
  });

  describe('邊界情況', () => {
    it('應該處理 total 為 0 的情況', () => {
      const { getByText } = render(
        <ProgressWidget
          current={0}
          total={0}
          label="每週目標"
        />
      );

      // 避免除以 0
      expect(getByText('0%')).toBeTruthy();
    });

    it('應該處理負數 current', () => {
      const { getByText } = render(
        <ProgressWidget
          current={-5}
          total={10}
          label="每週目標"
        />
      );

      // 負數應該顯示為 0%
      expect(getByText('0%')).toBeTruthy();
    });

    it('應該處理負數 total', () => {
      const { getByText } = render(
        <ProgressWidget
          current={5}
          total={-10}
          label="每週目標"
        />
      );

      // 負數 total 應該顯示為 0%
      expect(getByText('0%')).toBeTruthy();
    });
  });

  describe('自訂樣式', () => {
    it('應該套用自訂容器樣式', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
          style={customStyle}
        />
      );

      const widget = getByTestId('progress-widget');
      expect(widget.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('應該支援自訂進度條高度', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
          barHeight={10}
        />
      );

      const progressBar = getByTestId('progress-bar-container');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ height: 10 })
        ])
      );
    });
  });

  describe('可選屬性', () => {
    it('應該支援不顯示百分比文字', () => {
      const { queryByText } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
          showPercentage={false}
        />
      );

      expect(queryByText('50%')).toBeNull();
    });

    it('應該支援不顯示數字進度', () => {
      const { queryByText } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
          showNumbers={false}
        />
      );

      expect(queryByText('5 / 10')).toBeNull();
    });

    it('應該支援自訂進度條顏色', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
          color="#007AFF"
        />
      );

      const progressBar = getByTestId('progress-bar-fill');
      expect(progressBar.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#007AFF' })
        ])
      );
    });
  });

  describe('無障礙測試', () => {
    it('應該設定正確的 accessibility label', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      const widget = getByTestId('progress-widget');
      expect(widget.props.accessibilityLabel).toBe('每週目標: 5 / 10, 50% 完成');
    });

    it('應該設定 accessibility role', () => {
      const { getByTestId } = render(
        <ProgressWidget
          current={5}
          total={10}
          label="每週目標"
        />
      );

      const widget = getByTestId('progress-widget');
      expect(widget.props.accessibilityRole).toBe('progressbar');
    });
  });
});
