import React, { useEffect, useState } from "react";
import { Alert, Dimensions } from "react-native";
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
import { Plus, Settings, LayoutGrid, Sparkles } from "@tamagui/lucide-icons";
import useDashboardStore from "../../store/dashboardStore";
import { Widget } from "../../types/dashboard";
import { LinearGradient } from "tamagui/linear-gradient";
import { Motion } from "@legendapp/motion";

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  DragDropEditor: { widgetId: string };
  WidgetPicker: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getWidgetGradients = (): Record<string, string[]> => {
  return {
    CHART: ["$activeBlue8", "$activeBlue9"],
    TABLE: ["$activeBlue7", "$activeBlue8"],
    KPI: ["$energyOrange6", "$activeBlue9"],
    GAUGE: ["$activeBlue6", "$activeBlue7"],
    MAP: ["$activeBlue5", "$activeBlue6"],
    TEXT: ["$light4", "$light5"],
    DEFAULT: ["$light3", "$light4"],
  };
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

const DashboardStudioScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
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

  const widgetGradients = getWidgetGradients();
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
        // ✅ 修正：這裡加入了判斷式，編輯模式時會變成綠色漸層
        colors={
          editMode
            ? ["$energyGreen6", "$energyGreen7"]
            : ["$activeBlue8", "$activeBlue9"]
        }
        opacity={0.12}
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
        shadowOpacity={0.1}
        shadowRadius={20}
        shadowOffset={{ width: 0, height: 4 }}
      >
        <YStack>
          <H2 color="$color" fontWeight="800">
            {currentDashboard.name}
          </H2>
          <XStack ai="center" gap="$2" mt="$1">
            <Text color={editMode ? "$success" : "$brand"} fontSize="$4">
              {editMode ? "編輯模式中" : "預覽模式"}
            </Text>
            {editMode && <Sparkles size={16} color="$success" />}
          </XStack>
        </YStack>

        <Motion.View
          animate={{ scale: editMode ? 1.1 : 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Button
            onPress={handleToggleEditMode}
            size="$4"
            bg={editMode ? "$success" : "$brand"}
            color="white"
            fontWeight="600"
            iconAfter={editMode ? undefined : <Settings size={18} />}
            hoverStyle={{
              bg: editMode ? "$energyGreen7" : "$activeBlue7",
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
                  const gradient =
                    widgetGradients[widget.type.toUpperCase()] ||
                    widgetGradients.DEFAULT;

                  return (
                    <Motion.View
                      key={widget.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Card
                        flex={1}
                        height={widget.size.height * 70 + 40}
                        onPress={() => editMode && handleEditWidget(widget)}
                        borderWidth={editMode ? 3 : 1}
                        borderColor={editMode ? "$success" : "$borderColor"}
                        borderStyle={editMode ? "dashed" : "solid"}
                        elevate
                        overflow="hidden"
                        hoverStyle={
                          editMode ? { scale: 1.03, y: -4 } : { scale: 1.02 }
                        }
                        pressStyle={{ scale: 0.98 }}
                        bg="$backgroundHover"
                      >
                        <LinearGradient
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          colors={gradient}
                          opacity={0.85}
                        />
                        <YStack p="$4" flex={1} zIndex={1}>
                          <XStack jc="space-between" ai="center">
                            <Paragraph
                              color="white"
                              fontWeight="700"
                              fontSize="$6"
                              textShadowColor="rgba(0,0,0.4)"
                              textShadowOffset={{ width: 0, height: 1 }}
                              textShadowRadius={4}
                            >
                              {widget.title}
                            </Paragraph>
                            {editMode && (
                              <Motion.View whileTap={{ rotate: 90 }}>
                                <Button
                                  size="$2"
                                  circular
                                  icon={Settings}
                                  bg="white"
                                  opacity={0.9}
                                  color="$color"
                                />
                              </Motion.View>
                            )}
                          </XStack>

                          <YStack flex={1} jc="center" ai="center" gap="$2">
                            <Paragraph
                              color="white"
                              fontWeight="500"
                              opacity={0.9}
                            >
                              {widget.type.replace(/_/g, " ")}
                            </Paragraph>
                            <XStack
                              bg="rgba(255,255,255,0.2)"
                              px="$3"
                              py="$1"
                              borderRadius="$3"
                              ai="center"
                              gap="$1"
                            >
                              <LayoutGrid size={14} color="white" />
                              <Text color="white" fontSize="$2">
                                {widget.size.width} × {widget.size.height}
                              </Text>
                            </XStack>
                          </YStack>

                          {!widget.visible && (
                            <XStack
                              position="absolute"
                              top={8}
                              right={8}
                              bg="$red9"
                              px="$2"
                              py="$1"
                              borderRadius="$2"
                              opacity={0.9}
                            >
                              <Text
                                color="white"
                                fontSize="$1"
                                fontWeight="600"
                              >
                                已隱藏
                              </Text>
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
                      borderColor="$success"
                      borderStyle="dashed"
                      jc="center"
                      ai="center"
                      gap="$3"
                      onPress={handleAddWidget}
                      hoverStyle={{ bg: "$energyGreen1" }}
                    >
                      <Motion.View
                        animate={{ rotate: [0, 360] }}
                        transition={{
                          loop: Infinity,
                          duration: 4000,
                          ease: "linear",
                        }}
                      >
                        <Plus size={36} color="$success" />
                      </Motion.View>
                      <Paragraph
                        fontSize="$6"
                        fontWeight="700"
                        color="$success"
                      >
                        新增元件
                      </Paragraph>
                      <Paragraph fontSize="$3" color="$success">
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
                bg="$success"
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
              // ✅ 使用主題背景色，避免變成透明或錯誤顏色
              backgroundColor: theme.background.val,
              borderTopWidth: 1,
              borderColor: theme.borderColor.val,
            }}
          >
            <XStack gap="$4">
              <Button
                flex={1}
                icon={<Plus />}
                bg="$success"
                size="$4"
                onPress={handleAddWidget}
              >
                Widget 庫
              </Button>
              <Button
                flex={1}
                icon={<LayoutGrid />}
                bg="$brand"
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
