import React from "react";
import { useColorScheme } from "react-native";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { TamaguiProvider, Theme, View, Text } from "tamagui";

// 引入您的 RootNavigator (請確保路徑正確)
import { useThemeStore } from "./src/store/useThemeStore";
import RootNavigator from "./src/navigation/RootNavigator";

// 引入設定檔
import config from "./tamagui.config";

// Custom Theme Provider for app-wide theme context
import { ThemeProvider } from "./components/theme/ThemeProvider";

export default function App() {
  const systemColorScheme = useColorScheme();

  // 1. 取得使用者設定的主題 (從 Store)，若沒有 Store 則預設 'system'
  const { theme: userTheme } = useThemeStore();
  // const userTheme = "system"; // 測試時若沒有 store，先暫時寫死 'system'

  // 2. 計算最終要使用的主題 ('light' 或 'dark')
  // 因為您的 config 中有設定 alias: light: light_brand, dark: dark_brand
  // 所以這裡直接使用 'light' / 'dark' 字串即可
  const activeTheme =
    (userTheme === "system" ? systemColorScheme : userTheme) === "dark"
      ? "dark"
      : "light";

  const [loaded, error] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  if (error) {
    return (
      <View flex={1} jc="center" ai="center">
        <Text>Error loading fonts: {error.message}</Text>
      </View>
    );
  }

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {/* 3. 將計算出的 activeTheme 傳入 defaultTheme */}
      <TamaguiProvider config={config} defaultTheme={activeTheme}>
        {/* 4. 關鍵：再包一層 Theme，強制讓內部元件 (如 YStack bg="$background") 接收到主題變更 */}
        <Theme name={activeTheme}>
          {/* 5. Custom ThemeProvider for components using useTheme hook */}
          <ThemeProvider>
            {/* Navigation 的主題設定 (影響 Header 和預設背景) */}
            <NavigationContainer
              theme={activeTheme === "dark" ? DarkTheme : DefaultTheme}
            >
              {/* StatusBar 文字顏色與背景相反 (背景黑->字白) */}
              <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />

              <RootNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </Theme>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
