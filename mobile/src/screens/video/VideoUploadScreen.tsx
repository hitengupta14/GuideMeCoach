import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { lightColors, darkColors } from '../../theme/colors';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

export default function VideoUploadScreen() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: analysis, isLoading: isAnalyzing } = useQuery({
    queryKey: ['videoAnalysis', selectedVideo],
    queryFn: () => (selectedVideo ? apiClient.getVideoAnalysis(selectedVideo) : null),
    enabled: !!selectedVideo,
  });

  // API returns { id, status, analysis: { form, feedback } }
  const analysisData = (analysis as any) || {};

  const handleVideoSelect = async () => {
    // In a real app, use expo-image-picker to select video
    setSelectedVideo('demo-video-1');
  };

  const handleUpload = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    setIsUploading(true);
    try {
      // Upload logic here
      setTimeout(() => setIsUploading(false), 2000);
    } catch (error) {
      setIsUploading(false);
      Alert.alert('Error', 'Upload failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="video" size={40} color="#007AFF" />
        <Text style={styles.title}>Form Analysis</Text>
        <Text style={styles.subtitle}>Upload your workout video for AI feedback</Text>
      </View>

      <View style={styles.uploadArea}>
        <TouchableOpacity style={styles.uploadButton} onPress={handleVideoSelect}>
          <MaterialCommunityIcons name="cloud-upload" size={40} color="#007AFF" />
          <Text style={styles.uploadText}>
            {selectedVideo ? 'Change Video' : 'Select Video'}
          </Text>
        </TouchableOpacity>

        {selectedVideo && (
          <View style={styles.videoInfo}>
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color="#34C759"
            />
            <Text style={styles.videoName}>Video selected</Text>
          </View>
        )}
      </View>

      {selectedVideo && (
        <TouchableOpacity
          style={[
            styles.analyzeButton,
            (isUploading || isAnalyzing) && styles.buttonDisabled,
          ]}
          onPress={handleUpload}
          disabled={isUploading || isAnalyzing}
        >
          {isUploading || isAnalyzing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="star-circle" size={20} color="#fff" />
              <Text style={styles.analyzeText}>Analyze Form</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {analysisData?.status && (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Analysis Results</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Form Score</Text>
            <Text style={styles.scoreValue}>{analysisData.analysis?.formScore || 'Good'}</Text>
          </View>

          {analysisData.analysis?.feedback && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
              <View style={styles.feedbackItem}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color="#34C759"
                />
                <Text style={styles.feedbackText}>{analysisData.analysis.feedback}</Text>
              </View>
            </View>
          )}

          {analysisData.analysis?.form && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Form Assessment</Text>
              <View style={styles.feedbackItem}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color="#007AFF"
                />
                <Text style={styles.feedbackText}>{analysisData.analysis.form}</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  uploadArea: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  videoName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  analyzeButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  analyzeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  analysisCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#000',
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  feedbackSection: {
    marginTop: 12,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  feedbackText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
