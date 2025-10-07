/**
 * Button Component Unit Tests (T033)
 * TDD 紅燈階段: 測試 Button 元件各種狀態
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../../../../src/components/Button';

describe('Button Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染按鈕標題', () => {
      const { getByText } = render(
        <Button title="測試按鈕" onPress={() => {}} />
      );
      expect(getByText('測試按鈕')).toBeTruthy();
    });

    it('應該觸發 onPress 事件', () => {
      const onPressMock = jest.fn();
      const { getByText } = render(
        <Button title="點擊我" onPress={onPressMock} />
      );

      fireEvent.press(getByText('點擊我'));
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants 變體測試', () => {
    it('應該套用 primary 變體樣式', () => {
      const { getByText } = render(
        <Button title="Primary" onPress={() => {}} variant="primary" />
      );
      const button = getByText('Primary').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#007AFF' })
        ])
      );
    });

    it('應該套用 secondary 變體樣式', () => {
      const { getByText } = render(
        <Button title="Secondary" onPress={() => {}} variant="secondary" />
      );
      const button = getByText('Secondary').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#5856D6' })
        ])
      );
    });

    it('應該套用 outline 變體樣式', () => {
      const { getByText } = render(
        <Button title="Outline" onPress={() => {}} variant="outline" />
      );
      const button = getByText('Outline').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: '#007AFF'
          })
        ])
      );
    });

    it('應該套用 danger 變體樣式', () => {
      const { getByText } = render(
        <Button title="Danger" onPress={() => {}} variant="danger" />
      );
      const button = getByText('Danger').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ backgroundColor: '#FF3B30' })
        ])
      );
    });
  });

  describe('Sizes 尺寸測試', () => {
    it('應該套用 small 尺寸樣式', () => {
      const { getByText } = render(
        <Button title="Small" onPress={() => {}} size="small" />
      );
      const button = getByText('Small').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            paddingVertical: 8,
            paddingHorizontal: 16
          })
        ])
      );
    });

    it('應該套用 medium 尺寸樣式', () => {
      const { getByText } = render(
        <Button title="Medium" onPress={() => {}} size="medium" />
      );
      const button = getByText('Medium').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            paddingVertical: 12,
            paddingHorizontal: 24
          })
        ])
      );
    });

    it('應該套用 large 尺寸樣式', () => {
      const { getByText } = render(
        <Button title="Large" onPress={() => {}} size="large" />
      );
      const button = getByText('Large').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            paddingVertical: 16,
            paddingHorizontal: 32
          })
        ])
      );
    });
  });

  describe('Loading 載入狀態', () => {
    it('應該在 loading 時顯示 ActivityIndicator', () => {
      const { queryByText, UNSAFE_getByType } = render(
        <Button title="Loading" onPress={() => {}} loading />
      );

      expect(queryByText('Loading')).toBeNull();
      expect(UNSAFE_getByType('ActivityIndicator')).toBeTruthy();
    });

    it('loading 時應該禁用按鈕', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Button
          title="Loading"
          onPress={onPressMock}
          loading
          testID="button"
        />
      );

      const button = getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('primary variant loading 應該顯示白色 ActivityIndicator', () => {
      const { UNSAFE_getByType } = render(
        <Button title="Loading" onPress={() => {}} variant="primary" loading />
      );

      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.color).toBe('#FFFFFF');
    });

    it('outline variant loading 應該顯示藍色 ActivityIndicator', () => {
      const { UNSAFE_getByType } = render(
        <Button title="Loading" onPress={() => {}} variant="outline" loading />
      );

      const indicator = UNSAFE_getByType('ActivityIndicator');
      expect(indicator.props.color).toBe('#007AFF');
    });
  });

  describe('Disabled 禁用狀態', () => {
    it('disabled 時應該有 50% 不透明度', () => {
      const { getByText } = render(
        <Button title="Disabled" onPress={() => {}} disabled />
      );

      const button = getByText('Disabled').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ opacity: 0.5 })
        ])
      );
    });

    it('disabled 時不應該觸發 onPress', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Button
          title="Disabled"
          onPress={onPressMock}
          disabled
          testID="button"
        />
      );

      fireEvent.press(getByTestId('button'));
      expect(onPressMock).not.toHaveBeenCalled();
    });
  });

  describe('自訂樣式', () => {
    it('應該套用自訂 button 樣式', () => {
      const customStyle = { marginTop: 20 };
      const { getByText } = render(
        <Button
          title="Custom"
          onPress={() => {}}
          style={customStyle}
        />
      );

      const button = getByText('Custom').parent;
      expect(button?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('應該套用自訂 text 樣式', () => {
      const customTextStyle = { fontSize: 20 };
      const { getByText } = render(
        <Button
          title="Custom"
          onPress={() => {}}
          textStyle={customTextStyle}
        />
      );

      const text = getByText('Custom');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customTextStyle)
        ])
      );
    });
  });
});
