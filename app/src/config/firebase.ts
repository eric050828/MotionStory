/**
 * Firebase Configuration
 * 初始化 Firebase App
 */

import { firebase } from '@react-native-firebase/app';
import Constants from 'expo-constants';

// Firebase 配置從環境變數或 app.json extra 讀取
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔥 Firebase Configuration:');
console.log('  - Project ID:', firebaseConfig.projectId);
console.log('  - Auth Domain:', firebaseConfig.authDomain);

// 初始化 Firebase (如果尚未初始化)
if (!firebase.apps.length) {
  console.log('🔥 Initializing Firebase...');
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized');
} else {
  console.log('✅ Firebase already initialized');
}

export { firebase };
export default firebaseConfig;
