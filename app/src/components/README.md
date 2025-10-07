# MotionStory UI Components

本目錄包含 MotionStory mobile app 的所有 UI 元件。

## 目錄結構

```
components/
├── ui/                         # 基礎 UI 元件
│   ├── Loading.tsx            # T125: 載入狀態元件
│   └── index.ts
├── animations/                 # 慶祝動畫元件
│   ├── FireworksCelebration.tsx      # T127: 煙火動畫
│   ├── ConfettiAnimation.tsx         # T128: 紙屑動畫
│   ├── EpicCelebration.tsx           # T129: 史詩級動畫
│   └── index.ts
├── widgets/                    # Dashboard Widget 元件
│   ├── WidgetContainer.tsx           # T139: Widget 容器
│   ├── ProgressWidget.tsx            # T130: 進度環
│   ├── RecentWorkoutsWidget.tsx      # T131: 最近運動
│   ├── AchievementShowcaseWidget.tsx # T132: 成就展示
│   ├── WorkoutHeatmapWidget.tsx      # T133: 運動熱力圖
│   ├── StatsComparisonWidget.tsx     # T134: 數據對比
│   ├── GoalTrackerWidget.tsx         # T135: 目標追蹤
│   ├── DistanceLeaderboardWidget.tsx # T136: 距離排行榜
│   ├── StreakCounterWidget.tsx       # T137: 連續天數
│   ├── QuickActionsWidget.tsx        # T138: 快速操作
│   ├── WidgetPicker.tsx              # T140: Widget 選擇器
│   ├── DraggableWidget.tsx           # T141: 可拖拉 Widget
│   └── index.ts
└── index.ts                    # 統一導出所有元件
```

## 元件分類

### 基礎 UI 元件

#### Loading (T125)
- **用途**: 顯示載入狀態
- **特性**: 支援全螢幕和內嵌模式、可自訂文字和顏色
- **使用範例**:
```tsx
import { Loading } from '@/components';

<Loading fullscreen text="載入中..." />
<Loading size="small" />
```

### 慶祝動畫元件

#### FireworksCelebration (T127)
- **用途**: 重大成就的煙火慶祝動畫
- **特性**: 多個煙火爆炸效果、漸變顏色、自動完成回調
- **使用範例**:
```tsx
import { FireworksCelebration } from '@/components';

<FireworksCelebration
  duration={3000}
  onComplete={() => console.log('完成')}
/>
```

#### ConfettiAnimation (T128)
- **用途**: 一般成就的紙屑慶祝動畫
- **特性**: 多彩紙屑飄落、旋轉效果、可自訂數量
- **使用範例**:
```tsx
import { ConfettiAnimation } from '@/components';

<ConfettiAnimation
  count={50}
  duration={3000}
  onComplete={() => console.log('完成')}
/>
```

#### EpicCelebration (T129)
- **用途**: 史詩級成就的最高等級慶祝動畫
- **特性**: 結合煙火、紙屑、閃光、星爆效果
- **使用範例**:
```tsx
import { EpicCelebration } from '@/components';

<EpicCelebration
  duration={5000}
  onComplete={() => console.log('完成')}
/>
```

### Dashboard Widgets

#### WidgetContainer (T139)
- **用途**: 所有 Widget 的統一容器
- **特性**: 標題、圖示、設定按鈕、點擊事件
- **使用範例**:
```tsx
import { WidgetContainer } from '@/components';

<WidgetContainer
  title="我的 Widget"
  icon="🎯"
  onSettings={() => console.log('設定')}
>
  {/* Widget 內容 */}
</WidgetContainer>
```

#### ProgressWidget (T130)
- **用途**: 顯示目標完成進度的進度環
- **特性**: 圓形進度條、動畫效果、支援多種指標類型
- **指標類型**: distance, duration, calories, workouts
- **使用範例**:
```tsx
import { ProgressWidget } from '@/components';

<ProgressWidget
  metric="distance"
  currentValue={7.5}
  goalValue={10}
/>
```

#### RecentWorkoutsWidget (T131)
- **用途**: 顯示最近的運動記錄列表
- **特性**: 運動類型圖示、時間格式化、點擊事件
- **使用範例**:
```tsx
import { RecentWorkoutsWidget } from '@/components';

<RecentWorkoutsWidget
  workouts={workoutsList}
  maxItems={5}
  onWorkoutPress={(workout) => console.log(workout)}
/>
```

#### AchievementShowcaseWidget (T132)
- **用途**: 展示最新獲得的成就
- **特性**: 成就圖示、描述、獲得時間
- **使用範例**:
```tsx
import { AchievementShowcaseWidget } from '@/components';

<AchievementShowcaseWidget
  achievements={achievementsList}
  maxItems={3}
  onAchievementPress={(achievement) => console.log(achievement)}
/>
```

#### WorkoutHeatmapWidget (T133)
- **用途**: GitHub 風格的運動活動熱力圖
- **特性**: 365 天資料、顏色深淺表示活躍度、月份標籤
- **使用範例**:
```tsx
import { WorkoutHeatmapWidget } from '@/components';

<WorkoutHeatmapWidget
  data={heatmapData}
  year={2025}
/>
```

#### StatsComparisonWidget (T134)
- **用途**: 比較不同時期的運動數據
- **特性**: 百分比變化、增減指示、多指標對比
- **使用範例**:
```tsx
import { StatsComparisonWidget } from '@/components';

<StatsComparisonWidget
  currentPeriod={thisWeekStats}
  previousPeriod={lastWeekStats}
/>
```

#### GoalTrackerWidget (T135)
- **用途**: 追蹤多個設定目標的進度
- **特性**: 進度條、完成狀態、剩餘天數
- **使用範例**:
```tsx
import { GoalTrackerWidget } from '@/components';

<GoalTrackerWidget goals={goalsList} />
```

#### DistanceLeaderboardWidget (T136)
- **用途**: 個人距離排行榜
- **特性**: 獎牌圖示、時期標籤、當前時期高亮
- **使用範例**:
```tsx
import { DistanceLeaderboardWidget } from '@/components';

<DistanceLeaderboardWidget
  entries={leaderboardData}
  metric="distance"
  period="monthly"
/>
```

#### StreakCounterWidget (T137)
- **用途**: 顯示運動連續天數
- **特性**: 火焰圖示、里程碑提示、最長紀錄
- **使用範例**:
```tsx
import { StreakCounterWidget } from '@/components';

<StreakCounterWidget
  currentStreak={15}
  longestStreak={30}
  lastWorkoutDate="2025-10-06"
/>
```

#### QuickActionsWidget (T138)
- **用途**: 常用操作的快捷按鈕
- **特性**: 自訂操作、圖示、顏色
- **使用範例**:
```tsx
import { QuickActionsWidget } from '@/components';

<QuickActionsWidget
  actions={[
    { id: 'new', label: '新增', icon: '➕', onPress: () => {} }
  ]}
/>
```

#### WidgetPicker (T140)
- **用途**: Widget 選擇器 Modal
- **特性**: 分類篩選、Widget 預覽、新增功能
- **使用範例**:
```tsx
import { WidgetPicker } from '@/components';

<WidgetPicker
  visible={showPicker}
  onClose={() => setShowPicker(false)}
  onSelectWidget={(type) => addWidget(type)}
/>
```

#### DraggableWidget (T141)
- **用途**: 可拖拉重新排序的 Widget 容器
- **特性**: 長按拖拉、拖拉時縮放效果、拖拉結束回調
- **使用範例**:
```tsx
import { DraggableWidget } from '@/components';

<DraggableWidget
  id="widget-1"
  title="我的 Widget"
  icon="🎯"
  draggable={true}
  onDragStart={(id) => console.log('開始拖拉', id)}
  onDragEnd={(id, x, y) => console.log('結束拖拉', id, x, y)}
>
  {/* Widget 內容 */}
</DraggableWidget>
```

## 技術規格

### 使用的技術棧
- **React Native**: 核心框架
- **TypeScript**: 類型安全
- **react-native-reanimated**: 高性能動畫
- **react-native-gesture-handler**: 手勢處理
- **react-native-svg**: SVG 圖形支援

### 設計原則
1. **可重用性**: 所有元件設計為可重用
2. **類型安全**: 完整的 TypeScript 類型定義
3. **性能優化**: 使用 Reanimated 進行流暢動畫
4. **一致性**: 統一的樣式和行為模式
5. **可訪問性**: 支援觸控和視覺反饋

### 樣式規範
- **顏色**:
  - 主色: `#007AFF` (藍色)
  - 成功: `#34C759` (綠色)
  - 警告: `#FF9500` (橙色)
  - 錯誤: `#FF3B30` (紅色)
  - 背景: `#F5F5F5` (淺灰)
- **間距**: 使用 4 的倍數 (4, 8, 12, 16, 20, 24...)
- **圓角**: 8-12px 為主
- **陰影**: elevation 2-4

## 使用方式

### 安裝依賴
```bash
npm install react-native-reanimated react-native-gesture-handler react-native-svg
```

### 導入元件
```tsx
// 導入單個元件
import { Loading } from '@/components/ui';
import { FireworksCelebration } from '@/components/animations';
import { ProgressWidget } from '@/components/widgets';

// 或從根目錄導入
import { Loading, FireworksCelebration, ProgressWidget } from '@/components';
```

### 元件組合範例
```tsx
import React from 'react';
import { View } from 'react-native';
import {
  ProgressWidget,
  RecentWorkoutsWidget,
  StreakCounterWidget
} from '@/components';

const Dashboard = () => {
  return (
    <View>
      <ProgressWidget
        metric="distance"
        currentValue={7.5}
        goalValue={10}
      />
      <RecentWorkoutsWidget
        workouts={workouts}
        onWorkoutPress={handlePress}
      />
      <StreakCounterWidget
        currentStreak={15}
        longestStreak={30}
      />
    </View>
  );
};
```

## 測試

所有元件都應該有對應的單元測試檔案在 `__tests__/` 目錄中。

## 開發指南

### 新增 Widget
1. 在 `widgets/` 目錄建立新檔案
2. 使用 `WidgetContainer` 包裝內容
3. 遵循現有的樣式和結構模式
4. 加入到 `widgets/index.ts` 導出
5. 更新 `types/dashboard.ts` 中的 Widget 類型

### 新增動畫
1. 在 `animations/` 目錄建立新檔案
2. 使用 `react-native-reanimated` 實作動畫
3. 提供 `onComplete` 回調
4. 加入到 `animations/index.ts` 導出

## 後續開發

待實作的功能:
- [ ] Widget 拖拉排序的網格佈局
- [ ] Widget 配置儲存到本地
- [ ] 更多圖表類型 Widget
- [ ] 自訂 Widget 主題
- [ ] Widget 資料刷新機制
