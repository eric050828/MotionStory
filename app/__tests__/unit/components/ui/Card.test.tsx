/**
 * Card Component Unit Tests (T034)
 * TDD 紅燈階段: 測試 Card 元件渲染與互動
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Card } from '../../../../src/components/Card';

describe('Card Component', () => {
  describe('基本渲染', () => {
    it('應該正確渲染 children 內容', () => {
      const { getByText } = render(
        <Card>
          <Text>卡片內容</Text>
        </Card>
      );

      expect(getByText('卡片內容')).toBeTruthy();
    });

    it('應該渲染多個 children', () => {
      const { getByText } = render(
        <Card>
          <Text>標題</Text>
          <Text>內容</Text>
          <Text>底部</Text>
        </Card>
      );

      expect(getByText('標題')).toBeTruthy();
      expect(getByText('內容')).toBeTruthy();
      expect(getByText('底部')).toBeTruthy();
    });

    it('應該套用預設樣式', () => {
      const { getByTestId } = render(
        <Card>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16
          })
        ])
      );
    });
  });

  describe('Elevation 陰影高度', () => {
    it('應該套用預設 elevation 2', () => {
      const { getByTestId } = render(
        <Card>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ elevation: 2 })
        ])
      );
    });

    it('應該套用自訂 elevation', () => {
      const { getByTestId } = render(
        <Card elevation={5}>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ elevation: 5 })
        ])
      );
    });

    it('應該支援 elevation 0 (無陰影)', () => {
      const { getByTestId } = render(
        <Card elevation={0}>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ elevation: 0 })
        ])
      );
    });
  });

  describe('onPress 互動', () => {
    it('沒有 onPress 時應該渲染 View', () => {
      const { getByTestId, UNSAFE_queryByType } = render(
        <Card>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.type).toBe('View');
    });

    it('有 onPress 時應該渲染 TouchableOpacity', () => {
      const { getByTestId } = render(
        <Card onPress={() => {}}>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.type.displayName).toBe('TouchableOpacity');
    });

    it('應該觸發 onPress 事件', () => {
      const onPressMock = jest.fn();
      const { getByTestId } = render(
        <Card onPress={onPressMock}>
          <View testID="card-content" />
        </Card>
      );

      const card = getByTestId('card-content').parent;
      fireEvent.press(card);
      expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it('應該設定 activeOpacity 為 0.8', () => {
      const { getByTestId } = render(
        <Card onPress={() => {}}>
          <View testID="card-content" />
        </Card>
      );

      const card = getByTestId('card-content').parent;
      expect(card?.props.activeOpacity).toBe(0.8);
    });
  });

  describe('自訂樣式', () => {
    it('應該套用自訂樣式', () => {
      const customStyle = {
        marginTop: 20,
        backgroundColor: '#F0F0F0'
      };

      const { getByTestId } = render(
        <Card style={customStyle}>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });

    it('自訂樣式應該覆蓋預設樣式', () => {
      const customStyle = {
        padding: 24,
        borderRadius: 16
      };

      const { getByTestId } = render(
        <Card style={customStyle}>
          <View testID="card-content" />
        </Card>
      );

      const cardContent = getByTestId('card-content').parent;
      expect(cardContent?.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining(customStyle)
        ])
      );
    });
  });

  describe('複雜內容測試', () => {
    it('應該正確渲染巢狀複雜內容', () => {
      const { getByText, getByTestId } = render(
        <Card>
          <View testID="header">
            <Text>標題</Text>
          </View>
          <View testID="body">
            <Text>內容</Text>
            <View testID="nested">
              <Text>巢狀內容</Text>
            </View>
          </View>
        </Card>
      );

      expect(getByTestId('header')).toBeTruthy();
      expect(getByTestId('body')).toBeTruthy();
      expect(getByTestId('nested')).toBeTruthy();
      expect(getByText('標題')).toBeTruthy();
      expect(getByText('內容')).toBeTruthy();
      expect(getByText('巢狀內容')).toBeTruthy();
    });
  });
});
