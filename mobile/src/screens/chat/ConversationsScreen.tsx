import React, { useState } from 'react';
import { useThemeStore } from '../../store/theme';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import ScreenHeader from '../../components/ScreenHeader';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth';

export default function ConversationsScreen() {
  const nav: any = useNavigation();
  const [topic, setTopic] = useState('general');
  const [title, setTitle] = useState('New Chat');
  const { colors } = useThemeStore();
  const token = useAuthStore((s) => s.token);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations', token],
    enabled: !!token,
    queryFn: () => apiClient.listConversations(),
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.createConversation({ topic, title }),
    onSuccess: async (conv: any) => {
      await refetch();
      nav.navigate('Chat', { conversationId: conv.id, title: conv.title });
    },
  });

  const conversations: any[] = Array.isArray(data) ? data : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Conversations"
        onBackPress={() => nav.goBack()}
        rightAction={
          <TouchableOpacity
            onPress={() => refetch()}
            activeOpacity={0.8}
            style={[styles.headerIconBtn, { backgroundColor: `${colors.primary}14` }]}
            accessibilityRole="button"
            accessibilityLabel="Refresh conversations"
          >
            <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        }
      />

      <View style={[styles.newRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Title"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
        />
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => createMutation.mutate()}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createText}>New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {conversations.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.convRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => nav.navigate('Chat', { conversationId: c.id, title: c.title })}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="message" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.convTitle, { color: colors.text }]}>{c.title}</Text>
                <Text style={[styles.convSub, { color: colors.textSecondary }]}>
                  {new Date(c.updatedAt).toLocaleString()}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  convTitle: { fontSize: 16, fontWeight: '600' },
  convSub: { fontSize: 12, marginTop: 2 },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    ...shadows.sm,
  },
  input: { flex: 1, fontSize: 14, marginRight: spacing.md },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.lg },
  createText: { marginLeft: 6, color: '#fff', fontWeight: '600' },
});
