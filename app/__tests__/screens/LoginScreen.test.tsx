/**
 * Login Screen Component Tests (T045)
 * 測試 Email/密碼登入、Google OAuth 按鈕互動
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '@/app/screens/LoginScreen';
import { useAuthStore } from '@/app/stores/authStore';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
  },
}));

// Mock Zustand store
jest.mock('@/app/stores/authStore');

describe('LoginScreen Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('應該顯示 Email 和密碼輸入欄位', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      expect(getByPlaceholderText('Email')).toBeTruthy();
      expect(getByPlaceholderText('密碼')).toBeTruthy();
    });

    it('應該顯示登入按鈕和 Google OAuth 按鈕', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText('登入')).toBeTruthy();
      expect(getByText('使用 Google 登入')).toBeTruthy();
    });

    it('應該顯示「忘記密碼」和「註冊」連結', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText('忘記密碼？')).toBeTruthy();
      expect(getByText('還沒有帳號？註冊')).toBeTruthy();
    });
  });

  describe('Email/Password Validation', () => {
    it('Email 格式錯誤時應該顯示驗證訊息', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(getByText('登入'));

      const errorMessage = await findByText(/Email 格式錯誤/i);
      expect(errorMessage).toBeTruthy();
    });

    it('密碼欄位為空時應該顯示驗證訊息', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(getByText('登入'));

      const errorMessage = await findByText(/密碼不得為空/i);
      expect(errorMessage).toBeTruthy();
    });

    it('密碼少於 8 個字元時應該顯示驗證訊息', async () => {
      const { getByPlaceholderText, getByText, findByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('密碼');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'short');
      fireEvent.press(getByText('登入'));

      const errorMessage = await findByText(/密碼至少需要 8 個字元/i);
      expect(errorMessage).toBeTruthy();
    });

    it('所有欄位驗證通過後應該可以提交', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      (useAuthStore as jest.Mock).mockReturnValue({ login: mockLogin });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('密碼');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'SecurePass123');
      fireEvent.press(getByText('登入'));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'SecurePass123',
        });
      });
    });
  });

  describe('Login Flow', () => {
    it('登入成功應該導航到主畫面', async () => {
      const mockLogin = jest.fn().mockResolvedValue({ success: true });
      const mockNavigate = jest.fn();

      (useAuthStore as jest.Mock).mockReturnValue({ login: mockLogin });

      const { getByPlaceholderText, getByText } = render(
        <LoginScreen navigation={{ navigate: mockNavigate }} />
      );

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('密碼');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'SecurePass123');
      fireEvent.press(getByText('登入'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Home');
      });
    });

    it('登入失敗應該顯示錯誤訊息', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('登入失敗'));
      const mockAlert = jest.spyOn(Alert, 'alert');

      (useAuthStore as jest.Mock).mockReturnValue({ login: mockLogin });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('密碼');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'WrongPassword');
      fireEvent.press(getByText('登入'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('登入失敗', expect.any(String));
      });
    });

    it('登入過程中應該顯示 Loading 狀態', async () => {
      const mockLogin = jest.fn(() => new Promise((resolve) => setTimeout(resolve, 100)));
      (useAuthStore as jest.Mock).mockReturnValue({ login: mockLogin });

      const { getByPlaceholderText, getByText, queryByTestId } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      const passwordInput = getByPlaceholderText('密碼');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'SecurePass123');
      fireEvent.press(getByText('登入'));

      // 登入按鈕應該顯示 Loading 指示器
      const loadingIndicator = queryByTestId('login-loading');
      expect(loadingIndicator).toBeTruthy();

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Google OAuth Flow', () => {
    it('點擊 Google 登入按鈕應該啟動 OAuth 流程', async () => {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const mockGoogleLogin = jest.fn().mockResolvedValue({ success: true });

      GoogleSignin.signIn.mockResolvedValue({
        idToken: 'mock-google-token',
        user: { email: 'test@gmail.com' },
      });

      (useAuthStore as jest.Mock).mockReturnValue({ loginWithGoogle: mockGoogleLogin });

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('使用 Google 登入'));

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
        expect(mockGoogleLogin).toHaveBeenCalledWith('mock-google-token');
      });
    });

    it('Google 登入取消應該不顯示錯誤', async () => {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const mockAlert = jest.spyOn(Alert, 'alert');

      GoogleSignin.signIn.mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('使用 Google 登入'));

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalled();
      });

      // 用戶取消登入不應顯示錯誤 Alert
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('Google 登入失敗應該顯示錯誤訊息', async () => {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const mockAlert = jest.spyOn(Alert, 'alert');

      GoogleSignin.signIn.mockRejectedValue(new Error('Google login failed'));

      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('使用 Google 登入'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Google 登入失敗', expect.any(String));
      });
    });
  });

  describe('Navigation', () => {
    it('點擊「忘記密碼」應該導航到密碼重設頁面', () => {
      const mockNavigate = jest.fn();

      const { getByText } = render(
        <LoginScreen navigation={{ navigate: mockNavigate }} />
      );

      fireEvent.press(getByText('忘記密碼？'));

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('點擊「註冊」應該導航到註冊頁面', () => {
      const mockNavigate = jest.fn();

      const { getByText } = render(
        <LoginScreen navigation={{ navigate: mockNavigate }} />
      );

      fireEvent.press(getByText('還沒有帳號？註冊'));

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('Accessibility', () => {
    it('Email 輸入欄位應該有正確的 accessibility label', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const emailInput = getByPlaceholderText('Email');
      expect(emailInput.props.accessibilityLabel).toBe('Email 輸入欄位');
    });

    it('密碼輸入欄位應該有正確的 accessibility label', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);

      const passwordInput = getByPlaceholderText('密碼');
      expect(passwordInput.props.accessibilityLabel).toBe('密碼輸入欄位');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('登入按鈕應該有正確的 accessibility hint', () => {
      const { getByText } = render(<LoginScreen />);

      const loginButton = getByText('登入');
      expect(loginButton.props.accessibilityHint).toBe('使用 Email 和密碼登入');
    });

    it('Google 登入按鈕應該有正確的 accessibility label', () => {
      const { getByText } = render(<LoginScreen />);

      const googleButton = getByText('使用 Google 登入');
      expect(googleButton.props.accessibilityLabel).toBe('使用 Google 帳號登入');
    });
  });
});
