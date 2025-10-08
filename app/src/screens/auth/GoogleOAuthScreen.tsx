/**
 * T147: GoogleOAuthScreen
 * Google OAuth 登入介面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';

const GoogleOAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { googleLogin, isLoading } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // 配置 Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    setInitializing(false);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // 檢查 Google Play Services
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // 取得使用者資訊
      const userInfo = await GoogleSignin.signIn();

      // 取得 ID Token
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('未能取得 Google ID Token');
      }

      // 使用 Firebase 認證
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      // 呼叫後端 API 完成登入
      await googleLogin(idToken);

      // 成功後會自動導航到主畫面 (由 RootNavigator 處理)
    } catch (error: any) {
      handleSignInError(error);
    }
  };

  const handleSignInError = (error: any) => {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // 使用者取消登入
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // 登入進行中
      Alert.alert('提示', '登入進行中，請稍候');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // Play services 不可用
      Alert.alert('錯誤', 'Google Play Services 不可用');
    } else {
      // 其他錯誤
      Alert.alert('登入失敗', error.message || '請稍後再試');
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>初始化中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.title}>使用 Google 登入</Text>
          <Text style={styles.subtitle}>快速安全地登入 MotionStory</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="使用 Google 帳號登入"
            onPress={handleGoogleSignIn}
            loading={isLoading}
            disabled={isLoading}
            style={styles.googleButton}
            icon="google"
          />

          <Button
            title="返回"
            onPress={handleBackToLogin}
            variant="outline"
            disabled={isLoading}
            style={styles.backButton}
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            登入即表示你同意我們的服務條款和隱私政策
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  googleIcon: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    marginBottom: 12,
  },
  backButton: {
    marginTop: 8,
  },
  infoContainer: {
    paddingHorizontal: 24,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default GoogleOAuthScreen;
