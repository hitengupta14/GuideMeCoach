import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { captureVideo, pickVideoFromLibrary, uploadMedia } from '../../services/camera';
import { useThemeStore } from '../../store/theme';
import ScreenHeader from '../../components/ScreenHeader';

export default function VideoUploadScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState('');
  const [notes, setNotes] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const analysisQuery = useQuery({
    queryKey: ['videoAnalysis', videoId],
    queryFn: async () => {
      if (!videoId) return null;
      return apiClient.getVideoAnalysis(videoId);
    },
    enabled: Boolean(videoId),
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.data?.status as string | undefined;
      if (!status) return false;
      return status !== 'completed' && status !== 'failed' ? 2000 : false;
    },
  });

  const analysisData = (analysisQuery.data as any)?.data;
  const statusLabel = useMemo(() => {
    if (!analysisData?.status) return null;
    if (analysisData.status === 'uploading') return 'Uploading…'
    if (analysisData.status === 'processing') return 'Analyzing…'
    if (analysisData.status === 'completed') return 'Completed'
    if (analysisData.status === 'failed') return 'Failed'
    return String(analysisData.status)
  }, [analysisData?.status])

  const handlePickVideo = async () => {
    try {
      const asset: any = await pickVideoFromLibrary();
      if (!asset?.uri) return;
      setVideoUri(asset.uri);
      setVideoName(asset.fileName || asset.uri.split('/').pop() || 'video');
      setVideoId(null);
      setUploadProgress(0);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to pick video');
    }
  };

  const handleCaptureVideo = async () => {
    try {
      const asset: any = await captureVideo();
      if (!asset?.uri) return;
      setVideoUri(asset.uri);
      setVideoName(asset.fileName || asset.uri.split('/').pop() || 'video');
      setVideoId(null);
      setUploadProgress(0);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to capture video');
    }
  };

  const handleAnalyze = async () => {
    if (!videoUri) {
      Alert.alert('Missing video', 'Select or record a video first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const upload: any = await uploadMedia(
        videoUri,
        'video',
        exerciseName.trim() || undefined,
        (p) => setUploadProgress(p)
      );

      const newVideoId = upload?.videoId as string | undefined;
      if (!newVideoId) {
        throw new Error('Upload did not return a videoId');
      }

      setVideoId(newVideoId);
      await apiClient.analyzeVideo(newVideoId, notes.trim() || undefined);
      await analysisQuery.refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to analyze video');
    } finally {
      setIsUploading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          alignItems: 'center',
          padding: 24,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: 22,
          fontWeight: '800',
          color: colors.text,
          marginTop: 12,
        },
        subtitle: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 6,
          textAlign: 'center',
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: 16,
          marginHorizontal: 16,
          marginTop: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        button: {
          flex: 1,
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
        },
        buttonSecondary: {
          backgroundColor: colors.backgroundSecondary || colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        buttonText: {
          color: colors.textInverse || '#fff',
          fontWeight: '800',
        },
        buttonTextSecondary: {
          color: colors.text,
          fontWeight: '800',
        },
        filePill: {
          marginTop: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        fileText: {
          color: colors.textSecondary,
          fontSize: 12,
          flex: 1,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.text,
          marginTop: 12,
        },
        notesInput: {
          height: 90,
          textAlignVertical: 'top',
        },
        analyzeButton: {
          marginHorizontal: 16,
          marginTop: 16,
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 10,
          opacity: isUploading ? 0.7 : 1,
        },
        analyzeText: {
          color: colors.textInverse || '#fff',
          fontWeight: '900',
          fontSize: 16,
        },
        progressWrap: {
          marginHorizontal: 16,
          marginTop: 10,
        },
        progressLabel: {
          color: colors.textSecondary,
          fontSize: 12,
          marginBottom: 6,
        },
        progressTrack: {
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        progressFill: {
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.primary,
          width: `${Math.round(uploadProgress * 100)}%`,
        },
        resultsTitle: {
          color: colors.text,
          fontWeight: '900',
          fontSize: 16,
          marginBottom: 12,
        },
        statusRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        statusText: {
          color: colors.textSecondary,
          fontSize: 12,
        },
        scoreWrap: {
          backgroundColor: colors.backgroundSecondary || colors.card,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 12,
        },
        scoreLabel: {
          color: colors.textSecondary,
          fontSize: 12,
        },
        scoreValue: {
          color: colors.text,
          fontSize: 34,
          fontWeight: '900',
          marginTop: 4,
        },
        sectionTitle: {
          color: colors.text,
          fontWeight: '800',
          marginTop: 10,
          marginBottom: 8,
        },
        bulletRow: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 10,
        },
        bulletText: {
          flex: 1,
          color: colors.textSecondary,
          fontSize: 13,
          lineHeight: 18,
        },
      }),
    [colors, isUploading, uploadProgress]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Form Analysis"
        subtitle="Upload a short clip (≤30s) and get quick form checkpoints and improvement cues."
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="video" size={22} color={colors.primary} />
          </View>
        }
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >

      <View style={styles.card}>
        <Text style={styles.resultsTitle}>1) Select a video</Text>
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={handleCaptureVideo}>
            <MaterialCommunityIcons name="video-plus" size={18} color={colors.textInverse || '#fff'} />
            <Text style={styles.buttonText}>Record</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handlePickVideo}>
            <MaterialCommunityIcons name="file-video" size={18} color={colors.text} />
            <Text style={styles.buttonTextSecondary}>Choose</Text>
          </TouchableOpacity>
        </View>

        {videoUri && (
          <View style={styles.filePill}>
            <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
            <Text style={styles.fileText} numberOfLines={1}>
              {videoName || 'Video selected'}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Exercise name (optional)"
          placeholderTextColor={colors.textTertiary || colors.textSecondary}
          value={exerciseName}
          onChangeText={setExerciseName}
        />
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Notes (optional): pain, cues you’re focusing on, what feels off…"
          placeholderTextColor={colors.textTertiary || colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <TouchableOpacity
        style={styles.analyzeButton}
        onPress={handleAnalyze}
        disabled={isUploading || analysisQuery.isFetching}
      >
        {isUploading || analysisQuery.isFetching ? (
          <ActivityIndicator color={colors.textInverse || '#fff'} />
        ) : (
          <>
            <MaterialCommunityIcons name="star-circle" size={20} color={colors.textInverse || '#fff'} />
            <Text style={styles.analyzeText}>Analyze Form</Text>
          </>
        )}
      </TouchableOpacity>

      {isUploading && (
        <View style={styles.progressWrap}>
          <Text style={styles.progressLabel}>Uploading… {Math.round(uploadProgress * 100)}%</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>
      )}

      {(analysisQuery.isFetching || analysisData) && (
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <Text style={styles.resultsTitle}>2) Results</Text>
            <Text style={styles.statusText}>
              {statusLabel ? `Status: ${statusLabel}` : analysisQuery.isFetching ? 'Loading…' : ''}
            </Text>
          </View>

          {analysisData?.formScore != null && (
            <View style={styles.scoreWrap}>
              <Text style={styles.scoreLabel}>Form Score</Text>
              <Text style={styles.scoreValue}>{analysisData.formScore}</Text>
            </View>
          )}

          {Array.isArray(analysisData?.improvements) && analysisData.improvements.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Improvements</Text>
              {analysisData.improvements.map((item: string, idx: number) => (
                <View key={idx} style={styles.bulletRow}>
                  <MaterialCommunityIcons name="alert-circle" size={18} color={colors.warning} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </>
          )}

          {Array.isArray(analysisData?.keyPoints) && analysisData.keyPoints.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Checkpoints</Text>
              {analysisData.keyPoints.map((kp: any, idx: number) => {
                const icon =
                  kp?.severity === 'positive'
                    ? 'check-circle'
                    : kp?.severity === 'error'
                      ? 'close-circle'
                      : 'information-outline';
                const color =
                  kp?.severity === 'positive'
                    ? colors.success
                    : kp?.severity === 'error'
                      ? colors.error
                      : colors.primary;
                return (
                  <View key={idx} style={styles.bulletRow}>
                    <MaterialCommunityIcons name={icon as any} size={18} color={color} />
                    <Text style={styles.bulletText}>{kp?.feedback || ''}</Text>
                  </View>
                );
              })}
            </>
          )}
        </View>
      )}
    </ScrollView>
    </View>
  );
}
