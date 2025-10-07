/**
 * T158: SettingsScreen
 * 使用者設定畫面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import Button from '../../components/Button';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout, updatePrivacySettings } = useAuthStore();

  const [settings, setSettings] = useState({
    shareLocation: user?.privacy_settings.share_location || false,
    shareStats: user?.privacy_settings.share_detailed_stats || false,
    notifications: true,
    language: 'zh-TW',
    units: 'metric',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSave = async () => {
    try {
      await updatePrivacySettings({
        share_location: settings.shareLocation,
        share_detailed_stats: settings.shareStats,
      });
      Alert.alert('儲存成功', '設定已更新');
    } catch (err) {
      Alert.alert('儲存失敗', '請稍後再試');
    }
  };

  const handleLogout = () => {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>個人資料</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.display_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.display_name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Privacy Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>隱私設定</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>分享位置資訊</Text>
            <Text style={styles.settingDescription}>允許在運動記錄中顯示位置</Text>
          </View>
          <Switch
            value={settings.shareLocation}
            onValueChange={() => handleToggle('shareLocation')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>分享詳細統計</Text>
            <Text style={styles.settingDescription}>在公開資料中顯示詳細數據</Text>
          </View>
          <Switch
            value={settings.shareStats}
            onValueChange={() => handleToggle('shareStats')}
          />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>應用程式設定</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>語言</Text>
            <Text style={styles.settingValue}>繁體中文</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>單位</Text>
            <Text style={styles.settingValue}>公制 (公里、公斤)</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>推播通知</Text>
          </View>
          <Switch
            value={settings.notifications}
            onValueChange={() => handleToggle('notifications')}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Button
          title="儲存設定"
          onPress={handleSave}
          style={styles.saveButton}
        />

        <Button
          title="登出"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    color: '#2196F3',
  },
  saveButton: {
    marginBottom: 12,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
});

export default SettingsScreen;
