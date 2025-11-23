import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  YStack,
  XStack,
  ScrollView,
  H2,
  Paragraph,
  Button,
  Card,
  Spinner,
  AnimatePresence,
  Text,
  useTheme,
} from "tamagui";
import {
  Plus,
  Settings,
  LayoutGrid,
  Sparkles,
  // 新增：用於裝飾卡片的 Widget 類型圖示
  BarChart2,
  Table,
  Activity,
  Gauge,
  Map as MapIcon, // 避免與 JS Map 物件衝突
  Type,
} from "@tamagui/lucide-icons";
import useDashboardStore from "../../store/dashboardStore";
import { Widget } from "../../types/dashboard";
import { LinearGradient } from "tamagui/linear-gradient";
import { Motion } from "@legendapp/motion";
import { useThemeStore } from "../../store/useThemeStore";

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  DragDropEditor: { widgetId: string };
  WidgetPicker: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Helper: 取得對應類型的顏色 (保持原有邏輯) ---
const getWidgetColors = (
  theme: "light" | "dark"
): Record<string, { bg: string; color: string }> => {
  const isDark = theme === "dark";
  return {
    CHART: {
      bg: isDark ? "$blue7" : "$blue3",
      color: isDark ? "$blue12" : "$blue11",
    },
    TABLE: {
      bg: isDark ? "$green7" : "$green3",
      color: isDark ? "$green12" : "$green11",
    },
    KPI: {
      bg: isDark ? "$orange7" : "$orange3",
      color: isDark ? "$orange12" : "$orange11",
    },
    GAUGE: {
      bg: isDark ? "$yellow7" : "$yellow3",
      color: isDark ? "$yellow12" : "$yellow11",
    },
    MAP: {
      bg: isDark ? "$red7" : "$red3",
      color: isDark ? "$red12" : "$red11",
    },
    TEXT: {
      bg: isDark ? "$gray7" : "$gray3",
      color: isDark ? "$gray12" : "$gray11",
    },
    DEFAULT: {
      bg: isDark ? "$gray5" : "$gray2",
      color: isDark ? "$gray12" : "$gray11",
    },
  };
};

// --- Helper: 取得對應類型的 Icon (用於背景浮水印) ---
const getWidgetIcon = (type: string) => {
  switch (type) {
    case "CHART":
      return BarChart2;
    case "TABLE":
      return Table;
    case "KPI":
      return Activity;
    case "GAUGE":
      return Gauge;
    case "MAP":
      return MapIcon;
    case "TEXT":
      return Type;
    default:
      return LayoutGrid;
  }
};

// --- Helper: 陣列分塊 ---
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const DashboardStudioScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const themeValues = useTheme();
  const { theme } = useThemeStore();
  const { currentDashboard, loading, fetchDefaultDashboard, updateDashboard } =
    useDashboardStore();

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchDefaultDashboard();
  }, [fetchDefaultDashboard]);

  const handleAddWidget = () => navigation.navigate("WidgetPicker" as never);
  const handleEditWidget = (widget: Widget) => {
    navigation.navigate("DragDropEditor", { widgetId: widget.id });
  };

  const handleSave = async () => {
    if (!currentDashboard) return;
    try {
      await updateDashboard(currentDashboard.id, {
        widgets: currentDashboard.widgets,
      });
      Alert.alert("儲存成功", "儀表板已更新完成！", [
        { text: "太棒了", style: "default" },
      ]);
      setEditMode(false);
    } catch (err) {
      Alert.alert("儲存失敗", "網路不穩，請再試一次");
    }
  };

  const handleToggleEditMode = () => {
    if (editMode) handleSave();
    else setEditMode(true);
  };

  if (loading || !currentDashboard) {
    return (
      <YStack flex={1} bg="$background" jc="center" ai="center">
        <Spinner size="large" color="$brand" />
        <Paragraph mt="$4" color="$color">
          正在載入你的專屬儀表板...
        </Paragraph>
      </YStack>
    );
  }

  const widgetColors = getWidgetColors(theme as "light" | "dark");
  const hasWidgets = currentDashboard.widgets.length > 0;

  return (
    <YStack flex={1} bg="$background">
      {/* 毛玻璃 Header 背景 */}
      <LinearGradient
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={180}
        colors={
          editMode
            ? ["$green7", "$green8"]
            : theme === "dark"
            ? ["$blue7", "$blue8"]
            : ["$blue5", "$blue6"]
        }
        opacity={theme === "dark" ? 0.2 : 0.15}
        zIndex={-1}
      />
      <XStack
        bg="transparent"
        backdropFilter="blur(20px)"
        borderBottomWidth={1}
        borderColor="$borderColor"
        px="$4"
        py="$5"
        ai="center"
        jc="space-between"
        shadowColor="$shadowColor"
        shadowOpacity={0.05}
        shadowRadius={10}
        shadowOffset={{ width: 0, height: 2 }}
      >
        <YStack>
          <H2 color="$color" fontWeight="800">
            {currentDashboard.name}
          </H2>
          <XStack ai="center" gap="$2" mt="$1">
            <Text color={editMode ? "$green10" : "$blue10"} fontSize="$4">
              {editMode ? "編輯模式中" : "預覽模式"}
            </Text>
            {editMode && <Sparkles size={16} color="$green10" />}
          </XStack>
        </YStack>

        <Motion.View
          animate={{ scale: editMode ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            onPress={handleToggleEditMode}
            size="$4"
            bg={editMode ? "$green9" : "$blue9"}
            color="$color"
            fontWeight="600"
            iconAfter={editMode ? undefined : <Settings size={18} />}
            hoverStyle={{
              bg: editMode ? "$green10" : "$blue10",
            }}
          >
            {editMode ? "完成儲存" : "編輯儀表板"}
          </Button>
        </Motion.View>
      </XStack>

      {/* 主內容區 */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: editMode ? 180 : 40,
        }}
      >
        {hasWidgets ? (
          <YStack gap="$4">
            {chunkArray(currentDashboard.widgets, 2).map((row, rowIndex) => (
              <XStack key={rowIndex} gap="$4">
                {row.map((widget) => {
                  const colors =
                    widgetColors[widget.type.toUpperCase()] ||
                    widgetColors.DEFAULT;

                  // 決定邊框顏色：編輯模式為綠色，預覽模式為極淡的細線 (提升銳利度)
                  const currentBorderColor = editMode
                    ? "$green9"
                    : theme === "dark"
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)";

                  return (
                    <Motion.View
                      key={widget.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileTap={{ scale: 0.98 }} // 輕微按壓回饋
                    >
                      <Card
                        flex={1}
                        height={widget.size.height * 70 + 40}
                        onPress={() => editMode && handleEditWidget(widget)}
                        borderWidth={editMode ? 3 : 1}
                        borderColor={currentBorderColor}
                        borderStyle={editMode ? "dashed" : "solid"}
                        // 優化陰影質感
                        shadowColor="$shadowColor"
                        shadowOpacity={0.1}
                        shadowRadius={8}
                        shadowOffset={{ width: 0, height: 4 }}
                        overflow="hidden"
                        bg={colors.bg} // 保持原有背景色
                      >
                        {/* --- 設計升級：背景浮水印 Icon (Watermark) --- */}
                        <YStack
                          position="absolute"
                          bottom={-15}
                          right={-15}
                          opacity={0.15} // 極低透明度，若隱若現
                          rotate="-15deg"
                          zIndex={0}
                          pointerEvents="none"
                        >
                          {React.createElement(getWidgetIcon(widget.type), {
                            size: 100,
                            color: colors.color, // 跟隨該 Widget 類型的文字色
                          })}
                        </YStack>

                        {/* 卡片內容層 */}
                        <YStack p="$3.5" flex={1} zIndex={1} jc="space-between">
                          {/* 上半部：標題與設定 */}
                          <XStack jc="space-between" ai="flex-start">
                            <Paragraph
                              color={colors.color}
                              fontWeight="800"
                              fontSize="$5"
                              lineHeight="$5"
                              numberOfLines={2}
                              flex={1}
                              mr="$2"
                              // 文字陰影增加層次
                              textShadowColor="rgba(0,0,0,0.1)"
                              textShadowOffset={{ width: 0, height: 1 }}
                              textShadowRadius={2}
                            >
                              {widget.title}
                            </Paragraph>

                            {editMode && (
                              <Motion.View whileTap={{ rotate: 90 }}>
                                <Button
                                  size="$2"
                                  circular
                                  icon={Settings}
                                  bg="rgba(255,255,255,0.8)" // 半透明白底
                                  opacity={0.9}
                                  color="$color"
                                  elevation={2}
                                />
                              </Motion.View>
                            )}
                          </XStack>

                          {/* 下半部：資訊膠囊 (Chips) */}
                          <XStack gap="$2" ai="flex-end" flexWrap="wrap">
                            {/* 類型標籤 */}
                            <XStack
                              bg="rgba(0,0,0,0.1)" // 深色半透明底
                              px="$2"
                              py="$1"
                              borderRadius="$4"
                              ai="center"
                            >
                              <Text
                                color={colors.color}
                                fontSize="$1"
                                fontWeight="700"
                                opacity={0.9}
                                letterSpacing={0.5}
                              >
                                {widget.type}
                              </Text>
                            </XStack>

                            {/* 尺寸標籤 */}
                            <XStack
                              bg="rgba(255,255,255,0.25)" // 亮色半透明底 (Glass effect)
                              px="$2"
                              py="$1"
                              borderRadius="$4"
                              ai="center"
                              gap="$1.5"
                            >
                              <LayoutGrid size={10} color={colors.color} />
                              <Text
                                color={colors.color}
                                fontSize="$1"
                                fontWeight="700"
                              >
                                {widget.size.width}×{widget.size.height}
                              </Text>
                            </XStack>
                          </XStack>

                          {/* 隱藏狀態遮罩 */}
                          {!widget.visible && (
                            <XStack
                              position="absolute"
                              top={0}
                              left={0}
                              right={0}
                              bottom={0}
                              bg="rgba(0,0,0,0.5)"
                              jc="center"
                              ai="center"
                              zIndex={10}
                              backdropFilter="blur(2px)"
                            >
                              <XStack
                                bg="$red9"
                                px="$3"
                                py="$1.5"
                                borderRadius="$4"
                              >
                                <Text
                                  color="white"
                                  fontSize="$3"
                                  fontWeight="bold"
                                >
                                  已隱藏
                                </Text>
                              </XStack>
                            </XStack>
                          )}
                        </YStack>
                      </Card>
                    </Motion.View>
                  );
                })}

                {/* 新增 Widget 按鈕 */}
                {editMode && rowIndex === 0 && (
                  <Motion.View
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ flex: 1 }}
                  >
                    <Card
                      flex={1}
                      height={180}
                      bg="$backgroundHover"
                      borderWidth={3}
                      borderColor="$green9"
                      borderStyle="dashed"
                      jc="center"
                      ai="center"
                      gap="$3"
                      onPress={handleAddWidget}
                      hoverStyle={{ bg: "$green2" }}
                    >
                      <Motion.View
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          loop: Infinity,
                          duration: 4000,
                          ease: "linear",
                        }}
                      >
                        <Plus size={36} color="$green10" />
                      </Motion.View>
                      <Paragraph
                        fontSize="$6"
                        fontWeight="700"
                        color="$green10"
                      >
                        新增元件
                      </Paragraph>
                      <Paragraph fontSize="$3" color="$green10">
                        點擊選擇你要的 Widget
                      </Paragraph>
                    </Card>
                  </Motion.View>
                )}
              </XStack>
            ))}
          </YStack>
        ) : (
          <YStack flex={1} jc="center" ai="center" px="$6" py="$20">
            <Motion.View
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Sparkles size={64} color="$brand" opacity={0.6} />
            </Motion.View>
            <Paragraph fontSize="$8" fontWeight="700" color="$color" mt="$6">
              還沒有任何 Widget
            </Paragraph>
            <Paragraph color="$color" opacity={0.7} textAlign="center" mt="$3">
              {editMode
                ? "開始打造屬於你的專屬儀表板吧！"
                : "點擊右上角「編輯」按鈕開始新增"}
            </Paragraph>
            {editMode && (
              <Button
                size="$5"
                bg="$green9"
                mt="$8"
                onPress={handleAddWidget}
                icon={<Plus />}
              >
                新增第一個 Widget
              </Button>
            )}
          </YStack>
        )}
      </ScrollView>

      {/* 底部編輯工具列 */}
      <AnimatePresence>
        {editMode && (
          <Motion.View
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring" }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 20,
              paddingBottom: 40,
              backgroundColor: themeValues.background.val,
              borderTopWidth: 1,
              borderColor: themeValues.borderColor.val,
            }}
          >
            <XStack gap="$4">
              <Button
                flex={1}
                icon={<Plus />}
                bg="$green9"
                size="$4"
                onPress={handleAddWidget}
              >
                Widget 庫
              </Button>
              <Button
                flex={1}
                icon={<LayoutGrid />}
                bg="$blue9"
                size="$4"
                onPress={() => navigation.navigate("DragDropEditor" as never)}
              >
                自由佈局模式
              </Button>
            </XStack>
          </Motion.View>
        )}
      </AnimatePresence>
    </YStack>
  );
};

export default DashboardStudioScreen;
