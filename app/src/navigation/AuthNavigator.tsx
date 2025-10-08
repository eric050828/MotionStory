/**
 * T162: AuthNavigator
 * Auth screens navigation
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import GoogleOAuthScreen from '../screens/auth/GoogleOAuthScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: '返回',
        headerTintColor: '#2196F3',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: '註冊' }}
      />
      <Stack.Screen
        name="GoogleOAuth"
        component={GoogleOAuthScreen}
        options={{ title: 'Google 登入' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
