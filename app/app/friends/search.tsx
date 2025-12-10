/**
 * Friend Search Screen
 * 好友搜尋頁面 - 搜尋並添加好友
 */

import React, { useState, useCallback } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { YStack, XStack, Text, Input, Card, Avatar, Button, Spinner } from 'tamagui';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft, Search, UserPlus, UserCheck, Mail, Hash, QrCode, Users
} from '@tamagui/lucide-icons';
import { api } from '../../src/services/api';

type SearchType = 'email' | 'user_id' | 'qrcode';

interface SearchResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  is_friend: boolean;
  is_blocked: boolean;
}

export default function FriendSearchScreen() {
  const router = useRouter();
  const [searchType, setSearchType] = useState<SearchType>('email');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setError('請輸入搜尋內容');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await api.searchFriends(searchType, searchQuery.trim());
      setResults(data.results || []);
      if (data.results?.length === 0) {
        setError('找不到符合的使用者');
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.response?.data?.detail || '搜尋失敗，請稍後再試');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchType, searchQuery]);

  const handleSendInvite = useCallback(async (userId: string, displayName: string) => {
    setSending(userId);
    setError(null);

    try {
      await api.sendFriendInvite(userId);
      setSuccessMessage(`已向 ${displayName} 發送好友邀請！`);
      // Update results to mark as invited
      setResults(prev => prev.map(r =>
        r.user_id === userId ? { ...r, is_friend: true } : r
      ));
    } catch (err: any) {
      console.error('Send invite failed:', err);
      const detail = err.response?.data?.detail || '發送邀請失敗';
      setError(detail);
    } finally {
      setSending(null);
    }
  }, []);

  const getPlaceholder = () => {
    switch (searchType) {
      case 'email': return '輸入 Email 搜尋';
      case 'user_id': return '輸入使用者 ID';
      case 'qrcode': return '輸入 QR Code 內容';
    }
  };

  const SearchTypeButton: React.FC<{
    type: SearchType;
    label: string;
    icon: any;
  }> = ({ type, label, icon: Icon }) => (
    <Card
      flex={1}
      onPress={() => setSearchType(type)}
      bg={searchType === type ? "$blue10" : "$background"}
      br="$3"
      p="$2"
      ai="center"
      borderWidth={1}
      borderColor={searchType === type ? "$blue10" : "$borderColor"}
      pressStyle={{ scale: 0.98 }}
      cursor="pointer"
    >
      <Icon size={18} color={searchType === type ? "white" : "$gray10"} />
      <Text fontSize="$2" fontWeight="600" color={searchType === type ? "white" : "$gray10"} mt="$1">
        {label}
      </Text>
    </Card>
  );

  return (
    <YStack flex={1} bg="$background">
      <Stack.Screen
        options={{
          title: '搜尋好友',
          headerLeft: () => (
            <XStack onPress={() => router.back()} p="$2" cursor="pointer">
              <ChevronLeft size={24} color="$color" />
            </XStack>
          ),
        }}
      />

      <YStack p="$4" gap="$4">
        {/* Search Type Selector */}
        <XStack gap="$2">
          <SearchTypeButton type="email" label="Email" icon={Mail} />
          <SearchTypeButton type="user_id" label="ID" icon={Hash} />
          <SearchTypeButton type="qrcode" label="QR Code" icon={QrCode} />
        </XStack>

        {/* Search Input */}
        <XStack gap="$2">
          <Input
            flex={1}
            placeholder={getPlaceholder()}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={searchType === 'email' ? 'email-address' : 'default'}
          />
          <Button
            onPress={handleSearch}
            bg="$blue10"
            disabled={loading}
            pressStyle={{ opacity: 0.8 }}
          >
            {loading ? (
              <Spinner color="white" size="small" />
            ) : (
              <Search size={20} color="white" />
            )}
          </Button>
        </XStack>

        {/* Success Message */}
        {successMessage && (
          <Card bg="$green2" p="$3" br="$3">
            <Text color="$green10" ta="center">{successMessage}</Text>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card bg="$red2" p="$3" br="$3">
            <Text color="$red10" ta="center">{error}</Text>
          </Card>
        )}

        {/* Search Results */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <YStack gap="$2">
            {results.map((user) => (
              <Card key={user.user_id} bg="$background" p="$3" br="$4" borderWidth={1} borderColor="$borderColor">
                <XStack ai="center" gap="$3">
                  <Avatar circular size="$5" bg="$gray5">
                    {user.avatar_url ? (
                      <Avatar.Image source={{ uri: user.avatar_url }} />
                    ) : (
                      <Avatar.Fallback>
                        <Text fontSize="$5" fontWeight="700" color="$gray11">
                          {user.display_name.charAt(0)}
                        </Text>
                      </Avatar.Fallback>
                    )}
                  </Avatar>

                  <YStack flex={1}>
                    <Text fontSize="$4" fontWeight="700" color="$color">
                      {user.display_name}
                    </Text>
                    <Text fontSize="$2" color="$gray9">
                      ID: {user.user_id.slice(0, 8)}...
                    </Text>
                  </YStack>

                  {user.is_friend ? (
                    <Button disabled bg="$gray5">
                      <UserCheck size={18} color="$gray10" />
                      <Text color="$gray10" ml="$1">已邀請</Text>
                    </Button>
                  ) : user.is_blocked ? (
                    <Button disabled bg="$gray5">
                      <Text color="$gray10">已封鎖</Text>
                    </Button>
                  ) : (
                    <Button
                      onPress={() => handleSendInvite(user.user_id, user.display_name)}
                      bg="$blue10"
                      disabled={sending === user.user_id}
                      pressStyle={{ opacity: 0.8 }}
                    >
                      {sending === user.user_id ? (
                        <Spinner color="white" size="small" />
                      ) : (
                        <>
                          <UserPlus size={18} color="white" />
                          <Text color="white" ml="$1">加好友</Text>
                        </>
                      )}
                    </Button>
                  )}
                </XStack>
              </Card>
            ))}
          </YStack>
        </ScrollView>

        {/* Empty State */}
        {!loading && results.length === 0 && !error && (
          <YStack ai="center" jc="center" py="$8" gap="$3">
            <Users size={64} color="$gray8" />
            <Text fontSize="$4" color="$gray10">搜尋並添加好友</Text>
            <Text fontSize="$2" color="$gray9" ta="center">
              透過 Email 或使用者 ID{'\n'}找到你的朋友
            </Text>
          </YStack>
        )}
      </YStack>
    </YStack>
  );
}
