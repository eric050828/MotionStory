import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  // 注意：我們移除了 React Native 的 View, Text, StyleSheet, ScrollView
  // 改用 Tamagui 的版本
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  YStack,
  XStack,
  H2,
  Paragraph,
  Input,
  Button,
  Text,
  Label,
  ScrollView,
  Separator,
  Theme,
  Spinner,
} from "tamagui";

import { useAuthStore } from "../store/useAuthStore";
import { extractErrorMessage } from "../utils/errorHandler";

// 為了方便，我們定義一個簡單的錯誤訊息組件
const ErrorText = ({ children }: { children: string }) => (
  <Text color="$red10" fontSize="$2" mt="$1" ml="$1">
    {children}
  </Text>
);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, isLoading } = useAuthStore();

  // ... 驗證邏輯保持不變 ...
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email 為必填欄位");
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError("Email 格式不正確");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError("密碼為必填欄位");
      return false;
    }
    if (password.length < 8) {
      setPasswordError("密碼至少需要 8 個字元");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    if (!validateEmail(email) || !validatePassword(password)) return;
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("登入失敗", extractErrorMessage(error, "請檢查您的帳號密碼"));
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert("開發中", "Google 登入功能開發中");
  };

  return (
    // 1. 使用 Theme 包裹可以確保內部組件使用特定主題色 (可選)
    <Theme name="light">
      <KeyboardAvoidingView
        style={{ flex: 1 }} // RN 原生組件還是可以用 style，或者包一層 YStack
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          backgroundColor="$background" // 使用 Tamagui token
        >
          {/* 2. 主容器：垂直堆疊，置中，padding */}
          <YStack f={1} jc="center" p="$5" space="$4">
            {/* Header */}
            <YStack ai="center" mb="$6">
              <H2 color="$blue10" fontWeight="bold" mb="$2">
                MotionStory
              </H2>
              <Paragraph color="$gray10" size="$4">
                運動追蹤與動機平台
              </Paragraph>
            </YStack>

            {/* Form */}
            <YStack space="$4" w="100%">
              {/* Email Input */}
              <YStack>
                <Label htmlFor="email" mb="$1">
                  Email
                </Label>
                <Input
                  id="email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    setEmailError("");
                  }}
                  placeholder="請輸入 Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  borderColor={emailError ? "$red9" : "$borderColor"}
                  focusStyle={{ borderColor: "$blue10" }} // Focus 時變色
                  size="$4"
                />
                {!!emailError && <ErrorText>{emailError}</ErrorText>}
              </YStack>

              {/* Password Input */}
              <YStack>
                <Label htmlFor="password" mb="$1">
                  密碼
                </Label>
                <Input
                  id="password"
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setPasswordError("");
                  }}
                  placeholder="請輸入密碼"
                  secureTextEntry
                  borderColor={passwordError ? "$red9" : "$borderColor"}
                  focusStyle={{ borderColor: "$blue10" }}
                  size="$4"
                />
                {!!passwordError && <ErrorText>{passwordError}</ErrorText>}
              </YStack>

              {/* Login Button */}
              {/* theme="active" 會讓按鈕使用主色調 (通常是藍色) */}
              <Button
                theme="active"
                size="$4"
                onPress={handleLogin}
                disabled={isLoading}
                icon={isLoading ? <Spinner color="$color" /> : undefined}
                mt="$2"
              >
                登入
              </Button>

              {/* Divider */}
              <XStack ai="center" my="$4">
                <Separator />
                <Separator />
              </XStack>

              {/* Google Login Button */}
              <Button
                variant="outlined"
                size="$4"
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                使用 Google 登入
              </Button>

              {/* Register Button */}
              {/* chromeless 類似 variant="secondary" 或 text button */}
              <Button
                chromeless
                size="$3"
                mt="$2"
                onPress={() => navigation.navigate("Register" as never)}
                color="$gray10"
              >
                還沒有帳號？立即註冊
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Theme>
  );
};
