/**
 * T146: RegisterScreen
 * Email 註冊介面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';
import Input from '../../components/Input';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const { register, isLoading, error } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email 驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = '請輸入電子郵件';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件';
    }

    // 顯示名稱驗證
    if (!formData.displayName) {
      newErrors.displayName = '請輸入顯示名稱';
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = '顯示名稱至少 2 個字元';
    }

    // 密碼驗證
    if (!formData.password) {
      newErrors.password = '請輸入密碼';
    } else if (formData.password.length < 6) {
      newErrors.password = '密碼至少 6 個字元';
    }

    // 確認密碼
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '請確認密碼';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '密碼不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(formData.email, formData.password, formData.displayName);
      // 註冊成功後會自動導航到主畫面 (由 RootNavigator 處理)
    } catch (err: any) {
      Alert.alert('註冊失敗', err.message || '請稍後再試');
    }
  };

  const handleLoginNavigation = () => {
    navigation.navigate('Login' as never);
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
          <Text style={styles.title}>建立帳號</Text>
          <Text style={styles.subtitle}>開始記錄你的運動旅程</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="顯示名稱"
            placeholder="輸入你的名稱"
            value={formData.displayName}
            onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            error={errors.displayName}
            autoCapitalize="words"
          />

          <Input
            label="電子郵件"
            placeholder="your@email.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="密碼"
            placeholder="至少 6 個字元"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            error={errors.password}
            secureTextEntry
          />

          <Input
            label="確認密碼"
            placeholder="再次輸入密碼"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            error={errors.confirmPassword}
            secureTextEntry
          />

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            title="註冊"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>已經有帳號？</Text>
            <Button
              title="登入"
              onPress={handleLoginNavigation}
              variant="text"
              disabled={isLoading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  registerButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
  },
});

export default RegisterScreen;
