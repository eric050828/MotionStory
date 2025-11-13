/**
 * T147: GoogleOAuthScreen
 * Google OAuth 登入介面
 * 
 * Note: This screen has been modified to handle web compatibility.
 * Google Sign-In is a native-only feature and will be disabled on the web.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform, // Import Platform to check the OS
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';

// Conditionally import native-only modules
let GoogleSignin: any, statusCodes: any, auth: any;
if (Platform.OS !== 'web') {
  try {
    ({ GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin'));
    auth = require('@react-native-firebase/auth').default;
  } catch (e) {
    console.error("Failed to load native Google Sign-In modules", e);
  }
}

const GoogleOAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { googleLogin, isLoading } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      // Configure Google Sign-In for native platforms
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });
    }
    setInitializing(false);
  }, []);

  const handleGoogleSignIn = async () => {
    // On web, this button should ideally not be pressable, but as a fallback:
    if (Platform.OS === 'web' || !GoogleSignin) {
      Alert.alert('不支援的功能', '網頁版目前不支援 Google 登入。');
      return;
    }

    try {
      // Check Google Play Services
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get user info
      await GoogleSignin.signIn();

      // Get ID Token
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('未能取得 Google ID Token');
      }

      // Authenticate with Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      // Call backend API to complete login
      await googleLogin(idToken);

      // Navigation will be handled by RootNavigator on success
    } catch (error: any) {
      handleSignInError(error);
    }
  };

  const handleSignInError = (error: any) => {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login flow');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert('提示', '登入進行中，請稍候');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('錯誤', 'Google Play Services 不可用');
    } else {
      Alert.alert('登入失敗', error.message || '請稍後再試');
      console.error('Google Sign-In Error:', error);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (initializing && Platform.OS !== 'web') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>初始化中...</Text>
      </View>
    );
  }

  // Render a web-specific view
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.title}>Google 登入</Text>
            <Text style={styles.subtitle}>此功能目前僅支援手機 App</Text>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="返回"
              onPress={handleBackToLogin}
              variant="outline"
              style={styles.backButton}
            />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              請下載我們的 Android 或 iOS 應用程式以使用 Google 登入。
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render the native view
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