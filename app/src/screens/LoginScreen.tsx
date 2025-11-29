import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  YStack,
  XStack,
  H3,
  Paragraph,
  Input,
  Button,
  Label,
  ScrollView,
  Separator,
  Spinner,
  Card,
  H2,
} from "tamagui";
import { useAuthStore } from "../store/useAuthStore";
import { extractErrorMessage } from "../utils/errorHandler";
import { Lock, Mail } from "@tamagui/lucide-icons";

const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <Paragraph color="$red10" size="$2" mt="$1">
    {children}
  </Paragraph>
);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, isLoading } = useAuthStore();

  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!text) {
      setEmailError("Email 為必填欄位");
      return false;
    }
    if (!emailRegex.test(text)) {
      setEmailError("Email 格式不正確");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (text: string): boolean => {
    if (!text) {
      setPasswordError("密碼為必填欄位");
      return false;
    }
    if (text.length < 6) {
      setPasswordError("密碼至少需要 6 個字元");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) return;

    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("登入失敗", extractErrorMessage(error, "請檢查您的帳號密碼"));
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert("開發中", "Google 登入功能開發中");
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      justifyContent="center"
      padding="$4"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        >
          <Card
            elevate
            bordered
            padding="$5"
            animation="bouncy"
            enterStyle={{ o: 0, y: -10 }}
          >
            <Card.Header>
              <YStack alignItems="center" space="$2" marginBottom="$4">
                <XStack>
                  <H2 color="$brand" fontWeight="bold">Motion</H2>
                  <H2>Story</H2>
                </XStack>
                <Paragraph theme="alt2">
                  Sign in to your account
                </Paragraph>
              </YStack>
            </Card.Header>

            <YStack space="$4" marginTop="$4">
              <YStack>
                <Label htmlFor="email">Email</Label>
                <XStack
                  alignItems="center"
                  space="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  focusStyle={{ borderColor: "$brand" }}
                >
                  <Mail color="$color7" />
                  <Input
                    flex={1}
                    id="email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) validateEmail(text);
                    }}
                    onBlur={() => validateEmail(email)}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    borderWidth={0}
                    backgroundColor="transparent"
                    focusStyle={{ backgroundColor: "transparent" }}
                  />
                </XStack>
                {!!emailError && <ErrorText>{emailError}</ErrorText>}
              </YStack>

              <YStack>
                <Label htmlFor="password">Password</Label>
                <XStack
                  alignItems="center"
                  space="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$4"
                  paddingHorizontal="$3"
                  focusStyle={{ borderColor: "$brand" }}
                >
                  <Lock color="$color7" />
                  <Input
                    flex={1}
                    id="password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) validatePassword(text);
                    }}
                    onBlur={() => validatePassword(password)}
                    placeholder="••••••••"
                    secureTextEntry
                    borderWidth={0}
                    backgroundColor="transparent"
                    focusStyle={{ backgroundColor: "transparent" }}
                  />
                </XStack>
                {!!passwordError && <ErrorText>{passwordError}</ErrorText>}
              </YStack>

              <Button
                backgroundColor="$brand"
                color="$background"
                pressStyle={{ backgroundColor: "$brandHover" }}
                size="$4"
                onPress={handleLogin}
                disabled={isLoading}
                icon={isLoading ? <Spinner /> : undefined}
                marginTop="$2"
              >
                Sign In
              </Button>

              <XStack alignItems="center" space>
                <Separator flex={1} />
                <Paragraph size="$2" theme="alt2">
                  OR
                </Paragraph>
                <Separator flex={1} />
              </XStack>

              <Button
                variant="outlined"
                size="$4"
                onPress={handleGoogleLogin}
                disabled={isLoading}
                // icon={<GoogleIcon />} // You can add a custom Google icon component here
              >
                Sign In with Google
              </Button>
            </YStack>

            <Card.Footer marginTop="$4">
              <Paragraph size="$2" theme="alt2">
                Don't have an account?{" "}
              </Paragraph>
              <Button
                size="$2"
                onPress={() => navigation.navigate("Register" as never)}
              >
                Sign Up
              </Button>
            </Card.Footer>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </YStack>
  );
};
