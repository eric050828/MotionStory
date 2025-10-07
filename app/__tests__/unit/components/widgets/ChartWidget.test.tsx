/**
 * ChartWidget Component Unit Tests (T038)
 * TDD 紅燈階段: 測試圖表 Widget 元件
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ChartWidget } from '../../../../src/components/widgets/ChartWidget';

describe('ChartWidget Component', () => {
  const mockData = [
    { x: '週一', y: 30 },
    { x: '週二', y: 45 },
    { x: '週三', y: 60 },
    { x: '週四', y: 40 },
    { x: '週五', y: 70 },
  ];

  describe('基本渲染', () => {
    it('應該正確渲染圖表容器', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      expect(getByTestId('chart-widget')).toBeTruthy();
    });

    it('應該顯示標題', () => {
      const { getByText } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      expect(getByText('每週運動時間')).toBeTruthy();
    });

    it('沒有標題時不應該渲染標題文字', () => {
      const { queryByText } = render(
        <ChartWidget
          data={mockData}
          type="bar"
        />
      );

      // 不應該有任何標題文字
      expect(queryByText(/週/)).toBeNull();
    });
  });

  describe('圖表類型', () => {
    it('type="bar" 應該渲染長條圖', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      expect(getByTestId('chart-bar')).toBeTruthy();
    });

    it('type="line" 應該渲染折線圖', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="line"
        />
      );

      expect(getByTestId('chart-line')).toBeTruthy();
    });

    it('type="area" 應該渲染區域圖', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="area"
        />
      );

      expect(getByTestId('chart-area')).toBeTruthy();
    });

    it('type="pie" 應該渲染圓餅圖', () => {
      const pieData = [
        { x: '跑步', y: 30 },
        { x: '瑜伽', y: 25 },
        { x: '重訓', y: 45 },
      ];

      const { getByTestId } = render(
        <ChartWidget
          data={pieData}
          title="運動類型分布"
          type="pie"
        />
      );

      expect(getByTestId('chart-pie')).toBeTruthy();
    });
  });

  describe('資料綁定', () => {
    it('應該正確傳遞資料到 Victory 圖表', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.data).toEqual(mockData);
    });

    it('應該處理空資料陣列', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={[]}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.data).toEqual([]);
    });

    it('應該處理單一資料點', () => {
      const singleData = [{ x: '週一', y: 30 }];

      const { getByTestId } = render(
        <ChartWidget
          data={singleData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.data).toEqual(singleData);
    });
  });

  describe('圖表顏色', () => {
    it('應該套用預設主題色', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.style?.data?.fill).toBe('#007AFF');
    });

    it('應該支援自訂顏色', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          color="#FF3B30"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.style?.data?.fill).toBe('#FF3B30');
    });

    it('圓餅圖應該支援多色配置', () => {
      const pieData = [
        { x: '跑步', y: 30 },
        { x: '瑜伽', y: 25 },
        { x: '重訓', y: 45 },
      ];

      const colors = ['#007AFF', '#34C759', '#FF9500'];

      const { getByTestId } = render(
        <ChartWidget
          data={pieData}
          title="運動類型分布"
          type="pie"
          colorScale={colors}
        />
      );

      const chart = getByTestId('chart-pie');
      expect(chart.props.colorScale).toEqual(colors);
    });
  });

  describe('圖表尺寸', () => {
    it('應該套用預設寬度和高度', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.width).toBe(350);
      expect(chart.props.height).toBe(200);
    });

    it('應該支援自訂寬度和高度', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          width={400}
          height={250}
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.width).toBe(400);
      expect(chart.props.height).toBe(250);
    });
  });

  describe('Victory Native 整合', () => {
    it('長條圖應該使用 VictoryBar 元件', () => {
      const { UNSAFE_getByType } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      expect(UNSAFE_getByType('VictoryBar')).toBeTruthy();
    });

    it('折線圖應該使用 VictoryLine 元件', () => {
      const { UNSAFE_getByType } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="line"
        />
      );

      expect(UNSAFE_getByType('VictoryLine')).toBeTruthy();
    });

    it('應該使用 VictoryChart 容器', () => {
      const { UNSAFE_getByType } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      expect(UNSAFE_getByType('VictoryChart')).toBeTruthy();
    });

    it('應該包含 VictoryAxis 座標軸', () => {
      const { UNSAFE_getAllByType } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const axes = UNSAFE_getAllByType('VictoryAxis');
      expect(axes.length).toBeGreaterThanOrEqual(2); // X軸 + Y軸
    });
  });

  describe('圖表標籤和樣式', () => {
    it('應該顯示 X 軸標籤', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          xAxisLabel="日期"
        />
      );

      const xAxis = getByTestId('chart-x-axis');
      expect(xAxis.props.label).toBe('日期');
    });

    it('應該顯示 Y 軸標籤', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          yAxisLabel="時間 (分鐘)"
        />
      );

      const yAxis = getByTestId('chart-y-axis');
      expect(yAxis.props.label).toBe('時間 (分鐘)');
    });

    it('應該套用圖表主題樣式', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.theme).toBeDefined();
    });
  });

  describe('動畫效果', () => {
    it('應該啟用動畫', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.animate).toBeTruthy();
    });

    it('應該支援禁用動畫', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          animate={false}
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.animate).toBe(false);
    });
  });

  describe('自訂樣式', () => {
    it('應該套用自訂容器樣式', () => {
      const customStyle = { backgroundColor: '#F5F5F5' };

      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
          style={customStyle}
        />
      );

      const widget = getByTestId('chart-widget');
      expect(widget.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });
  });

  describe('邊界情況', () => {
    it('應該處理負數資料', () => {
      const negativeData = [
        { x: '週一', y: -10 },
        { x: '週二', y: 20 },
        { x: '週三', y: -5 },
      ];

      const { getByTestId } = render(
        <ChartWidget
          data={negativeData}
          title="每週變化"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.data).toEqual(negativeData);
    });

    it('應該處理大數值', () => {
      const largeData = [
        { x: '週一', y: 10000 },
        { x: '週二', y: 25000 },
        { x: '週三', y: 50000 },
      ];

      const { getByTestId } = render(
        <ChartWidget
          data={largeData}
          title="大數值測試"
          type="bar"
        />
      );

      const chart = getByTestId('chart-bar');
      expect(chart.props.data).toEqual(largeData);
    });

    it('應該處理小數資料', () => {
      const decimalData = [
        { x: '週一', y: 3.5 },
        { x: '週二', y: 4.2 },
        { x: '週三', y: 2.8 },
      ];

      const { getByTestId } = render(
        <ChartWidget
          data={decimalData}
          title="小數測試"
          type="line"
        />
      );

      const chart = getByTestId('chart-line');
      expect(chart.props.data).toEqual(decimalData);
    });
  });

  describe('無障礙測試', () => {
    it('應該設定正確的 accessibility label', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const widget = getByTestId('chart-widget');
      expect(widget.props.accessibilityLabel).toBe('每週運動時間圖表');
    });

    it('應該設定 accessibility role', () => {
      const { getByTestId } = render(
        <ChartWidget
          data={mockData}
          title="每週運動時間"
          type="bar"
        />
      );

      const widget = getByTestId('chart-widget');
      expect(widget.props.accessibilityRole).toBe('image');
    });
  });
});
