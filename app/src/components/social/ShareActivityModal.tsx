/**
 * ShareActivityModal
 * 分享動態到社群的對話框
 * 支援文字輸入和圖片選擇
 */

import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface ShareActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: (caption: string, imageUri?: string) => Promise<void>;
  activityType: 'workout' | 'achievement' | 'challenge';
  activitySummary: string;
}

export const ShareActivityModal: React.FC<ShareActivityModalProps> = ({
  visible,
  onClose,
  onShare,
  activityType,
  activitySummary,
}) => {
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const activityTypeLabels = {
    workout: '運動記錄',
    achievement: '成就',
    challenge: '挑戰',
  };

  const handlePickImage = async () => {
    // 請求相簿權限
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('需要相簿權限才能選擇圖片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    // 請求相機權限
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      alert('需要相機權限才能拍照');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setImageUri(undefined);
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      await onShare(caption, imageUri);
      // 重置狀態
      setCaption('');
      setImageUri(undefined);
      onClose();
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setImageUri(undefined);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>取消</Text>
              </TouchableOpacity>
              <Text style={styles.title}>分享到社群</Text>
              <TouchableOpacity
                onPress={handleShare}
                disabled={loading}
                style={[styles.shareButton, loading && styles.shareButtonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.shareButtonText}>發布</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {/* Activity Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  {activityTypeLabels[activityType]}
                </Text>
                <Text style={styles.summaryText}>{activitySummary}</Text>
              </View>

              {/* Caption Input */}
              <TextInput
                style={styles.captionInput}
                placeholder="寫下你的心得..."
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{caption.length}/500</Text>

              {/* Image Preview or Picker */}
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={handleRemoveImage}
                  >
                    <Text style={styles.removeImageText}>X</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerContainer}>
                  <Text style={styles.imagePickerLabel}>新增圖片（選填）</Text>
                  <View style={styles.imagePickerButtons}>
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={handlePickImage}
                    >
                      <Text style={styles.imagePickerIcon}>📷</Text>
                      <Text style={styles.imagePickerButtonText}>從相簿選擇</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imagePickerButton}
                      onPress={handleTakePhoto}
                    >
                      <Text style={styles.imagePickerIcon}>📸</Text>
                      <Text style={styles.imagePickerButtonText}>拍照</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    backgroundColor: '#ccc',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  body: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    marginBottom: 8,
    color: '#333',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  imagePickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imagePickerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePickerButtonText: {
    fontSize: 14,
    color: '#666',
  },
});

export default ShareActivityModal;
