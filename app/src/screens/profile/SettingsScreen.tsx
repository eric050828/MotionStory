import React, { useState } from "react";
import { Alert } from "react-native";
import {
  Avatar,
  Button,
  Card,
  H4,
  Paragraph,
  ScrollView,
  Switch,
  XStack,
  YStack,
  Text,
} from "tamagui";
import { useAuthStore } from "../../store/useAuthStore";
import { useThemeStore } from "../../store/useThemeStore"; // Import useThemeStore
import { Save, LogOut } from "@tamagui/lucide-icons";

const SettingsScreen: React.FC = () => {
  const { user, logout, updatePrivacySettings } = useAuthStore();
  const { theme, setTheme } = useThemeStore(); // Use theme store

  const [settings, setSettings] = useState({
    shareLocation: user?.privacy_settings.share_location || false,
    shareStats: user?.privacy_settings.share_detailed_stats || false,
    notifications: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updatePrivacySettings({
        share_location: settings.shareLocation,
        share_detailed_stats: settings.shareStats,
      });
      Alert.alert("儲存成功", "設定已更新");
    } catch (err) {
      Alert.alert("儲存失敗", "請稍後再試");
    }
  };

  const handleLogout = () => {
    Alert.alert("登出", "確定要登出嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "登出",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const SettingItem = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      padding="$3"
      backgroundColor="$background"
      borderRadius="$4"
    >
      <YStack>
        <Paragraph size="$5" fontWeight="500">
          {label}
        </Paragraph>
        {description && <Paragraph theme="alt2">{description}</Paragraph>}
      </YStack>
      {children}
    </XStack>
  );

  return (
    <ScrollView>
      <YStack space="$5" padding="$4">
        {/* Profile Section */}
        {user && (
          <YStack space="$3">
            <H4>個人資料</H4>
            <Card elevate size="$4">
              <XStack space="$4" alignItems="center">
                <Avatar circular size="$6" overflow="hidden">
                  <Avatar.Image src="https://ui-avatars.com/api/?name=Test%20User" />
                  <Avatar.Fallback bc="$blue10">U</Avatar.Fallback>
                </Avatar>

                <YStack>
                  <Text fontSize="$6" fontWeight="600">
                    {user.display_name}
                  </Text>
                  <Paragraph theme="alt1">{user.email}</Paragraph>
                </YStack>
              </XStack>
            </Card>
          </YStack>
        )}

        {/* Privacy Settings */}
        <YStack space="$3">
          <H4>隱私設定</H4>
          <YStack space="$2">
            <SettingItem
              label="分享位置資訊"
              description="允許在運動記錄中顯示位置"
            >
              <Switch
                size="$3"
                checked={settings.shareLocation}
                onCheckedChange={() => handleToggle("shareLocation")}
              >
                <Switch.Thumb animation="bouncy" />
              </Switch>
            </SettingItem>
            <SettingItem
              label="分享詳細統計"
              description="在公開資料中顯示詳細數據"
            >
              <Switch
                size="$3"
                checked={settings.shareStats}
                onCheckedChange={() => handleToggle("shareStats")}
              >
                <Switch.Thumb animation="bouncy" />
              </Switch>
            </SettingItem>
          </YStack>
        </YStack>

        {/* App Settings */}
        <YStack space="$3">
          <H4>應用程式設定</H4>
          <YStack space="$2">
            <SettingItem label="主題">
              <XStack space="$2">
                <Button
                  size="$3"
                  onPress={() => setTheme('light')}
                  theme={theme === 'light' ? 'alt1' : undefined}
                  variant={theme === 'light' ? 'outlined' : undefined}
                  backgroundColor={theme === 'light' ? '$color4' : '$background'}
                  color={theme === 'light' ? '$color12' : '$color10'}
                >
                  淺色
                </Button>
                <Button
                  size="$3"
                  onPress={() => setTheme('dark')}
                  theme={theme === 'dark' ? 'alt1' : undefined}
                  variant={theme === 'dark' ? 'outlined' : undefined}
                  backgroundColor={theme === 'dark' ? '$color4' : '$background'}
                  color={theme === 'dark' ? '$color12' : '$color10'}
                >
                  深色
                </Button>
                <Button
                  size="$3"
                  onPress={() => setTheme('system')}
                  theme={theme === 'system' ? 'alt1' : undefined}
                  variant={theme === 'system' ? 'outlined' : undefined}
                  backgroundColor={theme === 'system' ? '$color4' : '$background'}
                  color={theme === 'system' ? '$color12' : '$color10'}
                >
                  系統
                </Button>
              </XStack>
            </SettingItem>
            <SettingItem label="語言">
              <Text fontSize="$4" theme="alt1">
                繁體中文
              </Text>
            </SettingItem>
            <SettingItem label="單位">
              <Text fontSize="$4" theme="alt1">
                公制 (公里、公斤)
              </Text>
            </SettingItem>
            <SettingItem label="推播通知">
              <Switch
                size="$3"
                checked={settings.notifications}
                onCheckedChange={() => handleToggle("notifications")}
              >
                <Switch.Thumb animation="bouncy" />
              </Switch>
            </SettingItem>
          </YStack>
        </YStack>

        {/* Account Actions */}
        <YStack space="$3" paddingTop="$4">
          <Button icon={<Save />} theme="green" onPress={handleSave}>
            儲存設定
          </Button>
          <Button
            icon={<LogOut />}
            theme="red"
            onPress={handleLogout}
            variant="outlined"
          >
            登出
          </Button>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default SettingsScreen;
