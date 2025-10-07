/**
 * Input Component Unit Tests (T035)
 * TDD 紅燈階段: 測試 Input 元件輸入與驗證
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Input } from '../../../../src/components/Input';

describe('Input Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染 TextInput', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="請輸入" />
      );

      expect(getByPlaceholderText('請輸入')).toBeTruthy();
    });

    it('應該顯示 label', () => {
      const { getByText } = render(
        <Input label="用戶名稱" placeholder="請輸入" />
      );

      expect(getByText('用戶名稱')).toBeTruthy();
    });

    it('沒有 label 時不應該顯示 label', () => {
      const { queryByText } = render(
        <Input placeholder="請輸入" />
      );

      // 應該沒有任何文字元素 (除了 placeholder)
      expect(queryByText(/^(?!請輸入).+/)).toBeNull();
    });
  });

  describe('文字輸入測試', () => {
    it('應該處理 onChangeText 事件', () => {
      const onChangeTextMock = jest.fn();
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          onChangeText={onChangeTextMock}
        />
      );

      const input = getByPlaceholderText('請輸入');
      fireEvent.changeText(input, '測試文字');

      expect(onChangeTextMock).toHaveBeenCalledWith('測試文字');
    });

    it('應該處理 value 屬性', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          value="初始值"
        />
      );

      const input = getByPlaceholderText('請輸入');
      expect(input.props.value).toBe('初始值');
    });
  });

  describe('密碼模式', () => {
    it('isPassword 啟用時應該隱藏文字', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入密碼"
          isPassword
        />
      );

      const input = getByPlaceholderText('請輸入密碼');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('應該顯示眼睛圖示按鈕', () => {
      const { getByText } = render(
        <Input
          placeholder="請輸入密碼"
          isPassword
        />
      );

      expect(getByText('👁️')).toBeTruthy();
    });

    it('點擊眼睛圖示應該切換顯示/隱藏密碼', () => {
      const { getByText, getByPlaceholderText } = render(
        <Input
          placeholder="請輸入密碼"
          isPassword
        />
      );

      const input = getByPlaceholderText('請輸入密碼');
      const toggleButton = getByText('👁️');

      // 初始應該隱藏
      expect(input.props.secureTextEntry).toBe(true);

      // 點擊顯示
      fireEvent.press(toggleButton);
      expect(getByText('🙈')).toBeTruthy();

      // 點擊隱藏
      fireEvent.press(getByText('🙈'));
      expect(getByText('👁️')).toBeTruthy();
    });
  });

  describe('錯誤狀態', () => {
    it('應該顯示錯誤訊息', () => {
      const { getByText } = render(
        <Input
          placeholder="請輸入"
          error="此欄位為必填"
        />
      );

      expect(getByText('此欄位為必填')).toBeTruthy();
    });

    it('有錯誤時應該套用錯誤樣式', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          error="此欄位為必填"
        />
      );

      const inputContainer = getByPlaceholderText('請輸入').parent;
      expect(inputContainer?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#FF3B30' })
        ])
      );
    });

    it('錯誤訊息應該使用紅色', () => {
      const { getByText } = render(
        <Input
          placeholder="請輸入"
          error="此欄位為必填"
        />
      );

      const errorText = getByText('此欄位為必填');
      expect(errorText.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ color: '#FF3B30' })
        ])
      );
    });
  });

  describe('Helper Text', () => {
    it('應該顯示 helperText', () => {
      const { getByText } = render(
        <Input
          placeholder="請輸入"
          helperText="請輸入至少 8 個字元"
        />
      );

      expect(getByText('請輸入至少 8 個字元')).toBeTruthy();
    });

    it('有錯誤時不應該顯示 helperText', () => {
      const { queryByText } = render(
        <Input
          placeholder="請輸入"
          error="此欄位為必填"
          helperText="請輸入至少 8 個字元"
        />
      );

      expect(queryByText('請輸入至少 8 個字元')).toBeNull();
    });
  });

  describe('Focus 狀態', () => {
    it('focus 時應該套用 focus 樣式', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="請輸入" />
      );

      const input = getByPlaceholderText('請輸入');
      const inputContainer = input.parent;

      fireEvent(input, 'focus');

      expect(inputContainer?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: '#007AFF',
            backgroundColor: '#FFFFFF'
          })
        ])
      );
    });

    it('blur 時應該移除 focus 樣式', () => {
      const { getByPlaceholderText } = render(
        <Input placeholder="請輸入" />
      );

      const input = getByPlaceholderText('請輸入');

      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      const inputContainer = input.parent;
      expect(inputContainer?.props.style).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ borderColor: '#007AFF' })
        ])
      );
    });
  });

  describe('圖示支援', () => {
    it('應該顯示 leftIcon', () => {
      const { getByTestId } = render(
        <Input
          placeholder="請輸入"
          leftIcon={<Text testID="left-icon">👤</Text>}
        />
      );

      expect(getByTestId('left-icon')).toBeTruthy();
    });

    it('應該顯示 rightIcon (非密碼模式)', () => {
      const { getByTestId } = render(
        <Input
          placeholder="請輸入"
          rightIcon={<Text testID="right-icon">✓</Text>}
        />
      );

      expect(getByTestId('right-icon')).toBeTruthy();
    });

    it('密碼模式應該隱藏 rightIcon', () => {
      const { queryByTestId } = render(
        <Input
          placeholder="請輸入密碼"
          isPassword
          rightIcon={<Text testID="right-icon">✓</Text>}
        />
      );

      expect(queryByTestId('right-icon')).toBeNull();
    });
  });

  describe('自訂樣式', () => {
    it('應該套用自訂 input 樣式', () => {
      const customStyle = { fontSize: 18 };
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          style={customStyle}
        />
      );

      const input = getByPlaceholderText('請輸入');
      expect(input.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });
  });

  describe('其他 TextInput 屬性', () => {
    it('應該支援 keyboardType', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          keyboardType="email-address"
        />
      );

      const input = getByPlaceholderText('請輸入');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('應該支援 maxLength', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          maxLength={10}
        />
      );

      const input = getByPlaceholderText('請輸入');
      expect(input.props.maxLength).toBe(10);
    });

    it('應該支援 autoCapitalize', () => {
      const { getByPlaceholderText } = render(
        <Input
          placeholder="請輸入"
          autoCapitalize="none"
        />
      );

      const input = getByPlaceholderText('請輸入');
      expect(input.props.autoCapitalize).toBe('none');
    });
  });
});
