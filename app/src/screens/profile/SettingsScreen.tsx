import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Avatar,
  Button,
  H4,
  Paragraph,
  ScrollView,
  Switch,
  XStack,
  YStack,
  Text,
  Separator,
  Spacer,
  Theme,
  View,
} from "tamagui";
import {
  LogOut,
  MapPin,
  BarChart2,
  Bell,
  Moon,
  Globe,
  Ruler,
  ChevronRight,
  User,
  Smartphone,
  Shield,
  Palette,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore";

// --- 重用組件：設定群組容器 ---
const SettingsGroup = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) => (
  <YStack space="$2" mb="$4">
    {title && (
      <Text
        fontSize="$3"
        color="$gray10"
        fontWeight="600"
        ml="$3"
        textTransform="uppercase"
      >
        {title}
      </Text>
    )}
    <YStack
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      separator={<Separator borderColor="$borderColor" />}
    >
      {children}
    </YStack>
  </YStack>
);

// --- 重用組件：單個設定項目 ---
interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  rightContent?: React.ReactNode;
  onPress?: () => void;
  isDestructive?: boolean;
}

const SettingItem = ({
  icon,
  label,
  rightContent,
  onPress,
  isDestructive,
}: SettingItemProps) => {
  return (
    <XStack
      padding="$3.5"
      alignItems="center"
      justifyContent="space-between"
      pressStyle={onPress ? { backgroundColor: "$gray3" } : undefined}
      onPress={onPress}
      backgroundColor="$background"
    >
      <XStack space="$3" alignItems="center">
        {/* 圖示容器 */}
        <View
          backgroundColor={isDestructive ? "$red2" : "$gray3"}
          padding="$2"
          borderRadius="$3"
        >
          {React.cloneElement(icon as React.ReactElement, {
            size: 18,
            color: isDestructive ? "$red10" : "$color",
          })}
        </View>
        <Text
          fontSize="$5"
          fontWeight="500"
          color={isDestructive ? "$red10" : "$color"}
        >
          {label}
        </Text>
      </XStack>

      {/* 右側內容 (Switch, 文字, 或箭頭) */}
      <XStack alignItems="center" space="$2">
        {rightContent}
        {onPress && !rightContent && <ChevronRight size={18} color="$gray9" />}
      </XStack>
    </XStack>
  );
};

const SettingsScreen: React.FC = () => {
  const { user, logout, updatePrivacySettings } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  // 本地狀態 (如果需要樂觀更新 UI)
  const [loading, setLoading] = useState(false);

  // 處理開關切換 (自動儲存)
  const handleTogglePrivacy = async (
    key: "share_location" | "share_detailed_stats",
    value: boolean
  ) => {
    // 這裡可以做樂觀更新 (Optimistic UI)，這裡簡化直接呼叫 API
    try {
      await updatePrivacySettings({
        ...user?.privacy_settings, // 保持其他設定不變
        [key]: value,
      });
      // 不需要 Alert，開關本身就是回饋，除非失敗
    } catch (err) {
      Alert.alert("更新失敗", "無法更新設定，請檢查網路連線");
    }
  };

  const handleLogout = () => {
    Alert.alert("登出", "確定要登出目前的帳號嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          await logout();
          setLoading(false);
        },
      },
    ]);
  };

  // 主題切換按鈕 (Segmented Control 風格)
  const ThemeSelector = () => (
    <XStack backgroundColor="$gray3" p="$1" borderRadius="$4">
      {(["light", "dark", "system"] as const).map((t) => {
        const isActive = theme === t;
        return (
          <Button
            key={t}
            flex={1}
            size="$3"
            chromeless={!isActive}
            theme={isActive ? "active" : undefined}
            backgroundColor={isActive ? "$background" : "transparent"}
            color={isActive ? "$color" : "$gray10"}
            borderRadius="$3"
            onPress={() => setTheme(t)}
            animation="quick"
            pressStyle={{ opacity: 0.8 }}
          >
            {t === "light" ? "淺色" : t === "dark" ? "深色" : "系統"}
          </Button>
        );
      })}
    </XStack>
  );

  return (
    <ScrollView backgroundColor="$gray2" showsVerticalScrollIndicator={false}>
      <YStack padding="$4" space="$5" paddingBottom="$10">
        {/* Header Title */}
        <H4 fontWeight="800" marginTop="$2">
          設定
        </H4>

        {/* 1. 用戶資料卡片 (大頭貼) */}
        {user && (
          <XStack
            backgroundColor="$background"
            borderRadius="$5"
            padding="$4"
            alignItems="center"
            space="$4"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Avatar circular size="$8">
              <Avatar.Image
                src={`https://ui-avatars.com/api/?name=${user.display_name}`}
              />
              <Avatar.Fallback backgroundColor="$blue10" />
            </Avatar>
            <YStack flex={1}>
              <Text fontSize="$6" fontWeight="700">
                {user.display_name}
              </Text>
              <Text fontSize="$3" color="$gray10">
                {user.email}
              </Text>
              <XStack marginTop="$2">
                <View
                  backgroundColor="$green3"
                  px="$2"
                  py="$1"
                  borderRadius="$3"
                >
                  <Text fontSize="$2" color="$green10" fontWeight="600">
                    免費會員
                  </Text>
                </View>
              </XStack>
            </YStack>
          </XStack>
        )}

        {/* 2. 外觀與體驗 */}
        <SettingsGroup title="外觀與體驗">
          {/* 主題選擇器比較特殊，我們把它放在 Group 裡面但自定義佈局 */}
          <YStack padding="$3.5" space="$3">
            <XStack space="$3" alignItems="center" marginBottom="$2">
              <View backgroundColor="$gray3" padding="$2" borderRadius="$3">
                <Palette size={18} color="$color" />
              </View>
              <Text fontSize="$5" fontWeight="500">
                主題模式
              </Text>
            </XStack>
            <ThemeSelector />
          </YStack>

          <SettingItem
            icon={<Globe />}
            label="語言"
            rightContent={<Text color="$gray10">繁體中文</Text>}
            onPress={() => console.log("Nav to Language")}
          />
          <SettingItem
            icon={<Ruler />}
            label="單位"
            rightContent={<Text color="$gray10">公制 (km, kg)</Text>}
            onPress={() => console.log("Nav to Units")}
          />
        </SettingsGroup>

        {/* 3. 隱私與通知 (即時開關) */}
        <SettingsGroup title="隱私權限">
          <SettingItem
            icon={<MapPin />}
            label="分享位置資訊"
            rightContent={
              <Switch
                size="$3"
                defaultChecked={user?.privacy_settings.share_location}
                onCheckedChange={(val) =>
                  handleTogglePrivacy("share_location", val)
                }
              >
                <Switch.Thumb animation="bouncy" />
              </Switch>
            }
          />
          <SettingItem
            icon={<BarChart2 />}
            label="公開詳細統計"
            rightContent={
              <Switch
                size="$3"
                defaultChecked={user?.privacy_settings.share_detailed_stats}
                onCheckedChange={(val) =>
                  handleTogglePrivacy("share_detailed_stats", val)
                }
              >
                <Switch.Thumb animation="bouncy" />
              </Switch>
            }
          />
          <SettingItem
            icon={<Bell />}
            label="推播通知"
            rightContent={
              <Switch size="$3" defaultChecked={true}>
                <Switch.Thumb animation="bouncy" />
              </Switch>
            }
          />
        </SettingsGroup>

        {/* 4. 安全性與帳號 */}
        <SettingsGroup title="帳號管理">
          <SettingItem
            icon={<Shield />}
            label="隱私權政策"
            onPress={() => console.log("Privacy Policy")}
          />
          <SettingItem
            icon={<LogOut />}
            label="登出"
            isDestructive
            onPress={handleLogout}
          />
        </SettingsGroup>

        {/* 底部版本資訊 */}
        <YStack alignItems="center" opacity={0.5}>
          <Text fontSize="$2" color="$gray10">
            Version 1.0.2 (Build 45)
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default SettingsScreen;
