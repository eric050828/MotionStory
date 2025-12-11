/**
 * Friends Search Screen
 * 好友搜尋頁面 - 透過 Email、用戶 ID 或 QR Code 搜尋並添加好友
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, Alert, Pressable } from 'react-native';
import { YStack, XStack, Text, Card, Avatar, Button, Spinner, Input } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  Search, Mail, Hash, QrCode, UserPlus, Check
} from '@tamagui/lucide-icons';
import { api } from '../../services/api';
import { useTheme } from '../../../components/theme/useTheme';

type SearchType = 'email' | 'user_id' | 'qrcode';

interface SearchResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_workouts: number;
  friendship_status: 'none' | 'pending' | 'accepted' | 'blocked';
}

export default function FriendsSearchScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { theme } = useTheme();
  const [searchType, setSearchType] = useState<SearchType>('email');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      Alert.alert('提示', '請輸入搜尋內容');
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await api.searchFriends(searchType, query.trim());
      setResults(data.users || []);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.detail || '搜尋失敗，請稍後再試');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchType, query]);

  const handleSendInvite = async (userId: string) => {
    setSending(userId);
    try {
      await api.sendFriendInvite(userId);
      // Update the result to show pending status
      setResults(prev => prev.map(r =>
        r.user_id === userId ? { ...r, friendship_status: 'pending' } : r
      ));
      Alert.alert('成功', '好友邀請已發送');
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      Alert.alert('錯誤', err.response?.data?.detail || '發送邀請失敗');
    } finally {
      setSending(null);
    }
  };

  const getSearchIcon = (type: SearchType) => {
    switch (type) {
      case 'email': return <Mail size={18} />;
      case 'user_id': return <Hash size={18} />;
      case 'qrcode': return <QrCode size={18} />;
    }
  };

  const getSearchLabel = (type: SearchType) => {
    switch (type) {
      case 'email': return 'Email';
      case 'user_id': return '用戶 ID';
      case 'qrcode': return 'QR Code';
    }
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email': return '輸入對方的 Email';
      case 'user_id': return '輸入對方的用戶 ID';
      case 'qrcode': return '輸入 QR Code 內容';
    }
  };

  const renderStatusButton = (result: SearchResult) => {
    if (result.friendship_status === 'accepted') {
      return (
        <Button size="$3" backgroundColor={theme.tokens.colors.muted} disabled>
          <Check size={16} color={theme.tokens.colors.mutedForeground} />
          <Text marginLeft="$1" color={theme.tokens.colors.mutedForeground}>已是好友</Text>
        </Button>
      );
    }

    if (result.friendship_status === 'pending') {
      return (
        <Button size="$3" backgroundColor={theme.tokens.colors.muted} disabled>
          <Text color={theme.tokens.colors.mutedForeground}>邀請中</Text>
        </Button>
      );
    }

    if (result.friendship_status === 'blocked') {
      return (
        <Button size="$3" backgroundColor={theme.tokens.colors.muted} disabled>
          <Text color={theme.tokens.colors.mutedForeground}>已封鎖</Text>
        </Button>
      );
    }

    return (
      <Button
        size="$3"
        backgroundColor={theme.tokens.colors.primary}
        onPress={() => handleSendInvite(result.user_id)}
        disabled={sending === result.user_id}
      >
        {sending === result.user_id ? (
          <Spinner size="small" color="white" />
        ) : (
          <>
            <UserPlus size={16} color="white" />
            <Text marginLeft="$1" color="white">添加</Text>
          </>
        )}
      </Button>
    );
  };

  return (
    <YStack flex={1} backgroundColor={theme.tokens.colors.background}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Search Type Selector */}
          <XStack gap="$2">
            {(['email', 'user_id', 'qrcode'] as SearchType[]).map((type) => (
              <Card
                key={type}
                flex={1}
                onPress={() => {
                  setSearchType(type);
                  setQuery('');
                  setResults([]);
                  setHasSearched(false);
                }}
                backgroundColor={searchType === type ? theme.tokens.colors.primary : theme.tokens.colors.background}
                borderRadius="$3"
                padding="$2"
                alignItems="center"
                borderWidth={1}
                borderColor={searchType === type ? theme.tokens.colors.primary : theme.tokens.colors.border}
                pressStyle={{ scale: 0.98 }}
                cursor="pointer"
              >
                <YStack alignItems="center" gap="$1">
                  {React.cloneElement(getSearchIcon(type), {
                    color: searchType === type ? "white" : theme.tokens.colors.mutedForeground
                  })}
                  <Text
                    fontSize="$2"
                    fontWeight="600"
                    color={searchType === type ? "white" : theme.tokens.colors.mutedForeground}
                  >
                    {getSearchLabel(type)}
                  </Text>
                </YStack>
              </Card>
            ))}
          </XStack>

          {/* Search Input */}
          <XStack gap="$2">
            <Input
              flex={1}
              placeholder={getPlaceholder()}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              backgroundColor={theme.tokens.colors.background}
              borderColor={theme.tokens.colors.border}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              backgroundColor={theme.tokens.colors.primary}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <Spinner size="small" color="white" />
              ) : (
                <Search size={20} color="white" />
              )}
            </Button>
          </XStack>

          {/* Error Message */}
          {error && (
            <Card backgroundColor={theme.tokens.colors.error + '20'} padding="$3" borderRadius="$3">
              <Text color={theme.tokens.colors.error} textAlign="center">{error}</Text>
            </Card>
          )}

          {/* Search Results */}
          {hasSearched && !searching && results.length === 0 && !error && (
            <YStack alignItems="center" justifyContent="center" paddingVertical="$8" gap="$3">
              <Search size={48} color={theme.tokens.colors.mutedForeground} />
              <Text fontSize="$4" fontWeight="600" color={theme.tokens.colors.mutedForeground}>
                找不到符合的用戶
              </Text>
              <Text color={theme.tokens.colors.mutedForeground} textAlign="center">
                請確認搜尋內容是否正確
              </Text>
            </YStack>
          )}

          {results.length > 0 && (
            <YStack gap="$3">
              <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                找到 {results.length} 位用戶
              </Text>
              {results.map((result) => (
                <Card
                  key={result.user_id}
                  backgroundColor={theme.tokens.colors.card}
                  padding="$3"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor={theme.tokens.colors.border}
                >
                  <XStack alignItems="center" gap="$3">
                    <Pressable onPress={() => router.push(`/user/${result.user_id}`)}>
                      <Avatar circular size="$5" backgroundColor={theme.tokens.colors.muted}>
                        {result.avatar_url ? (
                          <Avatar.Image source={{ uri: result.avatar_url }} />
                        ) : (
                          <Avatar.Fallback>
                            <Text fontSize="$5" fontWeight="700" color={theme.tokens.colors.foreground}>
                              {result.display_name.charAt(0)}
                            </Text>
                          </Avatar.Fallback>
                        )}
                      </Avatar>
                    </Pressable>

                    <Pressable style={{ flex: 1 }} onPress={() => router.push(`/user/${result.user_id}`)}>
                      <YStack>
                        <Text fontSize="$4" fontWeight="700" color={theme.tokens.colors.foreground}>
                          {result.display_name}
                        </Text>
                        <Text fontSize="$2" color={theme.tokens.colors.mutedForeground}>
                          {result.total_workouts} 次運動
                        </Text>
                      </YStack>
                    </Pressable>

                    {renderStatusButton(result)}
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}

          {/* Instructions */}
          {!hasSearched && (
            <Card backgroundColor={theme.tokens.colors.muted} padding="$4" borderRadius="$4">
              <YStack gap="$2">
                <Text fontWeight="600" color={theme.tokens.colors.foreground}>
                  如何添加好友？
                </Text>
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                  1. 選擇搜尋方式（Email、用戶 ID 或 QR Code）
                </Text>
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                  2. 輸入對方的資訊
                </Text>
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                  3. 點擊「添加」發送好友邀請
                </Text>
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                  4. 等待對方接受邀請
                </Text>
              </YStack>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
