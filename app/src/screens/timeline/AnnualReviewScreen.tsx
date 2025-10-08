/**
 * T157: AnnualReviewScreen
 * 年度回顧畫面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { AnnualReview } from '../../types/timeline';
import timelineService from '../../services/timelineService';
import { Button } from '../../components/Button';
import { Loading } from '../../components/ui/Loading';
import BarChartWidget from '../../components/charts/BarChartWidget';
import PieChartWidget from '../../components/charts/PieChartWidget';

const AnnualReviewScreen: React.FC = () => {
  const [review, setReview] = useState<AnnualReview | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchAnnualReview();
  }, []);

  const fetchAnnualReview = async () => {
    try {
      const data = await timelineService.generateAnnualReview(currentYear);
      setReview(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!review) return;

    try {
      await Share.share({
        message: `我的 ${review.year} 年運動回顧\n\n總運動次數: ${review.total_workouts}\n總距離: ${review.total_distance_km} 公里\n總時長: ${review.total_duration_minutes} 分鐘\n\n#MotionStory`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (loading || !review) {
    return <Loading />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.year}>{review.year}</Text>
        <Text style={styles.title}>年度運動回顧</Text>
      </View>

      {/* Key Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{review.total_workouts}</Text>
          <Text style={styles.statLabel}>運動次數</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{review.total_distance_km.toFixed(0)}</Text>
          <Text style={styles.statLabel}>總距離 (公里)</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.floor(review.total_duration_minutes / 60)}</Text>
          <Text style={styles.statLabel}>總時長 (小時)</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{review.total_achievements}</Text>
          <Text style={styles.statLabel}>獲得成就</Text>
        </View>
      </View>

      {/* Highlights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>年度亮點</Text>
        {review.highlights.map((highlight, index) => (
          <View key={index} style={styles.highlightCard}>
            <Text style={styles.highlightIcon}>{highlight.icon}</Text>
            <View style={styles.highlightContent}>
              <Text style={styles.highlightTitle}>{highlight.title}</Text>
              <Text style={styles.highlightDescription}>{highlight.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Favorite Workout Type */}
      {review.favorite_workout_type && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最愛運動</Text>
          <View style={styles.favoriteCard}>
            <Text style={styles.favoriteType}>{review.favorite_workout_type}</Text>
            <Text style={styles.favoriteDescription}>
              你最常進行的運動類型
            </Text>
          </View>
        </View>
      )}

      {/* Workout Type Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>運動類型分布</Text>
        <PieChartWidget
          workouts={[]} // 這裡應該傳入實際的 workouts 數據
          title=""
        />
      </View>

      {/* Share Button */}
      <Button
        title="分享年度回顧"
        onPress={handleShare}
        style={styles.shareButton}
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
    alignItems: 'center',
    marginBottom: 24,
  },
  year: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2196F3',
  },
  title: {
    fontSize: 20,
    color: '#666',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
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
  highlightCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  highlightIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  highlightContent: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 14,
    color: '#666',
  },
  favoriteCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  favoriteType: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 8,
  },
  favoriteDescription: {
    fontSize: 16,
    color: '#1976D2',
  },
  shareButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});

export default AnnualReviewScreen;
