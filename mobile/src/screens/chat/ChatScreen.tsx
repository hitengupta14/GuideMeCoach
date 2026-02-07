import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../store/theme';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useAIQuota } from '../../hooks/useAIQuota';
import UpgradeModal from '../../components/UpgradeModal';
import ScreenHeader from '../../components/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

export default function ChatScreen() {
  const nav = useNavigation<any>();
  const route: any = useRoute();
  const { conversationId, title } = route.params || {};
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { canAccessFeature, refetch: refetchQuota } = useAIQuota();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    queryFn: () => apiClient.listMessages(conversationId),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      // Check quota before sending message
      if (!canAccessFeature('chat')) {
        setShowUpgradeModal(true);
        throw new Error('Upgrade required');
      }
      return apiClient.addMessage(conversationId, message);
    },
    onSuccess: async () => {
      setMessage('');
      setIsTyping(false);
      await refetch();
      await refetchQuota();
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onError: (error: any) => {
      setIsTyping(false);
      if (error.message !== 'Upgrade required') {
        // Handle other errors
      }
    },
  });

  const messages: any[] = Array.isArray(data) ? data : [];

  useEffect(() => {
    // Keep the latest message in view.
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(id);
  }, [messages.length, isTyping]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={title || 'Chat'}
        onBackPress={() => nav.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh messages"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref;
          }}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing['3xl'] }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.msgBubble,
                {
                  backgroundColor: m.role === 'user' ? `${colors.primary}20` : colors.card,
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.msgText, { color: colors.text }]}>{m.content}</Text>
            </View>
          ))}
          {isTyping && (
            <View
              style={[
                styles.msgBubble,
                { backgroundColor: colors.card, alignSelf: 'flex-start', borderColor: colors.border },
              ]}
            >
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
                <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 0) + spacing.md,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceSecondary }]}
            placeholder="Type a message"
            placeholderTextColor={colors.textTertiary}
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: message ? colors.primary : colors.disabled }]}
            onPress={() => sendMutation.mutate()}
            disabled={!message || sendMutation.isPending}
            activeOpacity={0.85}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Upgrade Modal */}
      <UpgradeModal
        visible={showUpgradeModal}
        feature="chat"
        onClose={() => setShowUpgradeModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { padding: spacing['2xl'], alignItems: 'center' },
  msgBubble: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    maxWidth: '82%',
    borderWidth: 1,
    ...shadows.sm,
  },
  msgText: { fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  sendBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  typingIndicator: { flexDirection: 'row', gap: 4 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },
});
