/**
 * T159: PrivacyScreen
 * 隱私設定管理畫面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';

const PrivacyScreen: React.FC = () => {
  const { user, updatePrivacySettings } = useAuthStore();

  const [settings, setSettings] = useState({
    shareLocation: user?.privacy_settings.share_location || false,
    shareStats: user?.privacy_settings.share_detailed_stats || false,
    publicProfile: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updatePrivacySettings({
        share_location: settings.shareLocation,
        share_detailed_stats: settings.shareStats,
      });
      Alert.alert('儲存成功', '隱私設定已更新');
    } catch (err) {
      Alert.alert('儲存失敗', '請稍後再試');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>隱私設定</Text>
        <Text style={styles.subtitle}>控制你的資料分享範圍</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>資料分享</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>分享位置資訊</Text>
            <Text style={styles.settingDescription}>
              允許在運動記錄中顯示位置資訊（地圖和地點名稱）
            </Text>
          </View>
          <Switch
            value={settings.shareLocation}
            onValueChange={() => handleToggle('shareLocation')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>分享詳細統計</Text>
            <Text style={styles.settingDescription}>
              允許在公開個人資料中顯示詳細的運動數據
            </Text>
          </View>
          <Switch
            value={settings.shareStats}
            onValueChange={() => handleToggle('shareStats')}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>公開個人資料</Text>
            <Text style={styles.settingDescription}>
              讓其他使用者可以查看你的個人資料和運動記錄
            </Text>
          </View>
          <Switch
            value={settings.publicProfile}
            onValueChange={() => handleToggle('publicProfile')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>資料控制</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📊 資料匯出</Text>
          <Text style={styles.infoText}>
            你可以隨時匯出你的所有運動資料
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🗑️ 帳號刪除</Text>
          <Text style={styles.infoText}>
            刪除帳號將永久移除你的所有資料，此操作無法復原
          </Text>
        </View>
      </View>

      <Button
        title="儲存設定"
        onPress={handleSave}
        style={styles.saveButton}
      />
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
  header: {
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});

export default PrivacyScreen;
