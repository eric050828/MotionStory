/**
 * Login Screen
 * 使用者登入畫面 - Email/密碼 + Google OAuth
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../../components/Button';
import { Input } from '../components/Input';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { login, googleLogin, isLoading } = useAuthStore();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email 為必填欄位');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Email 格式不正確');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('密碼為必填欄位');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('密碼至少需要 8 個字元');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled by auth state change
    } catch (error: any) {
      Alert.alert(
        '登入失敗',
        error.response?.data?.detail || '請檢查您的帳號密碼'
      );
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // TODO: 實作 Google OAuth
      Alert.alert('開發中', 'Google 登入功能開發中');
    } catch (error) {
      Alert.alert('登入失敗', 'Google 登入發生錯誤');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>MotionStory</Text>
          <Text style={styles.subtitle}>運動追蹤與動機平台</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            placeholder="請輸入 Email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="密碼"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            placeholder="請輸入密碼"
            isPassword
            error={passwordError}
          />

          <Button
            title="登入"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>或</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="使用 Google 登入"
            onPress={handleGoogleLogin}
            variant="outline"
            disabled={isLoading}
          />

          <Button
            title="還沒有帳號？立即註冊"
            onPress={() => {
              // TODO: Navigate to register screen
              Alert.alert('開發中', '註冊功能開發中');
            }}
            variant="secondary"
            style={styles.registerButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  registerButton: {
    marginTop: 16,
  },
});
